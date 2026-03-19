from datetime import datetime, timedelta, timezone
import hashlib

import bcrypt
from jose import jwt

SECRET_KEY = "your_super_secret_key_change_this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

_SHA256_BCRYPT_PREFIX = "bcrypt_sha256$"


def _password_bytes(password: str) -> bytes:
    return (password or "").encode("utf-8")


def _prehashed_password_bytes(password: str) -> bytes:
    return hashlib.sha256(_password_bytes(password)).hexdigest().encode("ascii")


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(_prehashed_password_bytes(password), bcrypt.gensalt())
    return _SHA256_BCRYPT_PREFIX + hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith(_SHA256_BCRYPT_PREFIX):
            stored = hashed_password[len(_SHA256_BCRYPT_PREFIX):].encode("utf-8")
            return bcrypt.checkpw(_prehashed_password_bytes(plain_password), stored)
        return bcrypt.checkpw(_password_bytes(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
