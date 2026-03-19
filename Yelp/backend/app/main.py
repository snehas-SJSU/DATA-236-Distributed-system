import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .routers import auth, users, restaurants, reviews, owner, ai_assistant

# This creates all database tables when the app starts.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Yelp Clone API",
    description="RESTful API for the Yelp Clone application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# This allows frontend requests from the local dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This serves uploaded files like images from the uploads folder.
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# This registers all app routers.
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(reviews.router)
app.include_router(owner.router)
app.include_router(ai_assistant.router)


@app.get("/")
def root():
    return {"message": "Yelp Clone API is running. Visit /docs for Swagger UI."}


@app.get("/health")
def health():
    return {"status": "ok"}