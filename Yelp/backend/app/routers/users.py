import json
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..database import users_collection, reviews_collection, restaurants_collection
from ..schemas import UserOut, UserUpdate, PreferencesUpdate, ReviewOut, RestaurantOut, HistoryResponse
from ..dependencies import get_current_user
from ..kafka_producer import publish_event

router = APIRouter(prefix="/user", tags=["users"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _user_out(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return UserOut(**doc).model_dump()


def _restaurant_out(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return RestaurantOut(**doc).model_dump()


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    doc = await users_collection.find_one({"_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(doc)


@router.put("/profile")
async def update_profile(data: UserUpdate, current_user=Depends(get_current_user)):
    updates = data.model_dump(exclude_none=True)

    if "email" in updates:
        updates["email"] = updates["email"].lower()
        existing = await users_collection.find_one({"email": updates["email"]})
        if existing and str(existing["_id"]) != current_user.id:
            raise HTTPException(status_code=400, detail="Email already in use")

    if "state" in updates and updates["state"]:
        updates["state"] = updates["state"].upper()

    await users_collection.update_one({"_id": current_user.id}, {"$set": updates})
    doc = await users_collection.find_one({"_id": current_user.id})

    publish_event(
        topic="user.updated",
        key=current_user.id,
        data={
            "event": "user.updated",
            "user_id": current_user.id,
            "updated_fields": list(updates.keys()),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return _user_out(doc)


@router.put("/preferences")
async def update_preferences(data: PreferencesUpdate, current_user=Depends(get_current_user)):
    updates = {
        "pref_cuisines_json": json.dumps(data.cuisines or []),
        "pref_price_range": data.price_range,
        "pref_locations_json": json.dumps(data.locations or []),
        "pref_search_radius_km": data.search_radius_km or 10,
        "pref_dietary_json": json.dumps(data.dietary_needs or []),
        "pref_ambiance_json": json.dumps(data.ambiance or []),
        "pref_sort_by": data.sort_by or "rating",
    }
    await users_collection.update_one({"_id": current_user.id}, {"$set": updates})
    doc = await users_collection.find_one({"_id": current_user.id})
    return _user_out(doc)


@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "photo.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"profile_{current_user.id}_{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)

    profile_picture = f"/uploads/{filename}"
    await users_collection.update_one(
        {"_id": current_user.id},
        {"$set": {"profile_picture": profile_picture}},
    )
    doc = await users_collection.find_one({"_id": current_user.id})
    return _user_out(doc)


@router.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    # Fetch all reviews by this user
    review_docs = await reviews_collection.find({"user_id": current_user.id}).to_list(length=None)
    review_outs = []

    for r in review_docs:
        restaurant_doc = await restaurants_collection.find_one({"_id": r["restaurant_id"]})
        restaurant_name = restaurant_doc["name"] if restaurant_doc else "Unknown Restaurant"
        restaurant_photos = restaurant_doc.get("photos") or [] if restaurant_doc else []
        restaurant_image = restaurant_photos[0] if restaurant_photos else None

        review_outs.append({
            "id": str(r["_id"]),
            "restaurant_id": r["restaurant_id"],
            "restaurant_name": restaurant_name,
            "restaurant_image": restaurant_image,
            "restaurant_photos": restaurant_photos,
            "user_id": r["user_id"],
            "user_name": current_user.name,
            "rating": r["rating"],
            "comment": r.get("comment"),
            "photo_urls": r.get("photo_urls"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        })

    # Fetch all restaurants added by this user
    rest_docs = await restaurants_collection.find({"added_by": current_user.id}).to_list(length=None)
    restaurants_out = []
    for doc in rest_docs:
        try:
            restaurants_out.append(_restaurant_out(doc))
        except Exception:
            pass

    return {"reviews": review_outs, "restaurants_added": restaurants_out}
