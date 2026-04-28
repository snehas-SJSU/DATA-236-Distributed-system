import argparse
import csv
import os
from datetime import datetime, timezone

from pymongo import MongoClient

from app.auth import hash_password


MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")


def now():
    return datetime.now(timezone.utc)


def parse_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def load_users(users_csv: str, users_collection):
    inserted = 0
    with open(users_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row["user_id"].strip()
            email = row["email"].strip().lower()
            if not user_id or not email:
                continue
            if users_collection.find_one({"_id": user_id}) or users_collection.find_one({"email": email}):
                continue
            doc = {
                "_id": user_id,
                "name": row["name"].strip(),
                "email": email,
                "hashed_password": hash_password(row["password"].strip()),
                "profile_picture": None,
                "phone_number": None,
                "about_me": "",
                "city": row.get("city", "").strip(),
                "state": row.get("state", "").strip(),
                "country": row.get("country", "United States").strip(),
                "languages": row.get("languages", "English").strip(),
                "gender": row.get("gender", "").strip(),
                "pref_cuisines_json": "[]",
                "pref_price_range": "$$",
                "pref_locations_json": "[]",
                "pref_search_radius_km": 20,
                "pref_dietary_json": "[]",
                "pref_ambiance_json": "[]",
                "pref_sort_by": "rating",
                "created_at": now(),
            }
            users_collection.insert_one(doc)
            inserted += 1
    return inserted


def load_restaurants(restaurants_csv: str, restaurants_collection, users_collection):
    inserted = 0
    with open(restaurants_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rest_id = row["restaurant_id"].strip()
            if not rest_id:
                continue
            if restaurants_collection.find_one({"_id": rest_id}):
                continue
            added_by = row.get("added_by", "").strip()
            if added_by and not users_collection.find_one({"_id": added_by}):
                # Skip restaurants that reference unknown users.
                continue
            doc = {
                "_id": rest_id,
                "name": row["name"].strip(),
                "cuisine_type": row["cuisine_type"].strip(),
                "address": row.get("address", "").strip(),
                "city": row.get("city", "").strip(),
                "state": row.get("state", "").strip(),
                "zip_code": row.get("zip_code", "").strip(),
                "contact_phone": row.get("contact_phone", "").strip(),
                "contact_email": row.get("contact_email", "").strip(),
                "description": f"{row['name'].strip()} in {row.get('city', '').strip()}",
                "hours_text": "Daily 9AM-9PM",
                "photos": [],
                "keywords": [],
                "price_range": row.get("price_range", "$$").strip() or "$$",
                "amenities": ["dine-in", "takeout"],
                "is_open": parse_bool(row.get("is_open", "true")),
                "average_rating": 0.0,
                "review_count": 0,
                "view_count": 0,
                "added_by": added_by or None,
                "owner_id": None,
                "created_at": now(),
            }
            restaurants_collection.insert_one(doc)
            inserted += 1
    return inserted


def load_reviews(reviews_csv: str, reviews_collection, restaurants_collection, users_collection):
    inserted = 0
    seen_pairs = set()
    with open(reviews_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            review_id = row["review_id"].strip()
            rest_id = row["restaurant_id"].strip()
            user_id = row["user_id"].strip()
            pair = (user_id, rest_id)
            if not review_id or not rest_id or not user_id:
                continue
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            if not users_collection.find_one({"_id": user_id}):
                continue
            if not restaurants_collection.find_one({"_id": rest_id}):
                continue
            # Enforce one review per user per restaurant.
            if reviews_collection.find_one({"restaurant_id": rest_id, "user_id": user_id}):
                continue
            if reviews_collection.find_one({"_id": review_id}):
                continue
            rating = int(row.get("rating", "5"))
            if rating < 1 or rating > 5:
                rating = 5
            doc = {
                "_id": review_id,
                "restaurant_id": rest_id,
                "user_id": user_id,
                "rating": rating,
                "comment": row.get("comment", "").strip(),
                "photo_urls": [],
                "created_at": now(),
                "updated_at": now(),
            }
            reviews_collection.insert_one(doc)
            inserted += 1
    return inserted


def recalculate_ratings(restaurants_collection, reviews_collection):
    for restaurant in restaurants_collection.find({}, {"_id": 1}):
        rest_id = restaurant["_id"]
        reviews = list(reviews_collection.find({"restaurant_id": rest_id}, {"rating": 1}))
        if not reviews:
            restaurants_collection.update_one(
                {"_id": rest_id},
                {"$set": {"average_rating": 0.0, "review_count": 0}},
            )
            continue
        count = len(reviews)
        avg = round(sum(r["rating"] for r in reviews) / count, 2)
        restaurants_collection.update_one(
            {"_id": rest_id},
            {"$set": {"average_rating": avg, "review_count": count}},
        )


def main():
    parser = argparse.ArgumentParser(description="Seed Yelp MongoDB from CSV files.")
    parser.add_argument("--users", default="../seed-data/users.csv")
    parser.add_argument("--restaurants", default="../seed-data/restaurants.csv")
    parser.add_argument("--reviews", default="../seed-data/reviews.csv")
    args = parser.parse_args()

    client = MongoClient(MONGO_URL)
    db = client[DATABASE_NAME]
    users = db.users
    restaurants = db.restaurants
    reviews = db.reviews

    users_inserted = load_users(args.users, users)
    restaurants_inserted = load_restaurants(args.restaurants, restaurants, users)
    reviews_inserted = load_reviews(args.reviews, reviews, restaurants, users)
    recalculate_ratings(restaurants, reviews)

    print(f"Users inserted: {users_inserted}")
    print(f"Restaurants inserted: {restaurants_inserted}")
    print(f"Reviews inserted: {reviews_inserted}")
    print("Ratings recalculated.")


if __name__ == "__main__":
    main()
