from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from .database import users_collection, owners_collection
from .auth import SECRET_KEY, ALGORITHM

# This reads the bearer token from the Authorization header.
bearer_scheme = HTTPBearer(auto_error=False)


# This decodes the JWT token and raises an auth error if token is invalid.
def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def _doc_to_user(doc: dict):
    """Convert a MongoDB user document to a simple namespace object."""
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return type("User", (), doc)()


def _doc_to_owner(doc: dict):
    """Convert a MongoDB owner document to a simple namespace object."""
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return type("Owner", (), doc)()


# This returns the currently logged-in user from a valid user token.
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = _decode(credentials.credentials)
    user_id = payload.get("sub")
    role = payload.get("role", "user")

    if role != "user" or not user_id:
        raise HTTPException(status_code=401, detail="Not a user token")

    doc = await users_collection.find_one({"_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")

    return _doc_to_user(doc)


# This returns the current user if a valid optional user token exists.
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials:
        return None

    try:
        payload = _decode(credentials.credentials)
    except Exception:
        return None

    user_id = payload.get("sub")
    role = payload.get("role", "user")

    if role != "user" or not user_id:
        return None

    doc = await users_collection.find_one({"_id": user_id})
    return _doc_to_user(doc) if doc else None


# This returns the currently logged-in owner from a valid owner token.
async def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = _decode(credentials.credentials)
    owner_id = payload.get("sub")
    role = payload.get("role", "user")

    if role != "owner" or not owner_id:
        raise HTTPException(status_code=401, detail="Not an owner token")

    doc = await owners_collection.find_one({"_id": owner_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Owner not found")

    return _doc_to_owner(doc)
