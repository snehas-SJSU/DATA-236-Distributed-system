import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Owner, Restaurant, Review
from ..schemas import RestaurantCreate, RestaurantOut, RestaurantUpdate, OwnerOut, OwnerUpdate
from ..dependencies import get_current_owner

# This router handles all owner-only endpoints.
router = APIRouter(prefix="/owner", tags=["owner"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# This helper converts a Restaurant model into API response format.
def _serialize_restaurant(r: Restaurant) -> dict:
    return RestaurantOut.model_validate(r).model_dump()


# This endpoint returns dashboard analytics, owned restaurants, and recent reviews.
@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_owner.id).all()

    total_reviews = sum(r.review_count for r in restaurants)
    total_views = sum(r.view_count or 0 for r in restaurants)
    avg_rating = 0.0

    if restaurants:
        rated = [r for r in restaurants if r.review_count > 0]
        if rated:
            avg_rating = round(sum(r.average_rating for r in rated) / len(rated), 2)

    restaurant_ids = [r.id for r in restaurants]
    recent_reviews = []
    ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    sentiment = {"positive": 0, "neutral": 0, "negative": 0}

    if restaurant_ids:
        reviews = (
            db.query(Review)
            .filter(Review.restaurant_id.in_(restaurant_ids))
            .order_by(Review.created_at.desc())
            .all()
        )

        for rev in reviews:
            # Ratings distribution
            if rev.rating in ratings_distribution:
                ratings_distribution[rev.rating] += 1
            # Simple sentiment bucketing: 4-5 = positive, 3 = neutral, 1-2 = negative
            if rev.rating >= 4:
                sentiment["positive"] += 1
            elif rev.rating == 3:
                sentiment["neutral"] += 1
            else:
                sentiment["negative"] += 1

        for rev in reviews[:10]:
            recent_reviews.append(
                {
                    "id": rev.id,
                    "restaurant_id": rev.restaurant_id,
                    "user_id": rev.user_id,
                    "user_name": rev.user.name if rev.user else "Anonymous",
                    "rating": rev.rating,
                    "comment": rev.comment,
                    "photo_urls": rev.photo_urls,
                    "created_at": rev.created_at.isoformat(),
                }
            )

    return {
        "analytics": {
            "restaurant_count": len(restaurants),
            "review_count": total_reviews,
            "average_rating": avg_rating,
            "total_views": total_views,
            "ratings_distribution": ratings_distribution,
            "sentiment": sentiment,
        },
        "restaurants": [_serialize_restaurant(r) for r in restaurants],
        "recent_reviews": recent_reviews,
    }


# This endpoint returns the currently logged-in owner's profile.
@router.get("/profile", response_model=OwnerOut)
def get_owner_profile(current_owner: Owner = Depends(get_current_owner)):
    return current_owner


# This endpoint updates the currently logged-in owner's profile fields.
@router.put("/profile", response_model=OwnerOut)
def update_owner_profile(
    data: OwnerUpdate,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_owner, field, value)

    db.commit()
    db.refresh(current_owner)
    return current_owner


# This endpoint lets an owner create a new restaurant under their account.
@router.post("/restaurants", response_model=RestaurantOut)
def create_restaurant(
    data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurant = Restaurant(**data.model_dump(), owner_id=current_owner.id)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return _serialize_restaurant(restaurant)


# This endpoint lets an owner claim an existing unclaimed restaurant.
@router.post("/restaurants/{restaurant_id}/claim")
def claim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.owner_id:
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    restaurant.owner_id = current_owner.id
    db.commit()
    db.refresh(restaurant)
    return _serialize_restaurant(restaurant)


# This endpoint lets an owner update one of their own restaurants.
@router.put("/restaurants/{restaurant_id}")
def update_restaurant(
    restaurant_id: int,
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(restaurant, field, value)

    db.commit()
    db.refresh(restaurant)
    return _serialize_restaurant(restaurant)


# This endpoint lets an owner upload photos to their restaurant.
@router.post("/restaurants/{restaurant_id}/photos")
async def upload_restaurant_photos(
    restaurant_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = list(restaurant.photos or [])
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

    restaurant.photos = existing
    db.commit()
    db.refresh(restaurant)
    return _serialize_restaurant(restaurant)


# This endpoint returns all reviews for a specific restaurant owned by the current owner, with filter/sort.
@router.get("/restaurants/{restaurant_id}/reviews")
def get_restaurant_reviews(
    restaurant_id: int,
    sort_by: str = "newest",
    min_rating: int = None,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    reviews = list(restaurant.reviews or [])

    if min_rating:
        reviews = [r for r in reviews if r.rating >= min_rating]

    if sort_by == "newest":
        reviews.sort(key=lambda r: r.created_at, reverse=True)
    elif sort_by == "oldest":
        reviews.sort(key=lambda r: r.created_at)
    elif sort_by == "highest":
        reviews.sort(key=lambda r: r.rating, reverse=True)
    elif sort_by == "lowest":
        reviews.sort(key=lambda r: r.rating)

    return [
        {
            "id": r.id,
            "restaurant_id": r.restaurant_id,
            "user_id": r.user_id,
            "user_name": r.user.name if r.user else "Anonymous",
            "rating": r.rating,
            "comment": r.comment,
            "photo_urls": r.photo_urls,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]