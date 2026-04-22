from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from ..database import users_collection, owners_collection, sessions_collection
from ..schemas import UserSignup, UserLogin, OwnerSignup, OwnerLogin, UserOut, OwnerOut
from ..auth import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..kafka_producer import publish_event

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return UserOut(**doc).model_dump()


def _owner_out(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return OwnerOut(**doc).model_dump()


async def _store_session(user_id: str, role: str, token: str):
    """Store the JWT session in MongoDB with an expiry."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    await sessions_collection.insert_one({
        "user_id": user_id,
        "role": role,
        "token": token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })


@router.post("/user/signup")
async def signup_user(data: UserSignup):
    if await users_collection.find_one({"email": data.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")

    from bson import ObjectId
    user_id = str(ObjectId())
    user_doc = {
        "_id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "hashed_password": hash_password(data.password),
        "created_at": datetime.utcnow(),
    }
    await users_collection.insert_one(user_doc)

    token = create_access_token({"sub": user_id, "role": "user"})
    await _store_session(user_id, "user", token)

    publish_event(
        topic="user.created",
        key=user_id,
        data={
            "event": "user.created",
            "user_id": user_id,
            "name": data.name,
            "email": data.email.lower(),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return {"user": _user_out(user_doc), "access_token": token}


@router.post("/user/login")
async def login_user(data: UserLogin):
    doc = await users_collection.find_one({"email": data.email.lower()})
    if not doc or not verify_password(data.password, doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(doc["_id"])
    token = create_access_token({"sub": user_id, "role": "user"})
    await _store_session(user_id, "user", token)

    return {"user": _user_out(doc), "access_token": token}


@router.post("/owner/signup")
async def signup_owner(data: OwnerSignup):
    if await owners_collection.find_one({"email": data.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")

    from bson import ObjectId
    owner_id = str(ObjectId())
    owner_doc = {
        "_id": owner_id,
        "name": data.name,
        "email": data.email.lower(),
        "hashed_password": hash_password(data.password),
        "restaurant_location": data.restaurant_location,
        "created_at": datetime.utcnow(),
    }
    await owners_collection.insert_one(owner_doc)

    token = create_access_token({"sub": owner_id, "role": "owner"})
    await _store_session(owner_id, "owner", token)

    return {"owner": _owner_out(owner_doc), "access_token": token}


@router.post("/owner/login")
async def login_owner(data: OwnerLogin):
    doc = await owners_collection.find_one({"email": data.email.lower()})
    if not doc or not verify_password(data.password, doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    owner_id = str(doc["_id"])
    token = create_access_token({"sub": owner_id, "role": "owner"})
    await _store_session(owner_id, "owner", token)

    return {"owner": _owner_out(doc), "access_token": token}
