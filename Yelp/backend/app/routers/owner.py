from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Owner, Restaurant, Review
from ..schemas import RestaurantCreate, RestaurantOut, RestaurantUpdate, OwnerOut, OwnerUpdate
from ..dependencies import get_current_owner

# This router handles all owner-only endpoints.
router = APIRouter(prefix="/owner", tags=["owner"])


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
    avg_rating = 0.0

    if restaurants:
        rated = [r for r in restaurants if r.review_count > 0]
        if rated:
            avg_rating = round(sum(r.average_rating for r in rated) / len(rated), 2)

    restaurant_ids = [r.id for r in restaurants]
    recent_reviews = []

    if restaurant_ids:
        reviews = (
            db.query(Review)
            .filter(Review.restaurant_id.in_(restaurant_ids))
            .order_by(Review.created_at.desc())
            .limit(10)
            .all()
        )

        for rev in reviews:
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