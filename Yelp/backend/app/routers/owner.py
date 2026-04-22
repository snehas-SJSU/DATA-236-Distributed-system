import os
import uuid
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..database import owners_collection, restaurants_collection, reviews_collection, users_collection
from ..schemas import RestaurantCreate, RestaurantUpdate, OwnerOut, OwnerUpdate
from ..dependencies import get_current_owner
from ..kafka_producer import publish_event

router = APIRouter(prefix="/owner", tags=["owner"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _serialize_restaurant(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def _owner_out(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return OwnerOut(**doc).model_dump()


@router.get("/dashboard")
async def dashboard(current_owner=Depends(get_current_owner)):
    rest_docs = await restaurants_collection.find(
        {"owner_id": current_owner.id}
    ).to_list(length=None)

    total_reviews = sum(r.get("review_count", 0) for r in rest_docs)
    total_views = sum(r.get("view_count", 0) for r in rest_docs)
    avg_rating = 0.0

    if rest_docs:
        rated = [r for r in rest_docs if r.get("review_count", 0) > 0]
        if rated:
            avg_rating = round(
                sum(r.get("average_rating", 0) for r in rated) / len(rated), 2
            )

    restaurant_ids = [str(r["_id"]) for r in rest_docs]
    recent_reviews = []
    ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    sentiment = {"positive": 0, "neutral": 0, "negative": 0}

    if restaurant_ids:
        review_docs = await reviews_collection.find(
            {"restaurant_id": {"$in": restaurant_ids}}
        ).sort("created_at", -1).to_list(length=None)

        for rev in review_docs:
            rating = rev.get("rating", 0)
            if rating in ratings_distribution:
                ratings_distribution[rating] += 1
            if rating >= 4:
                sentiment["positive"] += 1
            elif rating == 3:
                sentiment["neutral"] += 1
            else:
                sentiment["negative"] += 1

        for rev in review_docs[:10]:
            user_doc = await users_collection.find_one({"_id": rev.get("user_id")})
            recent_reviews.append({
                "id": str(rev["_id"]),
                "restaurant_id": rev["restaurant_id"],
                "user_id": rev.get("user_id"),
                "user_name": user_doc["name"] if user_doc else "Anonymous",
                "rating": rev.get("rating"),
                "comment": rev.get("comment"),
                "photo_urls": rev.get("photo_urls"),
                "created_at": rev["created_at"].isoformat() if rev.get("created_at") else None,
            })

    return {
        "analytics": {
            "restaurant_count": len(rest_docs),
            "review_count": total_reviews,
            "average_rating": avg_rating,
            "total_views": total_views,
            "ratings_distribution": ratings_distribution,
            "sentiment": sentiment,
        },
        "restaurants": [_serialize_restaurant(r) for r in rest_docs],
        "recent_reviews": recent_reviews,
    }


@router.get("/profile")
async def get_owner_profile(current_owner=Depends(get_current_owner)):
    doc = await owners_collection.find_one({"_id": current_owner.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Owner not found")
    return _owner_out(doc)


@router.put("/profile")
async def update_owner_profile(
    data: OwnerUpdate,
    current_owner=Depends(get_current_owner),
):
    updates = data.model_dump(exclude_none=True)
    await owners_collection.update_one({"_id": current_owner.id}, {"$set": updates})
    doc = await owners_collection.find_one({"_id": current_owner.id})
    return _owner_out(doc)


@router.post("/restaurants")
async def create_restaurant(
    data: RestaurantCreate,
    current_owner=Depends(get_current_owner),
):
    restaurant_id = str(ObjectId())
    doc = {
        "_id": restaurant_id,
        **data.model_dump(),
        "owner_id": current_owner.id,
        "average_rating": 0.0,
        "review_count": 0,
        "view_count": 0,
        "created_at": datetime.utcnow(),
    }
    await restaurants_collection.insert_one(doc)
    return _serialize_restaurant(doc)


@router.post("/restaurants/{restaurant_id}/claim")
async def claim_restaurant(
    restaurant_id: str,
    current_owner=Depends(get_current_owner),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("owner_id"):
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    await restaurants_collection.update_one(
        {"_id": restaurant_id}, {"$set": {"owner_id": current_owner.id}}
    )
    doc = await restaurants_collection.find_one({"_id": restaurant_id})

    publish_event(
        topic="restaurant.claimed",
        key=restaurant_id,
        data={
            "event": "restaurant.claimed",
            "restaurant_id": restaurant_id,
            "owner_id": current_owner.id,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return _serialize_restaurant(doc)


@router.put("/restaurants/{restaurant_id}")
async def update_restaurant(
    restaurant_id: str,
    data: RestaurantUpdate,
    current_owner=Depends(get_current_owner),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("owner_id") != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    updates = data.model_dump(exclude_none=True)
    await restaurants_collection.update_one({"_id": restaurant_id}, {"$set": updates})
    doc = await restaurants_collection.find_one({"_id": restaurant_id})

    publish_event(
        topic="restaurant.updated",
        key=restaurant_id,
        data={
            "event": "restaurant.updated",
            "restaurant_id": restaurant_id,
            "updated_by": current_owner.id,
            "updated_fields": list(updates.keys()),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return _serialize_restaurant(doc)


@router.post("/restaurants/{restaurant_id}/photos")
async def upload_restaurant_photos(
    restaurant_id: str,
    files: list[UploadFile] = File(...),
    current_owner=Depends(get_current_owner),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("owner_id") != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = list(doc.get("photos") or [])
    for file in files:
        ext = os.path.splitext(file.filename or "photo.jpg")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            continue
        filename = f"rest_{restaurant_id}_{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        existing.append(f"/uploads/{filename}")

    await restaurants_collection.update_one(
        {"_id": restaurant_id}, {"$set": {"photos": existing}}
    )
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    return _serialize_restaurant(doc)


@router.get("/restaurants/{restaurant_id}/reviews")
async def get_restaurant_reviews(
    restaurant_id: str,
    sort_by: str = "newest",
    min_rating: int = None,
    current_owner=Depends(get_current_owner),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("owner_id") != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    review_docs = await reviews_collection.find(
        {"restaurant_id": restaurant_id}
    ).to_list(length=None)

    if min_rating:
        review_docs = [r for r in review_docs if r.get("rating", 0) >= min_rating]

    reverse = sort_by in ("newest", "highest")
    if sort_by in ("newest", "oldest"):
        review_docs.sort(key=lambda r: r.get("created_at", datetime.min), reverse=reverse)
    elif sort_by in ("highest", "lowest"):
        review_docs.sort(key=lambda r: r.get("rating", 0), reverse=reverse)

    result = []
    for rev in review_docs:
        user_doc = await users_collection.find_one({"_id": rev.get("user_id")})
        result.append({
            "id": str(rev["_id"]),
            "restaurant_id": rev["restaurant_id"],
            "user_id": rev.get("user_id"),
            "user_name": user_doc["name"] if user_doc else "Anonymous",
            "rating": rev.get("rating"),
            "comment": rev.get("comment"),
            "photo_urls": rev.get("photo_urls"),
            "created_at": rev["created_at"].isoformat() if rev.get("created_at") else None,
        })

    return result
