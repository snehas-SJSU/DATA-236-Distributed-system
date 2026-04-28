# Yelp Clone — Lab 2

This is an extension of our Lab 1 Yelp prototype. In Lab 2 we migrated the database to MongoDB, added Kafka for async messaging, containerized everything with Docker, set up Kubernetes configs, and added Redux for frontend state management.

---

## What changed from Lab 1

- **Database**: Switched from MySQL to MongoDB (using Motor async driver)
- **Sessions**: Now stored in MongoDB with automatic TTL expiry
- **Messaging**: Added Kafka (KRaft mode, no Zookeeper) with 3 worker services
- **Containers**: Dockerized all services, docker-compose for local full stack
- **Kubernetes**: K8s manifests for all services
- **Frontend**: Added Redux Toolkit for state management (auth, restaurants, reviews, favorites)

---

## Running locally

### Backend

You need Python 3.11+ and MongoDB running on localhost:27017.

```bash
cd Yelp/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `Yelp/backend/`:

```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=yelp_db
SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```

Then start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI is at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd Yelp/frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Running with Docker

This starts everything together: MongoDB, Kafka, all backend services, Kafka workers, and the frontend.

```bash
cd Yelp
docker compose up --build -d
```

| What | URL |
|------|-----|
| Frontend (nginx gateway) | http://localhost:3000 |
| User service | http://localhost:8001 |
| Owner service | http://localhost:8002 |
| Restaurant service | http://localhost:8003 |
| Review service | http://localhost:8004 |

### Seed demo data (fresh install)

After starting with Docker, the database is empty. Run the seed script to populate 5 restaurants with photos, reviews, and demo accounts:

```bash
cd Yelp/backend
pip install pymongo bcrypt python-dotenv
python seed_mongodb.py
```

Demo login credentials after seeding:

| Role | Email | Password |
|------|-------|----------|
| User | alex@demo.com | demo123 |
| User | maria@demo.com | demo123 |
| Owner | owner@demo.com | owner123 |

The seed script is safe to run multiple times — it skips records that already exist.

### Migrate from Lab 1 MySQL (optional)

If you have existing data in MySQL from Lab 1, you can migrate it instead of seeding:

```bash
cd Yelp/backend
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/your_db \
MONGO_URL=mongodb://localhost:27017 \
DATABASE_NAME=yelp_db \
python migrate_to_mongodb.py
```

---

## Kubernetes

```bash
cd Yelp/k8s
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f mongodb/
kubectl apply -f kafka/
kubectl apply -f backend/
kubectl apply -f services/
kubectl apply -f workers/
kubectl apply -f frontend/
```

Check everything is up:

```bash
kubectl get pods -n yelp
```

---

## AWS Deployment (EKS)

This project was also deployed to AWS EKS so the full distributed system could be demonstrated on AWS cloud infrastructure.

### 1) Create the cluster

```bash
eksctl create cluster \
  --name yelp-lab-aws-latest \
  --region us-east-1 \
  --nodes 2 \
  --node-type t3.small \
  --managed
```

Verify:

```bash
kubectl get nodes
```

### 2) Authenticate to ECR

```bash
export AWS_REGION=us-east-1
export ECR_REGISTRY=896241235820.dkr.ecr.${AWS_REGION}.amazonaws.com

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
```

### 3) Build and push images from macOS for Linux

Frontend:

```bash
cd Yelp/frontend
docker buildx build --platform linux/amd64 --no-cache \
  -f Dockerfile.aws-eks \
  -t ${ECR_REGISTRY}/yelp-frontend:lab-latest \
  --push .
