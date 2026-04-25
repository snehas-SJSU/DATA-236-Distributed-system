import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "yelp_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
owners_collection = db["owners"]
restaurants_collection = db["restaurants"]
reviews_collection = db["reviews"]
review_events_collection = db["review_events"]
favorites_collection = db["favorites"]
sessions_collection = db["sessions"]
activity_logs_collection = db["activity_logs"]


async def create_indexes():
    """Create MongoDB indexes for performance and constraints."""
    await users_collection.create_index("email", unique=True)
    await owners_collection.create_index("email", unique=True)
    await restaurants_collection.create_index("city")
    await restaurants_collection.create_index("cuisine_type")
    await restaurants_collection.create_index([("average_rating", -1)])
    await reviews_collection.create_index("restaurant_id")
    await reviews_collection.create_index("user_id")
    await review_events_collection.create_index("review_id", unique=True)
    await review_events_collection.create_index("updated_at")
    await favorites_collection.create_index(
        [("user_id", 1), ("restaurant_id", 1)], unique=True
    )
    # Sessions expire automatically via MongoDB TTL index
    await sessions_collection.create_index("token")
    await sessions_collection.create_index("expires_at", expireAfterSeconds=0)


def get_db():
    return db
