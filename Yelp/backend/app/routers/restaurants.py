import os, uuid, math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..database import get_db
from ..models import Restaurant, Favorite, User
from ..schemas import RestaurantCreate, RestaurantUpdate, RestaurantOut, RestaurantListResponse
from ..dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _serialize(restaurant: Restaurant, user: User | None = None) -> dict:
    is_favorited = False
    if user:
        is_favorited = any(f.user_id == user.id for f in (restaurant.favorites or []))
    d = RestaurantOut.model_validate(restaurant).model_dump()
    d["is_favorited"] = is_favorited
    return d


# ── Search (must be before /{id}) ─────────────────────────────────────────────
@router.get("/search")
def search_restaurants(
    q: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    price_range: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("rating"),
    open_now: Optional[bool] = Query(None),
    keywords: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    query = db.query(Restaurant)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Restaurant.name.ilike(search),
                Restaurant.cuisine_type.ilike(search),
                Restaurant.description.ilike(search),
                Restaurant.city.ilike(search),
            )
        )
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    if location:
        # Split "San Jose, CA" → ["San Jose", "CA"] and search each part
        # This handles: "San Jose", "San Jose, CA", "CA", "95112" etc.
        loc_parts = [p.strip() for p in location.replace(",", " ").split() if len(p.strip()) > 1]
        loc_conditions = []
        for part in loc_parts:
            part_search = f"%{part}%"
            loc_conditions.append(Restaurant.city.ilike(part_search))
            loc_conditions.append(Restaurant.address.ilike(part_search))
            loc_conditions.append(Restaurant.zip_code.ilike(part_search))
            loc_conditions.append(Restaurant.state.ilike(part_search))
        if loc_conditions:
            query = query.filter(or_(*loc_conditions))
    if price_range:
        query = query.filter(Restaurant.price_range == price_range)
    if open_now is not None:
        query = query.filter(Restaurant.is_open == open_now)

    # Keyword search — keywords stored as JSON array; cast to text for LIKE search
    if keywords:
        from sqlalchemy import cast, Text
        kw_search = f"%{keywords}%"
        query = query.filter(cast(Restaurant.keywords, Text).ilike(kw_search))

    # Sort
    if sort_by == "rating":
        query = query.order_by(Restaurant.average_rating.desc(), Restaurant.created_at.desc())
    elif sort_by == "review_count":
        query = query.order_by(Restaurant.review_count.desc(), Restaurant.created_at.desc())
    elif sort_by == "price":
        query = query.order_by(Restaurant.price_range.asc(), Restaurant.created_at.desc())
    elif sort_by == "newest":
        query = query.order_by(Restaurant.created_at.desc())
    else:
        query = query.order_by(Restaurant.created_at.desc())

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    items = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "restaurants": [_serialize(r, current_user) for r in items],
        "total": total,
        "page": page,
        "total_pages": total_pages,
    }


# ── Favorites list (must be before /{id}) ─────────────────────────────────────
@router.get("/favorites")
def get_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return [_serialize(f.restaurant, current_user) for f in favs]


# ── Get all ───────────────────────────────────────────────────────────────────
@router.get("")
def get_all(db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    items = db.query(Restaurant).order_by(Restaurant.average_rating.desc()).limit(50).all()
    return [_serialize(r, current_user) for r in items]


# ── Get by id ─────────────────────────────────────────────────────────────────
@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_user)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return _serialize(r, current_user)


# ── Create ────────────────────────────────────────────────────────────────────
@router.post("")
def create_restaurant(data: RestaurantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = Restaurant(**data.model_dump(), added_by=current_user.id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return _serialize(r, current_user)


# ── Update ────────────────────────────────────────────────────────────────────
@router.put("/{restaurant_id}")
def update_restaurant(restaurant_id: int, data: RestaurantUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.added_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return _serialize(r, current_user)


# ── Upload photos ─────────────────────────────────────────────────────────────
@router.post("/{restaurant_id}/photos")
async def upload_photos(
    restaurant_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    existing = list(r.photos or [])
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

    r.photos = existing
    db.commit()
    db.refresh(r)
    return _serialize(r, current_user)


# ── Favorite / Unfavorite ─────────────────────────────────────────────────────
@router.post("/{restaurant_id}/favorite")
def favorite(restaurant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    existing = db.query(Favorite).filter(
        and_(Favorite.user_id == current_user.id, Favorite.restaurant_id == restaurant_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")
    fav = Favorite(user_id=current_user.id, restaurant_id=restaurant_id)
    db.add(fav)
    db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{restaurant_id}/favorite")
def unfavorite(restaurant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fav = db.query(Favorite).filter(
        and_(Favorite.user_id == current_user.id, Favorite.restaurant_id == restaurant_id)
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")
    db.delete(fav)
    db.commit()
    return {"message": "Removed from favorites"}


# ── Reviews ───────────────────────────────────────────────────────────────────
from ..models import Review
from ..schemas import ReviewCreate, ReviewOut

@router.get("/{restaurant_id}/reviews")
def get_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    out = []
    for rev in r.reviews:
        out.append({
            "id": rev.id,
            "restaurant_id": rev.restaurant_id,
            "user_id": rev.user_id,
            "user_name": rev.user.name if rev.user else "Anonymous",
            "rating": rev.rating,
            "comment": rev.comment,
            "photo_urls": rev.photo_urls,
            "created_at": rev.created_at.isoformat(),
        })
    return out


@router.post("/{restaurant_id}/reviews")
def create_review(
    restaurant_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    review = Review(
        restaurant_id=restaurant_id,
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    r.reviews.append(review)
    db.flush()
    r.recalculate_rating()
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "restaurant_id": review.restaurant_id,
        "user_id": review.user_id,
        "user_name": current_user.name,
        "rating": review.rating,
        "comment": review.comment,
        "photo_urls": review.photo_urls,
        "created_at": review.created_at.isoformat(),
    }
