"""
Restaurant Service
------------------
Handles restaurant CRUD, search, favorites, photo uploads, and AI assistant.
Runs on port 8003.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_indexes
from .routers import auth, restaurants, ai_assistant

app = FastAPI(
    title="Restaurant Service",
    description="Handles restaurant CRUD, search, favorites, photos, and AI assistant.",
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
app.include_router(restaurants.router)
app.include_router(ai_assistant.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "restaurant-service"}
