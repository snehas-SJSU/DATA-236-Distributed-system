import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Review, Restaurant, User
from ..schemas import ReviewUpdate
from ..dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.put("/{review_id}")
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")

    if data.rating is not None:
        if data.rating < 1 or data.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be 1-5")
        review.rating = data.rating
    if data.comment is not None:
        review.comment = data.comment

    # Recalculate restaurant rating
    restaurant = db.query(Restaurant).filter(Restaurant.id == review.restaurant_id).first()
    if restaurant:
        restaurant.recalculate_rating()

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


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    # Load restaurant BEFORE deleting the review
    restaurant = db.query(Restaurant).filter(Restaurant.id == review.restaurant_id).first()

    db.delete(review)
    db.flush()  # execute DELETE in DB within transaction

    # Expire the restaurant so its .reviews collection reloads from DB (without deleted review)
    if restaurant:
        db.expire(restaurant)
        db.refresh(restaurant)
        restaurant.recalculate_rating()

    db.commit()
    return {"message": "Review deleted"}


@router.post("/{review_id}/photos")
async def upload_review_photos(
    review_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Attach photos to an existing review (owner only)."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = list(review.photo_urls or [])
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

    review.photo_urls = existing
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
