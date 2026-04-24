"""
MongoDB Seed Script
--------------------
Populates the database with sample users, restaurants, and reviews
so the app works out of the box after a fresh clone + docker compose up.

Safe to run multiple times — skips records that already exist.

Usage:
    python seed_mongodb.py
    or with custom Mongo URL:
    MONGO_URL=mongodb://localhost:27017 python seed_mongodb.py
"""

import os
import sys
import hashlib
import bcrypt
from datetime import datetime, timezone
from pymongo import MongoClient, errors

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")

# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    sha = hashlib.sha256(password.encode()).hexdigest().encode("ascii")
    hashed = bcrypt.hashpw(sha, bcrypt.gensalt()).decode("utf-8")
    return f"bcrypt_sha256${hashed}"

def now():
    return datetime.now(timezone.utc)

# ── Seed data ─────────────────────────────────────────────────────────────────

USERS = [
    {
        "_id": "seed_user_1",
        "name": "Alex Johnson",
        "email": "alex@demo.com",
        "hashed_password": hash_password("demo123"),
        "profile_picture": None,
        "phone_number": "555-0101",
        "about_me": "Food lover and amateur critic.",
        "city": "Phoenix", "state": "AZ", "country": "United States",
        "languages": "English", "gender": "Male",
        "pref_cuisines_json": '["Italian","Mexican"]',
        "pref_price_range": "$$",
        "pref_locations_json": '["Phoenix"]',
        "pref_search_radius_km": 20,
        "pref_dietary_json": "[]",
        "pref_ambiance_json": '["casual"]',
        "pref_sort_by": "rating",
        "created_at": now(),
    },
    {
        "_id": "seed_user_2",
        "name": "Maria Chen",
        "email": "maria@demo.com",
        "hashed_password": hash_password("demo123"),
        "profile_picture": None,
        "phone_number": "555-0102",
        "about_me": "Vegan food explorer.",
        "city": "San Jose", "state": "CA", "country": "United States",
        "languages": "English, Mandarin", "gender": "Female",
        "pref_cuisines_json": '["Thai","Chinese","Vegan"]',
        "pref_price_range": "$",
        "pref_locations_json": '["San Jose"]',
        "pref_search_radius_km": 15,
        "pref_dietary_json": '["vegan"]',
        "pref_ambiance_json": '["cozy"]',
        "pref_sort_by": "rating",
        "created_at": now(),
    },
]

OWNER = {
    "_id": "seed_owner_1",
    "name": "David Park",
    "email": "owner@demo.com",
    "hashed_password": hash_password("owner123"),
    "business_name": "Park Hospitality Group",
    "phone_number": "555-0200",
    "created_at": now(),
}

RESTAURANTS = [
    {
        "_id": "seed_rest_1",
        "name": "Bella Roma Trattoria",
        "cuisine_type": "Italian",
        "address": "456 Oak Avenue",
        "city": "Phoenix", "state": "AZ", "zip_code": "85001",
        "contact_phone": "555-1001", "contact_email": "bella@roma.com",
        "description": "Authentic Italian pasta, wood-fired pizzas, and fine wines in a warm, rustic setting.",
        "hours_text": "Mon-Thu 11AM-10PM, Fri-Sat 11AM-11PM, Sun 12PM-9PM",
        "photos": ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
        "keywords": ["italian", "pasta", "pizza", "wine", "romantic"],
        "price_range": "$$$",
        "amenities": ["dine-in", "reservations", "bar"],
        "is_open": True,
        "average_rating": 4.6,
        "review_count": 2,
        "view_count": 45,
        "added_by": "seed_user_1",
        "owner_id": "seed_owner_1",
        "created_at": now(),
    },
    {
        "_id": "seed_rest_2",
        "name": "Green Bowl Vegan Kitchen",
        "cuisine_type": "Vegan",
        "address": "789 Elm Street",
        "city": "Phoenix", "state": "AZ", "zip_code": "85002",
        "contact_phone": "555-1002", "contact_email": "hello@greenbowl.com",
        "description": "100% plant-based bowls, smoothies, and wraps. Fresh, healthy, and delicious every day.",
        "hours_text": "Mon-Sat 8AM-8PM, Sun 10AM-6PM",
        "photos": ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"],
        "keywords": ["vegan", "healthy", "bowls", "salads", "gluten-free"],
        "price_range": "$$",
        "amenities": ["dine-in", "takeout", "delivery"],
        "is_open": True,
        "average_rating": 4.4,
        "review_count": 2,
        "view_count": 38,
        "added_by": "seed_user_2",
        "owner_id": None,
        "created_at": now(),
    },
    {
        "_id": "seed_rest_3",
        "name": "Tandoori Flame Kitchen",
        "cuisine_type": "Indian",
        "address": "123 Curry Lane",
        "city": "San Jose", "state": "CA", "zip_code": "95101",
        "contact_phone": "555-1003", "contact_email": "tandoori@flame.com",
        "description": "Rich curries, freshly baked naan, and smoky tandoori dishes from Northern India.",
        "hours_text": "Daily 11:30AM-10PM",
        "photos": ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800"],
        "keywords": ["indian", "curry", "tandoori", "naan", "biryani"],
        "price_range": "$$",
        "amenities": ["dine-in", "takeout", "catering"],
        "is_open": True,
        "average_rating": 4.8,
        "review_count": 1,
        "view_count": 62,
        "added_by": "seed_user_1",
        "owner_id": None,
        "created_at": now(),
    },
    {
        "_id": "seed_rest_4",
        "name": "Taco Fiesta Street Kitchen",
        "cuisine_type": "Mexican",
        "address": "321 Salsa Blvd",
        "city": "Phoenix", "state": "AZ", "zip_code": "85003",
        "contact_phone": "555-1004", "contact_email": "fiesta@tacos.com",
        "description": "Street-style tacos, burritos, and margaritas. Fast, fresh, and full of flavor.",
        "hours_text": "Mon-Sun 10AM-11PM",
        "photos": ["https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800"],
        "keywords": ["mexican", "tacos", "burritos", "margaritas", "fast-casual"],
        "price_range": "$",
        "amenities": ["dine-in", "takeout", "outdoor seating"],
        "is_open": True,
        "average_rating": 4.2,
        "review_count": 1,
        "view_count": 29,
        "added_by": "seed_user_2",
        "owner_id": None,
        "created_at": now(),
    },
    {
        "_id": "seed_rest_5",
        "name": "Sakura Sushi & Ramen",
        "cuisine_type": "Japanese",
        "address": "88 Cherry Blossom Way",
        "city": "San Jose", "state": "CA", "zip_code": "95103",
        "contact_phone": "555-1005", "contact_email": "sakura@sushi.com",
        "description": "Hand-crafted sushi rolls, steaming ramen bowls, and sake in a serene Japanese atmosphere.",
        "hours_text": "Tue-Sun 12PM-10PM, Closed Monday",
        "photos": ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800"],
        "keywords": ["japanese", "sushi", "ramen", "sake", "romantic"],
        "price_range": "$$$",
        "amenities": ["dine-in", "reservations", "bar"],
        "is_open": True,
        "average_rating": 4.9,
        "review_count": 1,
        "view_count": 77,
        "added_by": "seed_user_1",
        "owner_id": None,
        "created_at": now(),
    },
]

