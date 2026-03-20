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
from ..services.ai_live_search import get_live_context

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


def needs_live_context(message: str) -> bool:
    text = (message or "").lower()

    live_keywords = [
        "open now",
        "open right now",
        "hours",
        "closing time",
        "opening time",
        "currently open",
        "right now",
        "event",
        "events",
        "tonight",
        "today",
        "trending",
        "popular now",
    ]

    return any(keyword in text for keyword in live_keywords)


def is_price_follow_up(message: str) -> bool:
    text = (message or "").lower()
    return (
        "cheaper" in text
        or "less expensive" in text
        or "more expensive" in text
        or "fancier" in text
    )


def build_effective_message(message: str, conversation_history: list) -> str:
    """
    Build a better message for follow-up queries by combining
    the latest user message with previous user messages.
    """
    current = (message or "").strip()
    if not current:
        return ""

    follow_up_phrases = [
        "cheaper",
        "more expensive",
        "less expensive",
        "more casual",
        "more romantic",
        "more fancy",
        "closer",
        "near me",
        "only vegan",
        "only vegetarian",
        "only indian",
        "only italian",
        "something else",
        "another option",
        "different one",
        "make it cheaper",
        "make it casual",
        "make it more romantic",
    ]

    current_lower = current.lower()
    is_follow_up = any(phrase in current_lower for phrase in follow_up_phrases)

    if not is_follow_up:
        return current

    previous_user_messages = []
    for item in conversation_history:
        role = getattr(item, "role", None)
        content = getattr(item, "content", "")

        if role == "user" and content:
            previous_user_messages.append(content.strip())

    if not previous_user_messages:
        return current

    recent_context = " ".join(previous_user_messages[-2:])
    return f"{recent_context}. {current}"


def apply_follow_up_overrides(message: str, parsed_intent: dict) -> dict:
    text = (message or "").lower()

    updated_intent = dict(parsed_intent)

    if "cheaper" in text or "less expensive" in text:
        updated_intent["price_range"] = "$$"
    elif "more expensive" in text or "fancier" in text:
        updated_intent["price_range"] = "$$$"

    return updated_intent


def get_context_keywords(message: str) -> list[str]:
    text = (message or "").lower()

    keywords = []
    if "romantic" in text:
        keywords.append("romantic")
    if "anniversary" in text:
        keywords.append("anniversary")
    if "casual" in text:
        keywords.append("casual")
    if "vegan" in text:
        keywords.append("vegan")

    return keywords


def boost_score_for_context(restaurant: Restaurant, effective_message: str) -> tuple[float, list[str]]:
    """
    Give a small score boost when the restaurant text looks aligned
    with important context words from the conversation.
    """
    score_boost = 0.0
    extra_reasons = []

    haystack_parts = [
        restaurant.name or "",
        restaurant.cuisine_type or "",
        restaurant.description or "",
    ]

    if restaurant.keywords:
        haystack_parts.extend([str(x) for x in restaurant.keywords])

    if restaurant.amenities:
        haystack_parts.extend([str(x) for x in restaurant.amenities])

    haystack = " ".join(haystack_parts).lower()
    context_keywords = get_context_keywords(effective_message)

    for keyword in context_keywords:
        if keyword in haystack:
            score_boost += 0.4
            if keyword == "romantic":
                extra_reasons.append("matches a romantic vibe")
            elif keyword == "anniversary":
                extra_reasons.append("could fit a special occasion")
            elif keyword == "casual":
                extra_reasons.append("fits a casual setting")
            elif keyword == "vegan":
                extra_reasons.append("supports vegan preferences")

    return score_boost, extra_reasons


