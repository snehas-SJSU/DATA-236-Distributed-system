import math
import os
import uuid
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query

from ..database import (
    restaurants_collection,
    reviews_collection,
    review_events_collection,
    favorites_collection,
    users_collection,
)
from ..schemas import RestaurantCreate, RestaurantUpdate, ReviewCreate
from ..dependencies import get_current_user, get_optional_user
from ..kafka_producer import publish_event
from datetime import datetime

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _serialize(doc: dict, user=None) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.setdefault("is_favorited", False)
    if user:
        doc["is_favorited"] = doc.get("_favorited", False)
    doc.pop("_favorited", None)
    return doc


async def _with_favorite_flag(doc: dict, user) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc["is_favorited"] = False
    if user:
        fav = await favorites_collection.find_one(
            {"user_id": user.id, "restaurant_id": doc["id"]}
        )
        doc["is_favorited"] = fav is not None
    return doc


async def _recalculate_rating(restaurant_id: str):
    reviews = await reviews_collection.find(
        {"restaurant_id": restaurant_id}
    ).to_list(length=None)
    if reviews:
        avg = round(sum(r["rating"] for r in reviews) / len(reviews), 2)
        count = len(reviews)
    else:
        avg = 0.0
        count = 0
    await restaurants_collection.update_one(
        {"_id": restaurant_id},
        {"$set": {"average_rating": avg, "review_count": count}},
    )


# ── Search ────────────────────────────────────────────────────────────────────
@router.get("/search")
async def search_restaurants(
    q: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    price_range: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("rating"),
    open_now: Optional[bool] = Query(None),
    keywords: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(get_optional_user),
):
    mongo_filter = {}
    conditions = []

    if q:
        regex = {"$regex": q, "$options": "i"}
        conditions.append({"$or": [
            {"name": regex},
            {"cuisine_type": regex},
            {"description": regex},
            {"city": regex},
            {"keywords": regex},
            {"amenities": regex},
        ]})

    if cuisine:
        conditions.append({"cuisine_type": {"$regex": cuisine, "$options": "i"}})

    if location:
        loc_parts = [p.strip() for p in location.replace(",", " ").split() if len(p.strip()) > 1]
        loc_or = []
        for part in loc_parts:
            r = {"$regex": part, "$options": "i"}
            loc_or.extend([
                {"city": r}, {"address": r}, {"zip_code": r}, {"state": r}
            ])
        if loc_or:
            conditions.append({"$or": loc_or})

    if price_range:
        conditions.append({"price_range": price_range})

    if open_now is not None:
        conditions.append({"is_open": open_now})

    if keywords:
        kr = {"$regex": keywords, "$options": "i"}
        conditions.append({"$or": [{"keywords": kr}, {"amenities": kr}]})

    if conditions:
        mongo_filter = {"$and": conditions}

    sort_field = "average_rating"
    sort_dir = -1
    if sort_by == "review_count":
        sort_field = "review_count"
    elif sort_by == "price":
        sort_field = "price_range"
        sort_dir = 1
    elif sort_by == "newest":
        sort_field = "created_at"

    total = await restaurants_collection.count_documents(mongo_filter)
    total_pages = max(1, math.ceil(total / limit))
    docs = await restaurants_collection.find(mongo_filter).sort(
        sort_field, sort_dir
    ).skip((page - 1) * limit).limit(limit).to_list(length=limit)

    items = [await _with_favorite_flag(doc, current_user) for doc in docs]
    return {"restaurants": items, "total": total, "page": page, "total_pages": total_pages}


# ── Favorites list ─────────────────────────────────────────────────────────────
@router.get("/favorites")
async def get_favorites(current_user=Depends(get_current_user)):
    favs = await favorites_collection.find({"user_id": current_user.id}).to_list(length=None)
    result = []
    for fav in favs:
        doc = await restaurants_collection.find_one({"_id": fav["restaurant_id"]})
        if doc:
            r = await _with_favorite_flag(doc, current_user)
            result.append(r)
    return result


# ── Get all ────────────────────────────────────────────────────────────────────
@router.get("")
async def get_all(current_user=Depends(get_optional_user)):
    docs = await restaurants_collection.find().sort(
        "average_rating", -1
    ).limit(50).to_list(length=50)
    return [await _with_favorite_flag(doc, current_user) for doc in docs]


# ── Get by id ──────────────────────────────────────────────────────────────────
@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: str, current_user=Depends(get_optional_user)):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    await restaurants_collection.update_one(
        {"_id": restaurant_id},
        {"$inc": {"view_count": 1}},
    )
    doc["view_count"] = (doc.get("view_count") or 0) + 1
    return await _with_favorite_flag(doc, current_user)


