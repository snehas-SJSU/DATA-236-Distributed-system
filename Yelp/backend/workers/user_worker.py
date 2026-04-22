"""
User Worker Service — Kafka Consumer
Consumes events from: user.created, user.updated, booking.status
Handles downstream processing after user lifecycle events.
"""

import json
import logging
import os
from datetime import datetime

from kafka import KafkaConsumer
from pymongo import MongoClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [UserWorker] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")

TOPICS = ["user.created", "user.updated", "booking.status"]


def get_mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DATABASE_NAME]


def handle_user_created(db, data: dict):
    user_id = data.get("user_id")
    name = data.get("name")
    email = data.get("email")

    db["activity_logs"].insert_one({
        "event": "user.created",
        "user_id": user_id,
        "name": name,
        "email": email,
        "timestamp": datetime.utcnow(),
    })

    logger.info("Processed user.created: user_id=%s name=%s", user_id, name)


def handle_user_updated(db, data: dict):
    user_id = data.get("user_id")
    updated_fields = data.get("updated_fields", [])

    db["activity_logs"].insert_one({
        "event": "user.updated",
        "user_id": user_id,
        "updated_fields": updated_fields,
        "timestamp": datetime.utcnow(),
    })

    logger.info("Processed user.updated: user_id=%s fields=%s", user_id, updated_fields)


def handle_booking_status(db, data: dict):
    user_id = data.get("user_id")
    status = data.get("status")
    restaurant_id = data.get("restaurant_id")

    db["activity_logs"].insert_one({
        "event": "booking.status",
        "user_id": user_id,
        "restaurant_id": restaurant_id,
        "status": status,
        "timestamp": datetime.utcnow(),
    })

    logger.info(
        "Processed booking.status: user_id=%s restaurant_id=%s status=%s",
        user_id, restaurant_id, status,
    )


HANDLERS = {
    "user.created": handle_user_created,
    "user.updated": handle_user_updated,
    "booking.status": handle_booking_status,
}


def main():
    logger.info("User Worker starting — connecting to Kafka at %s", KAFKA_BOOTSTRAP_SERVERS)
    db = get_mongo_db()

    consumer = KafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="user-worker-group",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        key_deserializer=lambda k: k.decode("utf-8") if k else None,
    )

    logger.info("User Worker listening on topics: %s", TOPICS)

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
