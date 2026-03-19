from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Owner
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


# This returns the currently logged-in user from a valid user token.
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = _decode(credentials.credentials)
    user_id = payload.get("sub")
    role = payload.get("role", "user")

    if role != "user" or not user_id:
        raise HTTPException(status_code=401, detail="Not a user token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# This returns the current user if a valid optional user token exists.
def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
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

    return db.query(User).filter(User.id == int(user_id)).first()


# This returns the currently logged-in owner from a valid owner token.
def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Owner:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = _decode(credentials.credentials)
    owner_id = payload.get("sub")
    role = payload.get("role", "user")

    if role != "owner" or not owner_id:
        raise HTTPException(status_code=401, detail="Not an owner token")

    owner = db.query(Owner).filter(Owner.id == int(owner_id)).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    return owner