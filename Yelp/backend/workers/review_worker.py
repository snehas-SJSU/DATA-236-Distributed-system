"""
Review Worker Service — Kafka Consumer
Consumes events from: review.created, review.updated, review.deleted
Processes reviews and writes/updates/deletes from MongoDB.
"""

import json
import logging
import os
from datetime import datetime

from kafka import KafkaConsumer
from pymongo import MongoClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ReviewWorker] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")

TOPICS = ["review.created", "review.updated", "review.deleted"]


def get_mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DATABASE_NAME]


def recalculate_rating(db, restaurant_id: str):
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}))
    if reviews:
        avg = round(sum(r["rating"] for r in reviews) / len(reviews), 2)
        count = len(reviews)
    else:
        avg = 0.0
        count = 0
    db["restaurants"].update_one(
        {"_id": restaurant_id},
        {"$set": {"average_rating": avg, "review_count": count}},
    )
    logger.info("Recalculated rating for restaurant %s → %.2f (%d reviews)", restaurant_id, avg, count)


def handle_review_created(db, data: dict):
    review_id = data.get("review_id")
    restaurant_id = data.get("restaurant_id")

    # Kafka-first: worker is responsible for writing review to DB
    existing = db["reviews"].find_one({"_id": review_id})
    if existing:
        logger.info("review.created: review_id=%s already in DB, skipping insert", review_id)
    else:
        created_at_str = data.get("created_at")
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.utcnow()
        db["reviews"].insert_one({
            "_id": review_id,
            "restaurant_id": restaurant_id,
            "user_id": data.get("user_id"),
            "user_name": data.get("user_name"),
            "rating": data.get("rating"),
            "comment": data.get("comment"),
            "photo_urls": [],
            "created_at": created_at,
            "processed": True,
        })
        logger.info("Written review_id=%s to DB for restaurant_id=%s", review_id, restaurant_id)

    recalculate_rating(db, restaurant_id)


def handle_review_updated(db, data: dict):
    review_id = data.get("review_id")
    restaurant_id = data.get("restaurant_id")

    # Kafka-first: worker applies updates to DB
    updates = {"updated_at": datetime.utcnow()}
    if data.get("rating") is not None:
        updates["rating"] = data["rating"]
    if data.get("comment") is not None:
        updates["comment"] = data["comment"]

    result = db["reviews"].update_one({"_id": review_id}, {"$set": updates})
    if result.matched_count == 0:
        logger.warning("review.updated: review_id=%s not found in DB", review_id)
    else:
        recalculate_rating(db, restaurant_id)
        logger.info("Updated review_id=%s in DB for restaurant_id=%s", review_id, restaurant_id)


def handle_review_deleted(db, data: dict):
    review_id = data.get("review_id")
    restaurant_id = data.get("restaurant_id")

    # Worker is responsible for the actual DB delete (Kafka-first pattern)
    db["reviews"].delete_one({"_id": review_id})
    recalculate_rating(db, restaurant_id)
    logger.info("Deleted review_id=%s and recalculated rating for restaurant_id=%s", review_id, restaurant_id)


HANDLERS = {
    "review.created": handle_review_created,
    "review.updated": handle_review_updated,
    "review.deleted": handle_review_deleted,
}


def main():
    logger.info("Review Worker starting — connecting to Kafka at %s", KAFKA_BOOTSTRAP_SERVERS)
    db = get_mongo_db()

    consumer = KafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="review-worker-group",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        key_deserializer=lambda k: k.decode("utf-8") if k else None,
    )

    logger.info("Review Worker listening on topics: %s", TOPICS)

    for message in consumer:
        topic = message.topic
        data = message.value
        logger.info("Received message on topic=%s key=%s", topic, message.key)

        handler = HANDLERS.get(topic)
        if handler:
            try:
                handler(db, data)
            except Exception as exc:
                logger.error("Error handling %s: %s", topic, exc)
        else:
            logger.warning("No handler for topic: %s", topic)


if __name__ == "__main__":
    main()