# ── Create ─────────────────────────────────────────────────────────────────────
@router.post("")
async def create_restaurant(data: RestaurantCreate, current_user=Depends(get_current_user)):
    restaurant_id = str(ObjectId())
    doc = {
        "_id": restaurant_id,
        **data.model_dump(),
        "added_by": current_user.id,
        "average_rating": 0.0,
        "review_count": 0,
        "view_count": 0,
        "created_at": datetime.utcnow(),
    }
    await restaurants_collection.insert_one(doc)

    # Publish restaurant.created event to Kafka
    publish_event(
        topic="restaurant.created",
        key=restaurant_id,
        data={
            "event": "restaurant.created",
            "restaurant_id": restaurant_id,
            "name": data.name,
            "cuisine_type": data.cuisine_type,
            "city": data.city,
            "added_by": current_user.id,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return await _with_favorite_flag(doc, current_user)


# ── Update ─────────────────────────────────────────────────────────────────────
@router.put("/{restaurant_id}")
async def update_restaurant(
    restaurant_id: str,
    data: RestaurantUpdate,
    current_user=Depends(get_current_user),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("added_by") != current_user.id:
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
            "updated_by": current_user.id,
            "updated_fields": list(updates.keys()),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return await _with_favorite_flag(doc, current_user)


# ── Delete ─────────────────────────────────────────────────────────────────────
@router.delete("/{restaurant_id}")
async def delete_restaurant(restaurant_id: str, current_user=Depends(get_current_user)):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("added_by") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this restaurant")
    await restaurants_collection.delete_one({"_id": restaurant_id})
    return {"message": "Restaurant deleted"}


# ── Upload photos ──────────────────────────────────────────────────────────────
@router.post("/{restaurant_id}/photos")
async def upload_photos(
    restaurant_id: str,
    files: list[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if doc.get("added_by") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload photos")

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
    return await _with_favorite_flag(doc, current_user)


# ── Favorite / Unfavorite ──────────────────────────────────────────────────────
@router.post("/{restaurant_id}/favorite")
async def favorite(restaurant_id: str, current_user=Depends(get_current_user)):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    existing = await favorites_collection.find_one(
        {"user_id": current_user.id, "restaurant_id": restaurant_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")

    await favorites_collection.insert_one({
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "restaurant_id": restaurant_id,
        "created_at": datetime.utcnow(),
    })
    return {"message": "Added to favorites"}


@router.delete("/{restaurant_id}/favorite")
async def unfavorite(restaurant_id: str, current_user=Depends(get_current_user)):
    result = await favorites_collection.delete_one(
        {"user_id": current_user.id, "restaurant_id": restaurant_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in favorites")
    return {"message": "Removed from favorites"}


# ── Reviews ────────────────────────────────────────────────────────────────────
@router.get("/{restaurant_id}/reviews")
async def get_reviews(restaurant_id: str):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    review_docs = await reviews_collection.find(
        {"restaurant_id": restaurant_id}
    ).to_list(length=None)

    out = []
    for rev in review_docs:
        user_doc = await users_collection.find_one({"_id": rev["user_id"]})
        out.append({
            "id": str(rev["_id"]),
            "restaurant_id": rev["restaurant_id"],
            "user_id": rev["user_id"],
            "user_name": user_doc["name"] if user_doc else "Anonymous",
            "rating": rev["rating"],
            "comment": rev.get("comment"),
            "photo_urls": rev.get("photo_urls"),
            "created_at": rev["created_at"].isoformat() if rev.get("created_at") else None,
        })
    return out


@router.post("/{restaurant_id}/reviews")
async def create_review(
    restaurant_id: str,
    data: ReviewCreate,
    current_user=Depends(get_current_user),
):
    doc = await restaurants_collection.find_one({"_id": restaurant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    existing_review = await reviews_collection.find_one(
        {"restaurant_id": restaurant_id, "user_id": current_user.id}
    )
    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this restaurant. Please edit your existing review.",
        )

    review_id = str(ObjectId())
    now = datetime.utcnow()

    # Kafka-first: publish event, worker writes to DB
    publish_event(
        topic="review.created",
        key=review_id,
        data={
            "event": "review.created",
            "review_id": review_id,
            "restaurant_id": restaurant_id,
            "user_id": current_user.id,
            "user_name": current_user.name,
            "rating": data.rating,
            "comment": data.comment,
            "created_at": now.isoformat(),
        },
    )

    # Frontend can poll this status until the worker confirms processing.
    await review_events_collection.update_one(
        {"review_id": review_id},
        {
            "$set": {
                "review_id": review_id,
                "event": "review.created",
                "status": "queued",
                "restaurant_id": restaurant_id,
                "user_id": current_user.id,
                "updated_at": now,
            }
        },
        upsert=True,
    )

    return {
        "id": review_id,
        "restaurant_id": restaurant_id,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "rating": data.rating,
        "comment": data.comment,
        "photo_urls": [],
        "created_at": now.isoformat(),
    }