def get_follow_up_context_reasons(message: str, effective_message: str) -> list[str]:
    """
    Add soft explanation text so follow-up results still reflect
    the earlier conversational context.
    """
    reasons = []
    message_text = (message or "").lower()
    effective_text = (effective_message or "").lower()

    if is_price_follow_up(message_text):
        reasons.append("gives you a cheaper alternative")

    if "romantic" in effective_text:
        reasons.append("keeps a romantic direction in mind")

    if "anniversary" in effective_text:
        reasons.append("still considers your special occasion")

    return reasons


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

    effective_message = build_effective_message(message, conversation_history)

    parsed_intent = parse_user_intent(effective_message)
    parsed_intent = apply_follow_up_overrides(message, parsed_intent)
    needs_live_info = needs_live_context(effective_message)

    live_context = ""

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

    elif effective_message.strip():
        words = [
            word.strip().lower()
            for word in effective_message.split()
            if len(word.strip()) > 2
        ]

        keyword_filters = []
        for word in words:
            keyword_filters.append(Restaurant.name.ilike(f"%{word}%"))
            keyword_filters.append(Restaurant.cuisine_type.ilike(f"%{word}%"))
            keyword_filters.append(Restaurant.description.ilike(f"%{word}%"))
            keyword_filters.append(
                cast(Restaurant.keywords, Text).ilike(f"%{word}%")
            )

        if keyword_filters:
            query = query.filter(or_(*keyword_filters))

    if parsed_intent["price_range"]:
        query = query.filter(
            Restaurant.price_range == parsed_intent["price_range"]
        )
    elif user_preferences["price_range"]:
        query = query.filter(
            Restaurant.price_range == user_preferences["price_range"]
        )

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

    if not restaurants and is_price_follow_up(message):
        relaxed_query = db.query(Restaurant)

        if parsed_intent["cuisines"]:
            cuisine_filters = [
                Restaurant.cuisine_type.ilike(f"%{cuisine}%")
                for cuisine in parsed_intent["cuisines"]
            ]
            relaxed_query = relaxed_query.filter(or_(*cuisine_filters))

        if parsed_intent["price_range"]:
            relaxed_query = relaxed_query.filter(
                Restaurant.price_range == parsed_intent["price_range"]
            )

        restaurants = relaxed_query.limit(20).all()

    if not restaurants and needs_live_info:
        restaurants = db.query(Restaurant).limit(20).all()

    scored_results = []
    for restaurant in restaurants:
        score, reasons = score_restaurant(
            restaurant=restaurant,
            parsed_intent=parsed_intent,
            user_preferences=user_preferences,
        )

        extra_score, extra_reasons = boost_score_for_context(
            restaurant, effective_message
        )
        score += extra_score

        combined_reasons = list(reasons)
        for reason in extra_reasons:
            if reason not in combined_reasons:
                combined_reasons.append(reason)

        scored_results.append((restaurant, score, combined_reasons))

    scored_results.sort(key=lambda item: item[1], reverse=True)

    follow_up_reasons = get_follow_up_context_reasons(message, effective_message)

    recommendations = []
    for restaurant, score, reasons in scored_results[:3]:
        priority_reasons = []

        for reason in follow_up_reasons:
            if reason and reason not in priority_reasons:
                priority_reasons.append(reason)

        for reason in reasons:
            if reason and reason not in priority_reasons:
                priority_reasons.append(reason)

        final_reason = ", ".join(priority_reasons[:2]) if priority_reasons else "looks like a strong overall match"

        recommendations.append(
            {
                "id": restaurant.id,
                "name": restaurant.name,
                "cuisine_type": restaurant.cuisine_type,
                "city": restaurant.city,
                "price_range": restaurant.price_range,
                "average_rating": restaurant.average_rating,
                "reason": final_reason,
            }
        )

    if needs_live_info and recommendations:
        top_city = recommendations[0]["city"]
        live_context = get_live_context(effective_message, top_city)

    if recommendations:
        names = [item["name"] for item in recommendations]
        reply = (
            f"Hi {current_user.name}, I found {len(recommendations)} option(s) for you. "
            f"Top match: {', '.join(names)}."
        )

        if live_context:
            reply += f" {live_context}"

    else:
        reply = (
            f"Hi {current_user.name}, I could not find a strong match yet. "
            "Try changing cuisine, price, or vibe."
        )

        if live_context:
            reply += f" {live_context}"

    return {
        "reply": reply,
        "conversation_history_count": len(conversation_history),
        "recommendations": recommendations,
    }