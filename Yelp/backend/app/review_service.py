"""
Review Service
--------------
Handles review creation, updates, deletion, and photo uploads.
Publishes events to Kafka on every review change.
Runs on port 8004.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_indexes
from .routers import auth, reviews, restaurants

app = FastAPI(
    title="Review Service",
    description="Handles review CRUD, photo uploads, and Kafka event publishing.",
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
app.include_router(reviews.router)
app.include_router(restaurants.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "review-service"}
