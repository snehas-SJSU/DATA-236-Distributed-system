import json, os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Review, Restaurant
from ..schemas import UserOut, UserUpdate, PreferencesUpdate, ReviewOut, RestaurantOut, HistoryResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["users"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.email and data.email.lower() != current_user.email:
        existing = db.query(User).filter(User.email == data.email.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    for field, value in data.model_dump(exclude_none=True).items():
        if field == "email" and value:
            value = value.lower()
        if field == "state" and value:
            value = value.upper()
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/preferences", response_model=UserOut)
def update_preferences(data: PreferencesUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.pref_cuisines_json = json.dumps(data.cuisines or [])
    current_user.pref_price_range = data.price_range
    current_user.pref_locations_json = json.dumps(data.locations or [])
    current_user.pref_search_radius_km = data.search_radius_km or 10
    current_user.pref_dietary_json = json.dumps(data.dietary_needs or [])
    current_user.pref_ambiance_json = json.dumps(data.ambiance or [])
    current_user.pref_sort_by = data.sort_by or "rating"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/profile/photo", response_model=UserOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "photo.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"profile_{current_user.id}_{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)

    current_user.profile_picture = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/history", response_model=HistoryResponse)
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
    review_outs = []
    for r in reviews:
        restaurant_name = r.restaurant.name if r.restaurant else "Unknown Restaurant"
        restaurant_image = None
        restaurant_photos = []

        if r.restaurant:
            restaurant_photos = r.restaurant.photos or []
            restaurant_image = restaurant_photos[0] if restaurant_photos else r.restaurant.image

        review_outs.append({
            "id": r.id,
            "restaurant_id": r.restaurant_id,
            "restaurant_name": restaurant_name,
            "restaurant_image": restaurant_image,
            "restaurant_photos": restaurant_photos,
            "user_id": r.user_id,
            "user_name": current_user.name,
            "rating": r.rating,
            "comment": r.comment,
            "photo_urls": r.photo_urls,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    restaurants = db.query(Restaurant).filter(Restaurant.added_by == current_user.id).all()
    restaurants_out = [RestaurantOut.model_validate(r).model_dump() for r in restaurants]
    return {"reviews": review_outs, "restaurants_added": restaurants_out}
