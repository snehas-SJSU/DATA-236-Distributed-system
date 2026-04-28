import os
import uuid
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..database import reviews_collection, review_events_collection
from ..schemas import ReviewUpdate
from ..dependencies import get_current_user
from ..kafka_producer import publish_event

router = APIRouter(prefix="/reviews", tags=["reviews"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.put("/{review_id}")
async def update_review(
    review_id: str,
    data: ReviewUpdate,
    current_user=Depends(get_current_user),
):
    review = await reviews_collection.find_one({"_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")

    new_rating = data.rating if data.rating is not None else review["rating"]
    new_comment = data.comment if data.comment is not None else review.get("comment")

    if data.rating is not None and (data.rating < 1 or data.rating > 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    # Kafka-first: publish event, worker applies updates to DB
    publish_event(
        topic="review.updated",
        key=review_id,
        data={
            "event": "review.updated",
            "review_id": review_id,
            "restaurant_id": review["restaurant_id"],
            "user_id": review["user_id"],
            "rating": new_rating,
            "comment": new_comment,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    await review_events_collection.update_one(
        {"review_id": review_id},
        {
            "$set": {
                "review_id": review_id,
                "event": "review.updated",
                "status": "queued",
                "restaurant_id": review["restaurant_id"],
                "user_id": review["user_id"],
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    return {
        "id": review_id,
        "restaurant_id": review["restaurant_id"],
        "user_id": review["user_id"],
        "user_name": current_user.name,
        "rating": new_rating,
        "comment": new_comment,
        "photo_urls": review.get("photo_urls"),
        "created_at": review["created_at"].isoformat() if review.get("created_at") else None,
    }


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user=Depends(get_current_user),
):
    review = await reviews_collection.find_one({"_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    restaurant_id = review["restaurant_id"]

    # Publish review.deleted event to Kafka first — worker handles DB delete + rating update
    publish_event(
        topic="review.deleted",
        key=review_id,
        data={
            "event": "review.deleted",
            "review_id": review_id,
            "restaurant_id": restaurant_id,
            "user_id": review["user_id"],
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    await review_events_collection.update_one(
        {"review_id": review_id},
        {
            "$set": {
                "review_id": review_id,
                "event": "review.deleted",
                "status": "queued",
                "restaurant_id": restaurant_id,
                "user_id": review["user_id"],
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    return {"message": "Review deleted"}


@router.get("/{review_id}/status")
async def get_review_processing_status(
    review_id: str,
    current_user=Depends(get_current_user),
):
    status_doc = await review_events_collection.find_one({"review_id": review_id})
    if not status_doc:
        return {"review_id": review_id, "status": "unknown"}

    if status_doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    updated_at = status_doc.get("updated_at")
    return {
        "review_id": review_id,
        "event": status_doc.get("event"),
        "status": status_doc.get("status", "unknown"),
        "error": status_doc.get("error"),
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


@router.post("/{review_id}/photos")
async def upload_review_photos(
    review_id: str,
    files: list[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    review = await reviews_collection.find_one({"_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = list(review.get("photo_urls") or [])
    for file in files:
        ext = os.path.splitext(file.filename or "photo.jpg")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            continue
        filename = f"review_{review_id}_{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        existing.append(f"/uploads/{filename}")

    await reviews_collection.update_one(
        {"_id": review_id}, {"$set": {"photo_urls": existing}}
    )
    review = await reviews_collection.find_one({"_id": review_id})

    return {
        "id": str(review["_id"]),
        "restaurant_id": review["restaurant_id"],
        "user_id": review["user_id"],
        "user_name": current_user.name,
        "rating": review["rating"],
        "comment": review.get("comment"),
        "photo_urls": review.get("photo_urls"),
        "created_at": review["created_at"].isoformat() if review.get("created_at") else None,
    }
