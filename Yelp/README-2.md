# Yelp Clone — Full-Stack Application

A Yelp-style restaurant discovery and review platform built with **React** (frontend) and **FastAPI + MySQL** (backend).

---

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18 + Vite, React Router v6   |
| Backend   | Python 3.11+, FastAPI, SQLAlchemy  |
| Database  | MySQL 8.0                          |
| Auth      | JWT (python-jose) + bcrypt         |
| API Docs  | Swagger UI (`/docs`)               |
| AI        | FastAPI assistant + ranking logic  |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0 running locally

---

## Setup & Run

### 1. Database

```sql
CREATE DATABASE yelp_clone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (edit as needed)
cp .env.example .env

# Run the server (tables auto-created on first start)
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`  
Swagger docs: `http://127.0.0.1:8000/docs`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables (backend/.env)

```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/yelp_clone
SECRET_KEY=your_super_secret_key_change_this_in_production
```

---

## API Endpoints Summary

### Auth
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /auth/user/signup     | User registration  |
| POST   | /auth/user/login      | User login         |
| POST   | /auth/owner/signup    | Owner registration |
| POST   | /auth/owner/login     | Owner login        |

### Restaurants
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /restaurants/search              | Search with filters      |
| GET    | /restaurants/favorites           | Get user's favorites     |
| GET    | /restaurants                     | List all                 |
| GET    | /restaurants/{id}                | Get by ID                |
| POST   | /restaurants                     | Create (auth required)   |
| PUT    | /restaurants/{id}                | Update                   |
| POST   | /restaurants/{id}/photos         | Upload photos            |
| POST   | /restaurants/{id}/favorite       | Add to favorites         |
| DELETE | /restaurants/{id}/favorite       | Remove from favorites    |

### Reviews
| Method | Endpoint                             | Description             |
|--------|--------------------------------------|-------------------------|
| GET    | /restaurants/{id}/reviews            | List reviews            |
| POST   | /restaurants/{id}/reviews            | Create review (auth)    |
| PUT    | /reviews/{id}                        | Edit own review         |
| DELETE | /reviews/{id}                        | Delete own review       |

### User Profile
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| GET    | /user/profile         | Get profile           |
| PUT    | /user/profile         | Update profile        |
| PUT    | /user/preferences     | Update AI preferences |
| POST   | /user/profile/photo   | Upload profile photo  |
| GET    | /user/history         | Get review history    |

### Owner
| Method | Endpoint                           | Description                |
|--------|------------------------------------|----------------------------|
| GET    | /owner/dashboard                   | Dashboard + analytics      |
| GET    | /owner/profile                     | Get owner profile          |
| PUT    | /owner/profile                     | Update owner profile       |
| POST   | /owner/restaurants                 | Create owner restaurant    |
| POST   | /owner/restaurants/{id}/claim      | Claim a restaurant         |
| PUT    | /owner/restaurants/{id}            | Update restaurant          |

### AI Assistant
| Method | Endpoint              | Description                                |
|--------|-----------------------|--------------------------------------------|
| POST   | /ai-assistant/chat    | Get AI restaurant recommendations via chat |

---

## Features Implemented

### User Features
- ✅ Signup / Login / Logout with JWT
- ✅ Profile page: name, email, phone, about me, city, state, country (dropdown), languages, gender
- ✅ Profile photo upload
- ✅ User Preferences: cuisines, price range, location, dietary needs, ambiance, sort preference
- ✅ Restaurant Search: by name, cuisine, keywords, location (city/zip)
- ✅ Restaurant Details: ratings, reviews, photos, info sidebar
- ✅ Add Restaurant: full form with photo upload
- ✅ Reviews: create, edit (inline form), delete
- ✅ Favorites: save / remove / view
- ✅ History: reviews and restaurants added

### Owner Features
- ✅ Owner Signup / Login
- ✅ Owner profile management
- ✅ Owner Dashboard with analytics
- ✅ Claim restaurant
- ✅ Create owner-side restaurants
- ✅ Update restaurant details as owner
- ✅ View reviews for owned restaurants

### Agentic / AI Assistant Features
- ✅ AI chat panel integrated into frontend
- ✅ Supports natural language restaurant queries
- ✅ Uses saved user preferences to personalize suggestions
- ✅ Parses intent for cuisine, dietary needs, ambiance, and price range
- ✅ Fallback keyword search for dish names and food terms like tandoori, biryani, ramen, etc.
- ✅ Ranks restaurants and returns top matches
- ✅ Returns limited top recommendations in response
- ✅ Shows recommendation cards in the UI
- ✅ Recommendation cards are clickable and open restaurant details
- ✅ Clear / new chat action resets the current assistant conversation

### Non-Functional
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Swagger UI at /docs
- ✅ CORS configured for local dev
- ✅ Uploaded files served as static assets
- ✅ Proper error handling and HTTP status codes

---

## Current Status

The project currently supports:
- user workflows
- owner workflows
- restaurant search and discovery
- reviews and favorites
- AI-assisted restaurant recommendation flow

The remaining work is mainly around UI polish, more testing, and optional advanced AI chat improvements.
