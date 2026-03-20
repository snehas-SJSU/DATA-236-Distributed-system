import json

from fastapi import APIRouter, Depends
from sqlalchemy import Text, cast, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Restaurant, User
from ..schemas import AIChatRequest, AIChatResponse
from ..services.ai_parser import parse_user_intent
from ..services.ai_ranker import score_restaurant

router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


def parse_json_list(value):
    if not value:
        return []

    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception:
        return []


@router.post("/chat", response_model=AIChatResponse)
def chat_with_ai(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = payload.message
    conversation_history = payload.conversation_history

    user_preferences = {
        "cuisines": parse_json_list(current_user.pref_cuisines_json),
        "price_range": current_user.pref_price_range,
        "locations": parse_json_list(current_user.pref_locations_json),
        "dietary": parse_json_list(current_user.pref_dietary_json),
        "ambiance": parse_json_list(current_user.pref_ambiance_json),
        "sort_by": current_user.pref_sort_by,
    }

    parsed_intent = parse_user_intent(message)

    query = db.query(Restaurant)

    if parsed_intent["cuisines"]:
        cuisine_filters = [
            Restaurant.cuisine_type.ilike(f"%{cuisine}%")
            for cuisine in parsed_intent["cuisines"]
        ]
        query = query.filter(or_(*cuisine_filters))

    elif user_preferences["cuisines"]:
        cuisine_filters = [
            Restaurant.cuisine_type.ilike(f"%{cuisine}%")
            for cuisine in user_preferences["cuisines"]
        ]
        query = query.filter(or_(*cuisine_filters))

    elif message.strip():
        words = [word.strip().lower() for word in message.split() if len(word.strip()) > 2]

        keyword_filters = []
        for word in words:
            keyword_filters.append(Restaurant.name.ilike(f"%{word}%"))
            keyword_filters.append(Restaurant.cuisine_type.ilike(f"%{word}%"))
            keyword_filters.append(Restaurant.description.ilike(f"%{word}%"))
            keyword_filters.append(cast(Restaurant.keywords, Text).ilike(f"%{word}%"))

        if keyword_filters:
            query = query.filter(or_(*keyword_filters))

    if parsed_intent["price_range"]:
        query = query.filter(Restaurant.price_range == parsed_intent["price_range"])
    elif user_preferences["price_range"]:
        query = query.filter(Restaurant.price_range == user_preferences["price_range"])

    all_dietary = parsed_intent["dietary"] or user_preferences["dietary"]
    for item in all_dietary:
        query = query.filter(
            or_(
                cast(Restaurant.keywords, Text).ilike(f"%{item}%"),
                cast(Restaurant.amenities, Text).ilike(f"%{item}%"),
                Restaurant.description.ilike(f"%{item}%"),
            )
        )

    all_ambiance = parsed_intent["ambiance"] or user_preferences["ambiance"]
    for item in all_ambiance:
        query = query.filter(
            or_(
                cast(Restaurant.keywords, Text).ilike(f"%{item}%"),
                cast(Restaurant.amenities, Text).ilike(f"%{item}%"),
                Restaurant.description.ilike(f"%{item}%"),
            )
        )

    restaurants = query.limit(20).all()

    scored_results = []
    for restaurant in restaurants:
        score, reasons = score_restaurant(
            restaurant=restaurant,
            parsed_intent=parsed_intent,
            user_preferences=user_preferences,
        )
        scored_results.append((restaurant, score, reasons))

    scored_results.sort(key=lambda item: item[1], reverse=True)

    recommendations = []
    for restaurant, score, reasons in scored_results[:3]:
        recommendations.append(
            {
                "id": restaurant.id,
                "name": restaurant.name,
                "cuisine_type": restaurant.cuisine_type,
                "city": restaurant.city,
                "price_range": restaurant.price_range,
                "average_rating": restaurant.average_rating,
                "reason": ", ".join(reasons),
            }
        )

    if recommendations:
        names = [item["name"] for item in recommendations]
        reply = (
            f"Hi {current_user.name}, I found {len(recommendations)} option(s) for you. "
            f"Top match: {', '.join(names)}."
        )
    else:
        reply = (
            f"Hi {current_user.name}, I could not find a strong match yet. "
            "Try changing cuisine, price, or vibe."
        )

    return {
        "reply": reply,
        "conversation_history_count": len(conversation_history),
        "recommendations": recommendations,
    }