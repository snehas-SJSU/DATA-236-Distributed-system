import json
import logging
import os

from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

_producer = None


def _get_producer() -> KafkaProducer | None:
    global _producer
    if _producer is not None:
        return _producer
    try:
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            retries=3,
        )
        logger.info("Kafka producer connected to %s", KAFKA_BOOTSTRAP_SERVERS)
    except NoBrokersAvailable:
        logger.warning(
            "Kafka unavailable at %s — events will not be published.",
            KAFKA_BOOTSTRAP_SERVERS,
        )
        _producer = None
    except Exception as exc:
        logger.warning("Kafka producer init failed: %s", exc)
        _producer = None
    return _producer


def publish_event(topic: str, key: str, data: dict) -> bool:
    """
    Publish a JSON event to a Kafka topic.
    Returns True on success, False if Kafka is unavailable (non-fatal).
    """
    producer = _get_producer()
    if producer is None:
        return False
    try:
        producer.send(topic, key=key, value=data)
        producer.flush()
        logger.info("Published event to topic '%s' key='%s'", topic, key)
        return True
    except Exception as exc:
        logger.warning("Failed to publish to '%s': %s", topic, exc)
        return False