REVIEWS = [
    {
        "_id": "seed_rev_1",
        "restaurant_id": "seed_rest_1",
        "user_id": "seed_user_1",
        "rating": 5,
        "comment": "Best pasta I have had outside of Italy. The carbonara was perfectly creamy. Will definitely be back!",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_2",
        "restaurant_id": "seed_rest_1",
        "user_id": "seed_user_2",
        "rating": 4,
        "comment": "Great ambiance and delicious food. Service was a bit slow but worth the wait.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_3",
        "restaurant_id": "seed_rest_2",
        "user_id": "seed_user_1",
        "rating": 5,
        "comment": "As someone not usually into vegan food, this place blew my mind. The Buddha bowl is incredible.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_4",
        "restaurant_id": "seed_rest_2",
        "user_id": "seed_user_2",
        "rating": 4,
        "comment": "Love this place. Fresh ingredients and the smoothies are top-notch.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_5",
        "restaurant_id": "seed_rest_3",
        "user_id": "seed_user_2",
        "rating": 5,
        "comment": "Hands down the best Indian food in San Jose. The butter chicken is life-changing.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_6",
        "restaurant_id": "seed_rest_4",
        "user_id": "seed_user_1",
        "rating": 4,
        "comment": "Fantastic street tacos at a great price. The al pastor is my go-to.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
    {
        "_id": "seed_rev_7",
        "restaurant_id": "seed_rest_5",
        "user_id": "seed_user_2",
        "rating": 5,
        "comment": "The omakase experience here is unreal. Every bite is perfection.",
        "photo_urls": [],
        "created_at": now(),
        "updated_at": now(),
    },
]

# ── Main ──────────────────────────────────────────────────────────────────────

def seed():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"Cannot connect to MongoDB: {e}")
        sys.exit(1)

    db = client[DATABASE_NAME]
    counts = {"users": 0, "owners": 0, "restaurants": 0, "reviews": 0}
    skipped = {"users": 0, "owners": 0, "restaurants": 0, "reviews": 0}

    print("\nSeeding users...")
    for user in USERS:
        try:
            db.users.insert_one(user)
            counts["users"] += 1
        except errors.DuplicateKeyError:
            skipped["users"] += 1

    print("Seeding owner...")
    try:
        db.owners.insert_one(OWNER)
        counts["owners"] += 1
    except errors.DuplicateKeyError:
        skipped["owners"] += 1

    print("Seeding restaurants...")
    for rest in RESTAURANTS:
        try:
            db.restaurants.insert_one(rest)
            counts["restaurants"] += 1
        except errors.DuplicateKeyError:
            skipped["restaurants"] += 1

    print("Seeding reviews...")
    for review in REVIEWS:
        try:
            db.reviews.insert_one(review)
            counts["reviews"] += 1
        except errors.DuplicateKeyError:
            skipped["reviews"] += 1

    print(f"""
Seed complete!
  Users:       {counts['users']} added, {skipped['users']} skipped
  Owners:      {counts['owners']} added, {skipped['owners']} skipped
  Restaurants: {counts['restaurants']} added, {skipped['restaurants']} skipped
  Reviews:     {counts['reviews']} added, {skipped['reviews']} skipped

Demo login credentials:
  User 1  — alex@demo.com   / demo123
  User 2  — maria@demo.com  / demo123
  Owner   — owner@demo.com  / owner123
""")

    client.close()


if __name__ == "__main__":
    seed()