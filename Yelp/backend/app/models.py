from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(300), nullable=False)
    profile_picture = Column(String(500), nullable=True)
    phone_number = Column(String(50), nullable=True)
    about_me = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    languages = Column(String(200), nullable=True)
    gender = Column(String(50), nullable=True)

    pref_cuisines_json = Column(Text, nullable=True)
    pref_price_range = Column(String(10), nullable=True)
    pref_locations_json = Column(Text, nullable=True)
    pref_search_radius_km = Column(Float, nullable=True, default=10)
    pref_dietary_json = Column(Text, nullable=True)
    pref_ambiance_json = Column(Text, nullable=True)
    pref_sort_by = Column(String(50), nullable=True, default="rating")

    created_at = Column(DateTime, default=datetime.utcnow)

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    restaurants = relationship("Restaurant", back_populates="added_by_user")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(300), nullable=False)
    restaurant_location = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurants = relationship("Restaurant", back_populates="owner")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    cuisine_type = Column(String(100), nullable=False, index=True)
    address = Column(String(300), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(20), nullable=True, index=True)
    zip_code = Column(String(20), nullable=True, index=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    hours_text = Column(Text, nullable=True)
    photos = Column(JSON, nullable=True)
    keywords = Column(JSON, nullable=True)
    price_range = Column(String(10), nullable=True, index=True)
    amenities = Column(JSON, nullable=True)
    is_open = Column(Boolean, default=True, index=True)

    average_rating = Column(Float, default=0.0, index=True)
    review_count = Column(Integer, default=0, index=True)
    view_count = Column(Integer, default=0)

    added_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    added_by_user = relationship("User", back_populates="restaurants")
    owner = relationship("Owner", back_populates="restaurants")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="restaurant", cascade="all, delete-orphan")

    def recalculate_rating(self):
        if self.reviews:
            self.average_rating = round(sum(r.rating for r in self.reviews) / len(self.reviews), 2)
            self.review_count = len(self.reviews)
        else:
            self.average_rating = 0.0
            self.review_count = 0


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    photo_urls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    restaurant = relationship("Restaurant", back_populates="favorites")
