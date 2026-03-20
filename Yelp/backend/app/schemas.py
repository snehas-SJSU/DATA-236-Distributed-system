from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# This section defines request and response schemas for auth.
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OwnerSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    restaurant_location: Optional[str] = None


class OwnerLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# This section defines user profile output schema.
class UserOut(BaseModel):
    id: int
    name: str
    email: str
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
    pref_search_radius_km: Optional[float] = None
    pref_dietary_json: Optional[str] = None
    pref_ambiance_json: Optional[str] = None
    pref_sort_by: Optional[str] = None

    class Config:
        from_attributes = True


# This section defines user profile fields that can be updated.
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    about_me: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    languages: Optional[str] = None
    gender: Optional[str] = None


# This section defines user preference fields that can be updated.
class PreferencesUpdate(BaseModel):
    cuisines: Optional[List[str]] = []
    price_range: Optional[str] = None
    locations: Optional[List[str]] = []
    search_radius_km: Optional[float] = 10
    dietary_needs: Optional[List[str]] = []
    ambiance: Optional[List[str]] = []
    sort_by: Optional[str] = "rating"


# This section defines owner profile output schema.
class OwnerOut(BaseModel):
    id: int
    name: str
    email: str
    restaurant_location: Optional[str] = None

    class Config:
        from_attributes = True


# This section defines owner profile fields that can be updated.
class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    restaurant_location: Optional[str] = None


# This section defines restaurant creation input schema.
class RestaurantCreate(BaseModel):
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
    is_open: Optional[bool] = True


# This section defines restaurant update input schema.
class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
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
    is_open: Optional[bool] = None


# This section defines restaurant output schema.
class RestaurantOut(BaseModel):
    id: int
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
    owner_id: Optional[int] = None
    is_favorited: Optional[bool] = False

    class Config:
        from_attributes = True


# This section defines restaurant list response schema.
class RestaurantListResponse(BaseModel):
    restaurants: List[RestaurantOut]
    total: int
    page: int
    total_pages: int


# This section defines review creation input schema.
class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


# This section defines review update input schema.
class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None


# This section defines review output schema.
class ReviewOut(BaseModel):
    id: int
    restaurant_id: int
    user_id: int
    user_name: str
    restaurant_name: Optional[str] = None
    restaurant_image: Optional[str] = None
    restaurant_photos: Optional[List[str]] = None
    rating: int
    comment: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# This section defines user history response schema.
class HistoryResponse(BaseModel):
    reviews: List[ReviewOut]
    restaurants_added: List[RestaurantOut]


# This section defines owner dashboard analytics schema.
class AnalyticsOut(BaseModel):
    restaurant_count: int
    review_count: int
    average_rating: float


# This section defines owner dashboard response schema.
class OwnerDashboardResponse(BaseModel):
    analytics: AnalyticsOut
    restaurants: List[RestaurantOut]
    recent_reviews: List[ReviewOut]


# This section defines AI assistant chat request and response schemas.
class AIChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str
    conversation_history: List[AIChatMessage] = []


class AIRecommendation(BaseModel):
    id: int
    name: str
    cuisine_type: str
    city: str
    price_range: Optional[str] = None
    average_rating: float = 0.0
    reason: str


class AIChatResponse(BaseModel):
    reply: str
    conversation_history_count: int
    recommendations: List[AIRecommendation] = []