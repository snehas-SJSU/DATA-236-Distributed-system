from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Owner
from ..schemas import UserSignup, UserLogin, OwnerSignup, OwnerLogin, UserOut, OwnerOut
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/user/signup")
def signup_user(data: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": "user"})
    return {"user": UserOut.model_validate(user), "access_token": token}


@router.post("/user/login")
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id), "role": "user"})
    return {"user": UserOut.model_validate(user), "access_token": token}


@router.post("/owner/signup")
def signup_owner(data: OwnerSignup, db: Session = Depends(get_db)):
    if db.query(Owner).filter(Owner.email == data.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    owner = Owner(
        name=data.name,
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        restaurant_location=data.restaurant_location,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    token = create_access_token({"sub": str(owner.id), "role": "owner"})
    return {"owner": OwnerOut.model_validate(owner), "access_token": token}


@router.post("/owner/login")
def login_owner(data: OwnerLogin, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.email == data.email.lower()).first()
    if not owner or not verify_password(data.password, owner.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(owner.id), "role": "owner"})
    return {"owner": OwnerOut.model_validate(owner), "access_token": token}
