"""
Restaurant Owner Service
------------------------
Handles owner authentication, dashboard, restaurant management, and analytics.
Runs on port 8002.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_indexes
from .routers import auth, owner

app = FastAPI(
    title="Restaurant Owner Service",
    description="Handles owner auth, dashboard, restaurant management, and analytics.",
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
app.include_router(owner.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "owner-service"}