```

Workers:

```bash
cd ../backend
docker buildx build --platform linux/amd64 -f Dockerfile.review_worker -t ${ECR_REGISTRY}/yelp-review-worker:lab-latest --push .
docker buildx build --platform linux/amd64 -f Dockerfile.restaurant_worker -t ${ECR_REGISTRY}/yelp-restaurant-worker:lab-latest --push .
docker buildx build --platform linux/amd64 -f Dockerfile.user_worker -t ${ECR_REGISTRY}/yelp-user-worker:lab-latest --push .
```

### 4) Apply manifests to AWS

```bash
cd Yelp
kubectl apply -f k8s-aws-eks/base/namespace.yaml
kubectl apply -f k8s-aws/base/configmap.yaml
kubectl apply -f k8s-aws/base/secret.yaml
kubectl apply -f k8s-aws/mongodb/
kubectl apply -f k8s-aws/kafka/
kubectl apply -f k8s-aws/services/
kubectl apply -f k8s-aws-eks/workers/
kubectl apply -f k8s-aws-eks/frontend/deployment.yaml
```

Verify:

```bash
kubectl get pods -n yelp
kubectl get svc -n yelp frontend-service
```

### 5) Seed MongoDB in AWS

Port-forward MongoDB:

```bash
kubectl port-forward -n yelp svc/mongodb-service 27017:27017
```

Then seed data:

```bash
cd Yelp/backend
MONGO_URL=mongodb://localhost:27017 DATABASE_NAME=yelp_db python3 seed_mongodb.py
```
<img width="943" height="395" alt="Screenshot 2026-04-28 at 10 54 32 AM" src="https://github.com/user-attachments/assets/dca89136-6be4-49cf-a80d-ab2273697861" />
<img width="1013" height="205" alt="Screenshot 2026-04-28 at 10 54 47 AM" src="https://github.com/user-attachments/assets/66070656-66e1-44c7-ad16-8139179f6e1c" />


### Notes

- The AWS frontend is served through the external load balancer endpoint.
- Kafka workers must be running for review submission and async processing.
- MongoDB was run with ephemeral storage for the AWS demo deployment in this setup.

---
## Services overview

We split the backend into 4 separate services (each has its own Dockerfile):

| Service | Port | Handles |
|---------|------|---------|
| User / Reviewer | 8001 | Signup, login, profiles, reviews |
| Restaurant Owner | 8002 | Owner dashboard, restaurant management |
| Restaurant | 8003 | Restaurant search, details, AI assistant |
| Review | 8004 | Review create/edit/delete |

There are also 3 Kafka worker services that run in the background:
- **review-worker** — processes review.created / updated / deleted events
- **restaurant-worker** — processes restaurant.created / updated / claimed events
- **user-worker** — processes user.created / updated / booking.status events

---

## Kafka topics

Reviews follow a **Kafka-first** pattern: the API publishes the event to Kafka and returns an optimistic response immediately. The review-worker consumes the event and performs the actual database write (insert/update/delete) and rating recalculation.

| Topic | Who publishes | Who consumes |
|-------|--------------|--------------|
| review.created | Review API | review-worker (writes to DB) |
| review.updated | Review API | review-worker (updates in DB) |
| review.deleted | Review API | review-worker (deletes from DB) |
| restaurant.created | Restaurant API | restaurant-worker |
| restaurant.updated | Restaurant / Owner API | restaurant-worker |
| restaurant.claimed | Owner API | restaurant-worker |
| user.created | Auth (signup) | user-worker |
| user.updated | User profile update | user-worker |
| booking.status | — | user-worker |

---

## Redux slices (frontend)

| Slice | What it manages |
|-------|----------------|
| auth | JWT token, logged-in user/owner, session state |
| restaurants | Restaurant lists, search results, current restaurant |
| reviews | Reviews per restaurant, submit/edit/delete state |
| favorites | User's saved restaurants, add/remove |

### Redux DevTools – State Changes
<img width="536" height="603" alt="Screenshot 2026-04-28 at 10 58 02 AM" src="https://github.com/user-attachments/assets/ab4188f1-12ff-493f-8797-508c4c180e73" />

---

## Features

### User / Reviewer
- Signup, login, logout with JWT
- Profile page — name, email, phone, about me, city, state, country, languages, gender
- Profile photo upload
- Preferences — set preferred cuisines, price range, location, dietary needs, ambiance, sort order
- Search restaurants by name, cuisine, keywords, or city (with autocomplete)
- View restaurant details — ratings, reviews, photos, hours, contact info
- Add a restaurant with photo upload
- Write a review (search for restaurant first, then submit rating + comment)
- Edit and delete your own reviews inline on the restaurant page
- Upload photos to a review
- Save and remove favorites
- View history — restaurants you added and reviews you wrote

### Restaurant Owner
- Owner signup and login (completely separate from user accounts)
- Owner profile management
- Dashboard with analytics — total restaurants, total reviews, average rating
- Claim an existing restaurant that was added by a user
- Create a new restaurant directly as owner
- Edit restaurant details (name, description, hours, photos, etc.)
- Upload photos to owned restaurants
- View all reviews for owned restaurants with sort and filter options
- Owner analytics page with rating breakdown per restaurant

### AI Assistant (Sparky)
- Chat panel in the bottom-right corner, accessible from the home page
- Works for both logged-in users and guests
- Natural language queries like "Italian dinner in Phoenix" or "cheap vegan food"
- Uses LangChain + Groq (llama-3.1-8b) to parse intent — cuisine, price, dietary needs, ambiance, occasion
- Personalizes results using saved user preferences when logged in
- Supports follow-up messages like "make it cheaper" or "something more romantic"
- Uses Tavily for live context on time-sensitive queries (open now, tonight, trending)
- Returns top 3 restaurant cards with name, rating, price range, and reason
- Clicking a card opens the full restaurant details page
- Quick action buttons for common queries (Best rated near me, Vegan options, etc.)

### General
- Fully responsive UI
- JWT auth with token stored in localStorage and synced to Redux
- Uploaded files (photos) served as static assets via FastAPI
- CORS configured for local development
- All API errors return proper HTTP status codes with detail messages
- Swagger UI at `/docs` for full API documentation

---

## Security notes

- Passwords are hashed with bcrypt (we pre-hash with SHA256 first to handle the 72-char bcrypt limit)
- JWT sessions are stored in MongoDB with a TTL index so they auto-expire
- SECRET_KEY is read from the `.env` file — never hardcoded

---
## JMeter Performance Testing

The Lab 2 assignment requires performance testing at `100`, `200`, `300`, `400`, and `500` concurrent users while recording:

- Average response time
- Throughput (requests/sec)
- Error rate

### Results

| Concurrent Users | Avg Response Time (ms) | Throughput (req/sec) | Error % |
|------------------|------------------------|----------------------|---------|
| 100 | 1,348 | 17.9 | 0.00% |
| 200 | 2,462 | 17.9 | 0.00% |
| 300 | 3,577 | 18.0 | 0.00% |
| 400 | 4,700 | 17.8 | 0.00% |
| 500 | 5,868 | 17.9 | 0.00% |

The average response time increased steadily as concurrency increased from `100` to `500` users. Throughput stayed nearly flat at around `18 req/sec`, while error rate remained `0.00%` in the captured run.
