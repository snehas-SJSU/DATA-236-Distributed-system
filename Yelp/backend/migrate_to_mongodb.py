"""
Migration Script: MySQL → MongoDB
----------------------------------
Reads all Lab 1 data from MySQL and writes it to MongoDB.
Safe to run multiple times — skips records that already exist.

Usage:
    python migrate_to_mongodb.py

Requirements:
    pip install pymysql pymongo python-dotenv
"""

import os
import json
from datetime import datetime
from dotenv import load_dotenv

import pymysql
import pymysql.cursors
from pymongo import MongoClient

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
MYSQL_URL = os.getenv("DATABASE_URL", "")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")


def parse_mysql_url(url: str) -> dict:
    """Parse mysql+pymysql://user:pass@host:port/dbname into parts."""
    url = url.replace("mysql+pymysql://", "")
    user_pass, rest = url.split("@")
    user, password = user_pass.split(":", 1)
    host_port, dbname = rest.split("/", 1)
    host, port = (host_port.split(":") + ["3306"])[:2]
    return {"host": host, "port": int(port), "user": user, "password": password, "db": dbname}


def get_mysql_connection(cfg: dict):
    return pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["db"],
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
    )


def migrate():
    if not MYSQL_URL:
        print("ERROR: DATABASE_URL not set in .env — skipping MySQL migration.")
        return

    print("Connecting to MySQL...")
    cfg = parse_mysql_url(MYSQL_URL)
    mysql_conn = get_mysql_connection(cfg)

    print(f"Connecting to MongoDB at {MONGO_URL}...")
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DATABASE_NAME]

    migrated = {"users": 0, "owners": 0, "restaurants": 0, "reviews": 0, "favorites": 0}
    skipped = {"users": 0, "owners": 0, "restaurants": 0, "reviews": 0, "favorites": 0}

    with mysql_conn.cursor() as cur:

        # ── Users ─────────────────────────────────────────────────────────────
        print("\nMigrating users...")
        cur.execute("SELECT * FROM users")
        for row in cur.fetchall():
            _id = f"user_{row['id']}"
            if db.users.find_one({"_id": _id}):
                skipped["users"] += 1
                continue
            db.users.insert_one({
                "_id": _id,
                "name": row.get("name", ""),
                "email": row.get("email", ""),
                "hashed_password": row.get("hashed_password", ""),
                "profile_picture": row.get("profile_picture"),
                "phone_number": row.get("phone_number"),
                "about_me": row.get("about_me"),
                "city": row.get("city"),
                "state": row.get("state"),
                "country": row.get("country"),
                "languages": row.get("languages"),
                "gender": row.get("gender"),
                "pref_cuisines_json": row.get("pref_cuisines_json"),
                "pref_price_range": row.get("pref_price_range"),
                "pref_locations_json": row.get("pref_locations_json"),
                "pref_search_radius_km": row.get("pref_search_radius_km", 10),
                "pref_dietary_json": row.get("pref_dietary_json"),
                "pref_ambiance_json": row.get("pref_ambiance_json"),
                "pref_sort_by": row.get("pref_sort_by", "rating"),
                "created_at": row.get("created_at") or datetime.utcnow(),
            })
            migrated["users"] += 1
        print(f"  Users: {migrated['users']} migrated, {skipped['users']} skipped")

        # ── Owners ────────────────────────────────────────────────────────────
        print("Migrating owners...")
        try:
            cur.execute("SELECT * FROM owners")
            for row in cur.fetchall():
                _id = f"owner_{row['id']}"
                if db.owners.find_one({"_id": _id}):
                    skipped["owners"] += 1
                    continue
                db.owners.insert_one({
                    "_id": _id,
                    "name": row.get("name", ""),
                    "email": row.get("email", ""),
                    "hashed_password": row.get("hashed_password", ""),
                    "restaurant_location": row.get("restaurant_location"),
                    "created_at": row.get("created_at") or datetime.utcnow(),
                })
                migrated["owners"] += 1
        except Exception as e:
            print(f"  Owners table not found or error: {e}")
        print(f"  Owners: {migrated['owners']} migrated, {skipped['owners']} skipped")

        # ── Restaurants ───────────────────────────────────────────────────────
        print("Migrating restaurants...")
        cur.execute("SELECT * FROM restaurants")
        for row in cur.fetchall():
            _id = f"rest_{row['id']}"
            if db.restaurants.find_one({"_id": _id}):
                skipped["restaurants"] += 1
                continue

            # Parse JSON fields stored as strings in MySQL
            def safe_json(val):
                if not val:
                    return None
                try:
                    return json.loads(val)
                except Exception:
                    return None

            db.restaurants.insert_one({
                "_id": _id,
                "name": row.get("name", ""),
                "cuisine_type": row.get("cuisine_type", ""),
                "address": row.get("address", ""),
                "city": row.get("city", ""),
                "state": row.get("state"),
                "zip_code": row.get("zip_code"),
                "contact_phone": row.get("contact_phone"),
                "contact_email": row.get("contact_email"),
                "description": row.get("description"),
                "hours_text": row.get("hours_text"),
                "photos": safe_json(row.get("photos")) or [],
                "keywords": safe_json(row.get("keywords")) or [],
                "price_range": row.get("price_range"),
                "amenities": safe_json(row.get("amenities")) or [],
                "is_open": bool(row.get("is_open", True)),
                "average_rating": float(row.get("average_rating") or 0),
                "review_count": int(row.get("review_count") or 0),
                "view_count": int(row.get("view_count") or 0),
                "added_by": f"user_{row['added_by']}" if row.get("added_by") else None,
                "owner_id": f"owner_{row['owner_id']}" if row.get("owner_id") else None,
                "created_at": row.get("created_at") or datetime.utcnow(),
            })
            migrated["restaurants"] += 1
        print(f"  Restaurants: {migrated['restaurants']} migrated, {skipped['restaurants']} skipped")

        # ── Reviews ───────────────────────────────────────────────────────────
        print("Migrating reviews...")
        cur.execute("SELECT * FROM reviews")
        for row in cur.fetchall():
            _id = f"review_{row['id']}"
            if db.reviews.find_one({"_id": _id}):
                skipped["reviews"] += 1
                continue
            db.reviews.insert_one({
                "_id": _id,
                "restaurant_id": f"rest_{row['restaurant_id']}",
                "user_id": f"user_{row['user_id']}",
                "rating": int(row.get("rating", 0)),
                "comment": row.get("comment"),
                "photo_urls": row.get("photo_urls") or [],
                "created_at": row.get("created_at") or datetime.utcnow(),
                "updated_at": row.get("updated_at") or datetime.utcnow(),
            })
            migrated["reviews"] += 1
        print(f"  Reviews: {migrated['reviews']} migrated, {skipped['reviews']} skipped")

        # ── Favorites ─────────────────────────────────────────────────────────
        print("Migrating favorites...")
        cur.execute("SELECT * FROM favorites")
        for row in cur.fetchall():
            _id = f"fav_{row['id']}"
            if db.favorites.find_one({"_id": _id}):
                skipped["favorites"] += 1
                continue
            db.favorites.insert_one({
                "_id": _id,
                "user_id": f"user_{row['user_id']}",
                "restaurant_id": f"rest_{row['restaurant_id']}",
                "created_at": row.get("created_at") or datetime.utcnow(),
            })
            migrated["favorites"] += 1
        print(f"  Favorites: {migrated['favorites']} migrated, {skipped['favorites']} skipped")

    mysql_conn.close()

    # ── Create indexes after migration ────────────────────────────────────────
    print("\nCreating indexes...")
    db.users.create_index("email", unique=True)
    db.owners.create_index("email", unique=True)
    db.restaurants.create_index("city")
    db.restaurants.create_index("cuisine_type")
    db.restaurants.create_index([("average_rating", -1)])
    db.reviews.create_index("restaurant_id")
    db.reviews.create_index("user_id")

    print("\n Migration complete!")
    print(f"  Users:       {migrated['users']}")
    print(f"  Owners:      {migrated['owners']}")
    print(f"  Restaurants: {migrated['restaurants']}")
    print(f"  Reviews:     {migrated['reviews']}")
    print(f"  Favorites:   {migrated['favorites']}")
    print("\n Note: Existing MySQL passwords work as-is (bcrypt already applied).")
    print(" You can log in with your original email and password.")


if __name__ == "__main__":
    migrate()
