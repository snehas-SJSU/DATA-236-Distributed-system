from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


def new_id() -> str:
    return str(ObjectId())


# ── User ──────────────────────────────────────────────────────────────────────

class User(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    name: str
    email: str
    hashed_password: str
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    about_me: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    languages: Optional[str] = None
    gender: Optional[str] = None

    pref_cuisines_json: Optional[str] = None
    pref_price_range: Optional[str] = None
    pref_locations_json: Optional[str] = None
    pref_search_radius_km: Optional[float] = 10
    pref_dietary_json: Optional[str] = None
    pref_ambiance_json: Optional[str] = None
    pref_sort_by: Optional[str] = "rating"

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ── Owner ─────────────────────────────────────────────────────────────────────

class Owner(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    name: str
    email: str
    hashed_password: str
    restaurant_location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ── Restaurant ────────────────────────────────────────────────────────────────

class Restaurant(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    name: str
    cuisine_type: str
    address: str
    city: str
    state: Optional[str] = None
    zip_code: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    hours_text: Optional[str] = None
    photos: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    price_range: Optional[str] = None
    amenities: Optional[List[str]] = None
    is_open: bool = True

    average_rating: float = 0.0
    review_count: int = 0
    view_count: int = 0

    added_by: Optional[str] = None   # user _id
    owner_id: Optional[str] = None   # owner _id

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ── Review ────────────────────────────────────────────────────────────────────

class Review(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    restaurant_id: str
    user_id: str
    rating: int
    comment: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ── Favorite ──────────────────────────────────────────────────────────────────

class Favorite(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    user_id: str
    restaurant_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ── Session ───────────────────────────────────────────────────────────────────

class Session(BaseModel):
    id: Optional[str] = Field(default_factory=new_id, alias="_id")
    user_id: str
    role: str          # "user" or "owner"
    token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
