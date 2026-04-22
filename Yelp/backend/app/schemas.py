from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth schemas ──────────────────────────────────────────────────────────────

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


# ── User schemas ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
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


class PreferencesUpdate(BaseModel):
    cuisines: Optional[List[str]] = Field(default_factory=list)
    price_range: Optional[str] = None
    locations: Optional[List[str]] = Field(default_factory=list)
    search_radius_km: Optional[float] = 10
    dietary_needs: Optional[List[str]] = Field(default_factory=list)
    ambiance: Optional[List[str]] = Field(default_factory=list)
    sort_by: Optional[str] = "rating"


# ── Owner schemas ─────────────────────────────────────────────────────────────

class OwnerOut(BaseModel):
    id: str
    name: str
    email: str
    restaurant_location: Optional[str] = None

    class Config:
        from_attributes = True


class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    restaurant_location: Optional[str] = None


# ── Restaurant schemas ────────────────────────────────────────────────────────

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


class RestaurantOut(BaseModel):
    id: str
    name: str
    cuisine_type: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
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
    owner_id: Optional[str] = None
    is_favorited: Optional[bool] = False

    class Config:
        from_attributes = True


class RestaurantListResponse(BaseModel):
    restaurants: List[RestaurantOut]
    total: int
    page: int
    total_pages: int


# ── Review schemas ────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    restaurant_id: str
    user_id: str
    user_name: str
    restaurant_name: Optional[str] = None
    restaurant_image: Optional[str] = None
    restaurant_photos: Optional[List[str]] = None
    rating: int
    comment: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    reviews: List[ReviewOut]
    restaurants_added: List[RestaurantOut]


class AnalyticsOut(BaseModel):
    restaurant_count: int
    review_count: int
    average_rating: float


class OwnerDashboardResponse(BaseModel):
    analytics: AnalyticsOut
    restaurants: List[RestaurantOut]
    recent_reviews: List[ReviewOut]


# ── AI assistant schemas ──────────────────────────────────────────────────────

class AIChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str
    conversation_history: List[AIChatMessage] = Field(default_factory=list)


class AIRecommendation(BaseModel):
    id: str
    name: str
    cuisine_type: Optional[str] = ""
    city: Optional[str] = ""
    price_range: Optional[str] = None
    average_rating: float = 0.0
    reason: str
    photos: List[str] = Field(default_factory=list)


class AIChatResponse(BaseModel):
    reply: str
    conversation_history_count: int
    recommendations: List[AIRecommendation] = Field(default_factory=list)
