import argparse
import csv
import os
import random


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def make_users(count: int):
    users = []
    for i in range(1, count + 1):
        users.append(
            {
                "user_id": f"csv_user_{i:04d}",
                "name": f"Load User {i}",
                "email": f"loaduser{i:04d}@example.com",
                "password": "demo123",
                "city": "San Jose",
                "state": "CA",
                "country": "United States",
                "languages": "English",
                "gender": "Other",
            }
        )
    return users


def make_restaurants(count: int, users):
    cuisines = [
        "Italian",
        "Mexican",
        "Indian",
        "Japanese",
        "Chinese",
        "American",
        "Thai",
        "Vegan",
        "Breakfast",
        "Seafood",
    ]
    cities = ["San Jose", "Phoenix", "Dallas", "Austin", "Seattle", "Denver"]
    restaurants = []
    for i in range(1, count + 1):
        u = users[(i - 1) % len(users)]
        restaurants.append(
            {
                "restaurant_id": f"csv_rest_{i:04d}",
                "name": f"Load Restaurant {i}",
                "cuisine_type": cuisines[(i - 1) % len(cuisines)],
                "address": f"{100 + i} Main St",
                "city": cities[(i - 1) % len(cities)],
                "state": "CA",
                "zip_code": f"{95000 + i}",
                "contact_phone": f"408-555-{1000 + i:04d}",
                "contact_email": f"rest{i:04d}@example.com",
                "price_range": "$$",
                "is_open": "true",
                "added_by": u["user_id"],
            }
        )
    return restaurants


def make_unique_reviews(review_count: int, users, restaurants):
    # Enforce one review per (user, restaurant) pair.
    all_pairs = [(u["user_id"], r["restaurant_id"]) for u in users for r in restaurants]
    if review_count > len(all_pairs):
        raise ValueError(
            f"Requested {review_count} reviews but only {len(all_pairs)} unique user-restaurant pairs available. "
            "Increase users/restaurants or reduce review count."
        )
    random.shuffle(all_pairs)
    selected = all_pairs[:review_count]
    comments = [
        "Great food and service.",
        "Solid quality and quick prep.",
        "Would visit again.",
        "Good value for money.",
        "Fresh ingredients and nice ambiance.",
    ]
    reviews = []
    for i, (user_id, rest_id) in enumerate(selected, start=1):
        reviews.append(
            {
                "review_id": f"csv_rev_{i:06d}",
                "restaurant_id": rest_id,
                "user_id": user_id,
                "rating": str(random.choice([4, 5])),
                "comment": random.choice(comments),
            }
        )
    return reviews


def write_csv(path: str, rows, headers):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description="Generate large CSV seed data for Yelp load testing.")
    parser.add_argument("--users", type=int, default=120, help="Number of users")
    parser.add_argument("--restaurants", type=int, default=60, help="Number of restaurants")
    parser.add_argument("--reviews", type=int, default=2000, help="Number of unique reviews")
    parser.add_argument(
        "--out-dir",
        default="../seed-data/generated",
        help="Output directory for generated CSV files",
    )
    args = parser.parse_args()

    ensure_dir(args.out_dir)
    users = make_users(args.users)
    restaurants = make_restaurants(args.restaurants, users)
    reviews = make_unique_reviews(args.reviews, users, restaurants)

    users_path = os.path.join(args.out_dir, "users.csv")
    restaurants_path = os.path.join(args.out_dir, "restaurants.csv")
    reviews_path = os.path.join(args.out_dir, "reviews.csv")
    review_requests_path = os.path.join(args.out_dir, "review_requests.csv")
    login_credentials_path = os.path.join(args.out_dir, "login_credentials.csv")
    search_queries_path = os.path.join(args.out_dir, "search_queries.csv")

    write_csv(
        users_path,
        users,
        ["user_id", "name", "email", "password", "city", "state", "country", "languages", "gender"],
    )
    write_csv(
        restaurants_path,
        restaurants,
        [
            "restaurant_id",
            "name",
            "cuisine_type",
            "address",
            "city",
            "state",
            "zip_code",
            "contact_phone",
            "contact_email",
            "price_range",
            "is_open",
            "added_by",
        ],
    )
    write_csv(
        reviews_path,
        reviews,
        ["review_id", "restaurant_id", "user_id", "rating", "comment"],
    )

    # JMeter helper CSVs
    login_rows = [{"email": u["email"], "password": u["password"]} for u in users]
    write_csv(login_credentials_path, login_rows, ["email", "password"])

    review_requests_rows = []
    user_email_by_id = {u["user_id"]: u["email"] for u in users}
    for r in reviews:
        review_requests_rows.append(
            {
                "email": user_email_by_id[r["user_id"]],
                "password": "demo123",
                "restaurant_id": r["restaurant_id"],
                "rating": r["rating"],
                "comment": r["comment"],
            }
        )
    write_csv(
        review_requests_path,
        review_requests_rows,
        ["email", "password", "restaurant_id", "rating", "comment"],
    )

    search_rows = [
        {"q": "pizza", "location": "San Jose"},
        {"q": "ramen", "location": "Dallas"},
        {"q": "vegan", "location": "San Jose"},
        {"q": "tacos", "location": "Phoenix"},
        {"q": "indian", "location": "San Jose"},
        {"q": "sushi", "location": "San Jose"},
    ]
    write_csv(search_queries_path, search_rows, ["q", "location"])

    print(f"Generated: {users_path}")
    print(f"Generated: {restaurants_path}")
    print(f"Generated: {reviews_path}")
    print(f"Generated: {login_credentials_path}")
    print(f"Generated: {review_requests_path}")
    print(f"Generated: {search_queries_path}")


if __name__ == "__main__":
    main()
