"""
Restaurant Worker Service — Kafka Consumer
Consumes events from: restaurant.created, restaurant.updated, restaurant.claimed
Handles downstream processing after restaurant events.
"""

import json
import logging
import os
from datetime import datetime

from kafka import KafkaConsumer
from pymongo import MongoClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [RestaurantWorker] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")

TOPICS = ["restaurant.created", "restaurant.updated", "restaurant.claimed"]


def get_mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DATABASE_NAME]


def handle_restaurant_created(db, data: dict):
    restaurant_id = data.get("restaurant_id")
    name = data.get("name")
    city = data.get("city")

    # Mark restaurant as indexed/processed and log activity
    db["restaurants"].update_one(
        {"_id": restaurant_id},
        {
            "$set": {
                "processed": True,
                "processed_at": datetime.utcnow(),
            }
        },
    )

    # Write an activity log entry
    db["activity_logs"].insert_one({
        "event": "restaurant.created",
        "restaurant_id": restaurant_id,
        "name": name,
        "city": city,
        "added_by": data.get("added_by"),
        "timestamp": datetime.utcnow(),
    })

    logger.info("Processed restaurant.created: %s (%s) in %s", restaurant_id, name, city)


def handle_restaurant_updated(db, data: dict):
    restaurant_id = data.get("restaurant_id")

    db["activity_logs"].insert_one({
        "event": "restaurant.updated",
        "restaurant_id": restaurant_id,
        "updated_by": data.get("updated_by"),
        "timestamp": datetime.utcnow(),
    })

    logger.info("Processed restaurant.updated: %s", restaurant_id)


def handle_restaurant_claimed(db, data: dict):
    restaurant_id = data.get("restaurant_id")
    owner_id = data.get("owner_id")

    db["activity_logs"].insert_one({
        "event": "restaurant.claimed",
        "restaurant_id": restaurant_id,
        "owner_id": owner_id,
        "timestamp": datetime.utcnow(),
    })

    logger.info("Processed restaurant.claimed: %s by owner %s", restaurant_id, owner_id)


HANDLERS = {
    "restaurant.created": handle_restaurant_created,
    "restaurant.updated": handle_restaurant_updated,
    "restaurant.claimed": handle_restaurant_claimed,
}


def main():
    logger.info("Restaurant Worker starting — connecting to Kafka at %s", KAFKA_BOOTSTRAP_SERVERS)
    db = get_mongo_db()

    consumer = KafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="restaurant-worker-group",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        key_deserializer=lambda k: k.decode("utf-8") if k else None,
    )

    logger.info("Restaurant Worker listening on topics: %s", TOPICS)

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
