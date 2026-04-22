"""
User / Reviewer Service
-----------------------
Handles user authentication, profiles, preferences, history, and review actions.
Runs on port 8001.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_indexes
from .routers import auth, users, reviews

app = FastAPI(
    title="User / Reviewer Service",
    description="Handles user auth, profiles, preferences, history, and reviews.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
async def startup():
    await create_indexes()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(reviews.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "user-reviewer-service"}
