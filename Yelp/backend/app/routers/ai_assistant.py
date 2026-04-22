import json
import re
from difflib import get_close_matches

from fastapi import APIRouter, Depends

from ..database import restaurants_collection
from ..dependencies import get_optional_user
from ..schemas import AIChatRequest, AIChatResponse
from ..services.ai_parser import parse_user_intent
from ..services.ai_ranker import score_restaurant
from ..services.ai_live_search import get_live_context
from ..services.ai_text_utils import normalize_user_text
from ..services.ai_langchain_parser import parse_user_intent_with_langchain

router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])

KNOWN_CUISINES = [
    "Italian", "Indian", "Mexican", "Chinese", "Japanese",
    "Thai", "American", "Vegan", "Mediterranean",
    "Breakfast & Brunch", "Coffee & Tea",
]

CUISINE_ALIASES = {
    "italian": "Italian", "italia": "Italian", "itlian": "Italian",
    "italain": "Italian", "itailan": "Italian", "italyan": "Italian",
    "pasta": "Italian", "pizza": "Italian", "pizzeria": "Italian",
    "lasagna": "Italian", "risotto": "Italian",

    "indian": "Indian", "india": "Indian", "indain": "Indian",
    "inidan": "Indian", "curry": "Indian", "tandoori": "Indian",
    "desi": "Indian", "biryani": "Indian", "naan": "Indian",
    "masala": "Indian", "tikka": "Indian",

    "mexican": "Mexican", "mexcian": "Mexican", "mexico": "Mexican",
    "taco": "Mexican", "tacos": "Mexican", "burrito": "Mexican",
    "enchilada": "Mexican", "tex-mex": "Mexican", "quesadilla": "Mexican",

    "chinese": "Chinese", "china": "Chinese", "chineese": "Chinese",
    "dim sum": "Chinese", "dimsum": "Chinese", "wonton": "Chinese",
    "dumpling": "Chinese", "fried rice": "Chinese",

    "japanese": "Japanese", "japan": "Japanese", "japanase": "Japanese",
    "japnese": "Japanese", "japanesse": "Japanese",
    "sushi": "Japanese", "ramen": "Japanese", "udon": "Japanese",
    "tempura": "Japanese", "teriyaki": "Japanese", "miso": "Japanese",

    "thai": "Thai", "thailand": "Thai", "thia": "Thai", "tahi": "Thai",
    "pad thai": "Thai", "green curry": "Thai",

    "american": "American", "america": "American", "amercian": "American",
    "burger": "American", "burgers": "American", "bbq": "American",
    "barbecue": "American", "grill": "American", "steak": "American",

    "vegan": "Vegan", "vegab": "Vegan", "veegan": "Vegan",
    "plant-based": "Vegan", "plantbased": "Vegan",

    "mediterranean": "Mediterranean", "mediteranean": "Mediterranean",
    "greek": "Mediterranean", "lebanese": "Mediterranean",
    "turkish": "Mediterranean", "falafel": "Mediterranean",

    "breakfast": "Breakfast & Brunch", "brunch": "Breakfast & Brunch",
    "cafe": "Coffee & Tea", "coffee": "Coffee & Tea", "tea": "Coffee & Tea",
}

PRICE_ORDER = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4}

LOCATION_SKIP_WORDS = set(CUISINE_ALIASES.keys()) | {
    "the", "a", "an", "me", "my", "food", "restaurant", "restaurants",
    "place", "places", "something", "options", "good", "great", "best",
    "cheap", "affordable", "expensive", "fancy", "casual", "romantic",
    "vegan", "vegetarian", "halal", "dinner", "lunch", "breakfast",
    "tonight", "today", "now", "open", "near", "around", "close",
}

GREETING_ONLY_MESSAGES = {
    "hi", "hello", "hey", "hii", "heyy",
    "good morning", "good afternoon", "good evening",
    "yo", "sup", "hola",
}


def normalize_cuisine(cuisine_str: str) -> str:
    cleaned = cuisine_str.strip().lower()

    if cleaned in CUISINE_ALIASES:
        return CUISINE_ALIASES[cleaned]

    for alias, proper in CUISINE_ALIASES.items():
        if alias in cleaned:
            return proper

    matches = get_close_matches(cleaned.title(), KNOWN_CUISINES, n=1, cutoff=0.65)
    if matches:
        return matches[0]

    return cuisine_str.strip().title()


def parse_json_list(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def is_greeting_only(message: str) -> bool:
    text = (message or "").strip().lower()
    return text in GREETING_ONLY_MESSAGES


def extract_location_from_message(message: str, effective_message: str) -> list:
    location_keywords = []
    eff_lower = (effective_message or "").lower()

    patterns = [
        r"\bin\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s|$|,|\.|!|\?)",
        r"\bnear\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s|$|,|\.|!|\?)",
        r"\baround\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s|$|,|\.|!|\?)",
        r"\bat\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s|$|,|\.|!|\?)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, eff_lower)
        for match in matches:
            city = match.strip()
            if (
                len(city) > 2
                and city not in LOCATION_SKIP_WORDS
                and city.split()[0] not in LOCATION_SKIP_WORDS
            ):
                if city not in location_keywords:
                    location_keywords.append(city)

    return location_keywords


def needs_live_context(message: str) -> bool:
    text = (message or "").lower()
    return any(
        kw in text
        for kw in [
            "open now", "open right now", "hours", "closing time",
            "opening time", "currently open", "right now",
            "event", "events", "tonight", "today", "trending", "popular now",
        ]
    )


def is_cheaper_request(message: str) -> bool:
    text = (message or "").lower()
    return any(
        w in text
        for w in [
            "cheaper", "less expensive", "budget", "affordable",
            "inexpensive", "something cheaper", "more affordable",
        ]
    )


def is_fancier_request(message: str) -> bool:
    text = (message or "").lower()
    return any(
        w in text
        for w in [
            "more expensive", "fancier", "fancy", "upscale", "fine dining",
        ]
    )


def is_price_follow_up(message: str) -> bool:
    return is_cheaper_request(message) or is_fancier_request(message)


def is_best_rated_query(message: str) -> bool:
    text = (message or "").lower()
    return any(
        p in text
        for p in [
            "best rated", "top rated", "highest rated",
            "best rating", "top restaurants", "best restaurants",
        ]
    )


def is_near_me_query(message: str) -> bool:
    text = (message or "").lower()
    return any(p in text for p in ["near me", "nearby", "close by"])


def is_follow_up_message(message: str) -> bool:
    text = (message or "").lower()
    return any(
        t in text
        for t in [
            "cheaper", "more expensive", "less expensive", "more casual",
            "more romantic", "more fancy", "something else", "another option",
            "different one", "make it cheaper", "show me another",
            "something cheaper", "budget", "affordable", "near me",
            "only vegan", "only vegetarian", "more options",
            "instead", "different", "other options", "fancier",
        ]
    )


def extract_cuisine_from_history(conversation_history: list) -> list:
    cuisines_found = []
    for item in conversation_history:
        role = getattr(item, "role", None)
        content = (getattr(item, "content", "") or "").lower()
        if role == "user":
            for alias, proper in CUISINE_ALIASES.items():
                if alias in content and proper not in cuisines_found:
                    cuisines_found.append(proper)
    return cuisines_found


def extract_ambiance_from_history(conversation_history: list) -> list:
    found = []
    keywords = ["romantic", "casual", "family-friendly", "quiet", "outdoor", "cozy"]
    for item in conversation_history:
        role = getattr(item, "role", None)
        content = (getattr(item, "content", "") or "").lower()
        if role == "user":
            for kw in keywords:
                if kw in content and kw not in found:
                    found.append(kw)
    return found


def extract_occasion_from_history(conversation_history: list) -> list:
    found = []
    keywords = ["anniversary", "birthday", "date", "date night", "business"]
    for item in conversation_history:
        role = getattr(item, "role", None)
        content = (getattr(item, "content", "") or "").lower()
        if role == "user":
            for kw in keywords:
                if kw in content and kw not in found:
                    found.append(kw)
    return found


def build_effective_message(message: str, conversation_history: list) -> str:
    current = (message or "").strip()
    if not current:
        return ""

    if not is_follow_up_message(current):
        return current

    previous = [
        getattr(item, "content", "").strip()
        for item in conversation_history
        if getattr(item, "role", None) == "user"
    ]
    if not previous:
        return current

    recent = " ".join(previous[-2:]).strip()
    important_terms = [
        "romantic", "anniversary", "date", "vegan", "vegetarian",
        "casual", "fine dining", "coffee", "breakfast", "brunch",
        "italian", "indian", "mexican", "japanese", "thai", "chinese",
        "american", "mediterranean",
    ]
    preserved = [t for t in important_terms if t in recent.lower()]

    if preserved:
        return f"{recent}. Context: {' '.join(preserved)}. {current}"

    return f"{recent}. {current}"


def apply_follow_up_overrides(message: str, parsed_intent: dict) -> dict:
    updated = dict(parsed_intent)

    if is_cheaper_request(message):
        updated["price_range"] = "$$"
    elif is_fancier_request(message):
        updated["price_range"] = "$$$"

    return updated


def get_context_keywords(message: str) -> list:
    text = (message or "").lower()
    return [kw for kw in ["romantic", "anniversary", "casual", "vegan", "family"] if kw in text]


def boost_score_for_context(restaurant, effective_message: str):
    score_boost = 0.0
    extra_reasons = []

    parts = [
        restaurant.name or "",
        restaurant.cuisine_type or "",
        restaurant.description or "",
    ]
    if restaurant.keywords:
        parts.extend([str(x) for x in restaurant.keywords])
    if restaurant.amenities:
        parts.extend([str(x) for x in restaurant.amenities])

    haystack = " ".join(parts).lower()
    reason_map = {
        "romantic": "matches a romantic vibe",
        "anniversary": "great for a special occasion",
        "casual": "fits a casual setting",
        "vegan": "vegan-friendly",
        "family": "family-friendly",
    }

    for keyword in get_context_keywords(effective_message):
        if keyword in haystack:
            score_boost += 0.4
            extra_reasons.append(reason_map.get(keyword, ""))

    return score_boost, extra_reasons


def get_follow_up_context_reasons(message: str, effective_message: str) -> list:
    reasons = []

    if is_cheaper_request(message):
        reasons.append("more budget-friendly option")
    elif is_fancier_request(message):
        reasons.append("more upscale option")

    if "romantic" in effective_message.lower():
        reasons.append("keeps romantic preference in mind")

    if "anniversary" in effective_message.lower():
        reasons.append("great for your special occasion")

    return reasons


def build_reply_intro(
    username,
    original_message,
    effective_message,
    parsed_intent,
    recommendations,
    needs_live_info,
    location_keywords=None,
) -> str:
    names = ", ".join(r["name"] for r in recommendations)
    original_text = (original_message or "").lower()
    effective_text = (effective_message or "").lower()

    occasions = parsed_intent.get("occasions", [])
    ambiance = parsed_intent.get("ambiance", [])
    dietary = parsed_intent.get("dietary", [])
    cuisines = parsed_intent.get("cuisines", [])
    location = location_keywords[0].title() if location_keywords else ""

    if is_best_rated_query(original_text):
        return f"Here are some top-rated restaurants{' in ' + location if location else ''}: {names}."
    if is_cheaper_request(original_text):
        if cuisines:
            return f"Here are more affordable {cuisines[0]} options{' in ' + location if location else ''}: {names}."
        return f"Here are some budget-friendly options{' in ' + location if location else ''}: {names}."
    if is_fancier_request(original_text):
        if cuisines:
            return f"Here are some upscale {cuisines[0]} options: {names}."
        return f"Here are some upscale options: {names}."
    if "anniversary" in occasions and "romantic" in ambiance:
        return f"For a romantic anniversary dinner: {names}."
    if "anniversary" in occasions:
        return f"Great choices for your anniversary: {names}."
    if "romantic" in ambiance or "date" in occasions:
        return f"For a romantic dinner, I'd suggest: {names}."
    if "vegan" in dietary or "vegan" in effective_text:
        return f"Here are some vegan-friendly options: {names}."
    if "vegetarian" in dietary or "vegetarian" in effective_text:
        return f"Here are some vegetarian-friendly options: {names}."
    if "family" in ambiance or "family" in effective_text:
        return f"Here are some family-friendly options: {names}."
    if needs_live_info and "open now" in effective_text:
        return f"Here are some options open right now: {names}."
    if needs_live_info and ("tonight" in effective_text or "today" in effective_text):
        return f"Good options for tonight: {names}."
    if cuisines and location:
        return f"Here are some great {cuisines[0]} restaurants in {location}: {names}."
    if cuisines:
        return f"Here are some great {cuisines[0]} restaurants: {names}."
    if location:
        return f"Here are some great options in {location}: {names}."
    return f"Hi {username}, I found {len(recommendations)} great option(s) for you: {names}."


def get_restaurant_text_blob(restaurant) -> str:
    parts = [
        restaurant.name or "",
        restaurant.cuisine_type or "",
        restaurant.description or "",
        restaurant.city or "",
        restaurant.state or "",
        restaurant.address or "",
        restaurant.zip_code or "",
    ]

    if restaurant.keywords:
        parts.extend([str(x) for x in restaurant.keywords])

    if restaurant.amenities:
        parts.extend([str(x) for x in restaurant.amenities])

    return " ".join(parts).lower()


def restaurant_matches_cuisines(restaurant, cuisines: list) -> bool:
    if not cuisines:
        return True
    blob = get_restaurant_text_blob(restaurant)
    return any((c or "").lower() in blob for c in cuisines)


def restaurant_matches_locations(restaurant, locations: list) -> bool:
    if not locations:
        return True

    blob = " ".join([
        restaurant.city or "",
        restaurant.state or "",
        restaurant.address or "",
        restaurant.zip_code or "",
    ]).lower()

    for loc in locations:
        loc_lower = (loc or "").strip().lower()
        if loc_lower and loc_lower in blob:
            return True

    return False


def restaurant_matches_price_exact(restaurant, price_range: str) -> bool:
    if not price_range:
        return True
    return (restaurant.price_range or "") == price_range


def restaurant_matches_price_soft(restaurant, price_range: str) -> bool:
    if not price_range:
        return True

    requested = PRICE_ORDER.get(price_range)
    actual = PRICE_ORDER.get(restaurant.price_range or "")
    if requested is None or actual is None:
        return False

    return abs(actual - requested) <= 1


def restaurant_matches_dietary(restaurant, dietary_list: list) -> bool:
    if not dietary_list:
        return True
    blob = get_restaurant_text_blob(restaurant)
    return all((item or "").lower() in blob for item in dietary_list)


def restaurant_matches_ambiance(restaurant, ambiance_list: list) -> bool:
    if not ambiance_list:
        return True
    blob = get_restaurant_text_blob(restaurant)
    return all((item or "").lower() in blob for item in ambiance_list)


def build_active_constraints(parsed_intent: dict, user_preferences: dict, location_keywords: list) -> dict:
    return {
        "cuisines": parsed_intent.get("cuisines") or user_preferences.get("cuisines") or [],
        "locations": location_keywords or user_preferences.get("locations") or [],
        "price_range": parsed_intent.get("price_range") or user_preferences.get("price_range") or "",
        "dietary": parsed_intent.get("dietary") or user_preferences.get("dietary") or [],
        "ambiance": parsed_intent.get("ambiance") or user_preferences.get("ambiance") or [],
    }


def restaurant_matches_strict(restaurant, active: dict) -> bool:
    return (
        restaurant_matches_cuisines(restaurant, active["cuisines"])
        and restaurant_matches_locations(restaurant, active["locations"])
        and restaurant_matches_price_exact(restaurant, active["price_range"])
        and restaurant_matches_dietary(restaurant, active["dietary"])
        and restaurant_matches_ambiance(restaurant, active["ambiance"])
    )


def get_relaxed_groups(candidates: list, active: dict):
    groups = []

    def match_without(drop_keys: set, soft_price: bool = False):
        matched = []
        for r in candidates:
            if "cuisines" not in drop_keys and not restaurant_matches_cuisines(r, active["cuisines"]):
                continue
            if "locations" not in drop_keys and not restaurant_matches_locations(r, active["locations"]):
                continue
            if "price_range" not in drop_keys:
                if soft_price:
                    if not restaurant_matches_price_soft(r, active["price_range"]):
                        continue
                else:
                    if not restaurant_matches_price_exact(r, active["price_range"]):
                        continue
            if "dietary" not in drop_keys and not restaurant_matches_dietary(r, active["dietary"]):
                continue
            if "ambiance" not in drop_keys and not restaurant_matches_ambiance(r, active["ambiance"]):
                continue
            matched.append(r)
        return matched

    groups.append((match_without(set()), []))
    groups.append((match_without({"ambiance"}), ["ambiance"]))
    groups.append((match_without({"dietary"}), ["dietary"]))
    groups.append((match_without({"ambiance", "dietary"}), ["ambiance", "dietary"]))
    groups.append((match_without({"ambiance"}, soft_price=True), ["ambiance", "price"]))
    groups.append((match_without({"dietary"}, soft_price=True), ["dietary", "price"]))
    groups.append((match_without({"ambiance", "dietary"}, soft_price=True), ["ambiance", "dietary", "price"]))
    groups.append((match_without({"locations", "ambiance", "dietary"}), ["location", "ambiance", "dietary"]))
    groups.append((match_without({"locations", "ambiance", "dietary"}, soft_price=True), ["location", "ambiance", "dietary", "price"]))
    groups.append((match_without({"cuisines", "ambiance", "dietary"}), ["cuisine", "ambiance", "dietary"]))
    groups.append((match_without({"cuisines", "ambiance", "dietary"}, soft_price=True), ["cuisine", "ambiance", "dietary", "price"]))
    groups.append((match_without({"cuisines", "locations", "ambiance", "dietary"}), ["cuisine", "location", "ambiance", "dietary"]))
    groups.append((match_without({"cuisines", "locations", "ambiance", "dietary"}, soft_price=True), ["cuisine", "location", "ambiance", "dietary", "price"]))

    return groups


def build_relaxation_note(relaxed_labels: list, active: dict) -> str:
    if not relaxed_labels:
        return ""

    cuisine_text = ""
    if active.get("cuisines"):
        cuisine_text = active["cuisines"][0]

    if "cuisine" in relaxed_labels and cuisine_text:
        if len(relaxed_labels) == 1:
            return f"I couldn't find an exact {cuisine_text} match for your saved preferences, so I'm showing the closest alternatives."
        return f"I couldn't find an exact {cuisine_text} match with all your saved preferences, so I'm showing the closest alternatives."

    if len(relaxed_labels) == 1:
        return f"I couldn't find an exact match for your saved {relaxed_labels[0]}, so I'm showing the closest alternatives."

    if len(relaxed_labels) == 2:
        return f"I couldn't find an exact match for your saved {relaxed_labels[0]} and {relaxed_labels[1]}, so I'm showing the closest alternatives."

    return "I couldn't find an exact match for all your saved preferences, so I'm showing the closest alternatives."


def primary_constraints_match(restaurant, active: dict) -> bool:
    return (
        restaurant_matches_cuisines(restaurant, active["cuisines"])
        and restaurant_matches_locations(restaurant, active["locations"])
        and restaurant_matches_price_exact(restaurant, active["price_range"])
    )


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    payload: AIChatRequest,
    current_user=Depends(get_optional_user),
):
    message = payload.message
    conversation_history = payload.conversation_history

    username = current_user.name if current_user else "there"

    if is_greeting_only(message):
        return {
            "reply": (
                f"Hi {username}! I can help you find restaurants based on cuisine, "
                "budget, dietary needs, location, or your saved preferences. "
                "Try something like 'Italian dinner in Phoenix' or 'something cheaper'."
            ),
            "conversation_history_count": len(conversation_history),
            "recommendations": [],
        }

    user_preferences = {
        "cuisines": parse_json_list(getattr(current_user, "pref_cuisines_json", None)) if current_user else [],
        "price_range": getattr(current_user, "pref_price_range", None) if current_user else None,
        "locations": parse_json_list(getattr(current_user, "pref_locations_json", None)) if current_user else [],
        "dietary": parse_json_list(getattr(current_user, "pref_dietary_json", None)) if current_user else [],
        "ambiance": parse_json_list(getattr(current_user, "pref_ambiance_json", None)) if current_user else [],
        "sort_by": getattr(current_user, "pref_sort_by", "rating") if current_user else "rating",
    }

    effective_message = build_effective_message(message, conversation_history)
    effective_message = normalize_user_text(effective_message)

    try:
        parsed_intent = parse_user_intent_with_langchain(effective_message)
        local_intent = parse_user_intent(effective_message)

        for key in ["cuisines", "dietary", "ambiance", "occasions"]:
            merged = []
            for value in parsed_intent.get(key, []) + local_intent.get(key, []):
                if value not in merged:
                    merged.append(value)
            parsed_intent[key] = merged

        if not parsed_intent.get("price_range"):
            parsed_intent["price_range"] = local_intent.get("price_range")

    except Exception:
        parsed_intent = parse_user_intent(effective_message)

    parsed_intent = apply_follow_up_overrides(message, parsed_intent)

    if is_follow_up_message(message) and conversation_history:
        if not parsed_intent.get("cuisines"):
            history_cuisines = extract_cuisine_from_history(conversation_history)
            if history_cuisines:
                parsed_intent["cuisines"] = history_cuisines

        if not parsed_intent.get("ambiance"):
            history_ambiance = extract_ambiance_from_history(conversation_history)
            if history_ambiance:
                parsed_intent["ambiance"] = history_ambiance

        if not parsed_intent.get("occasions"):
            history_occasions = extract_occasion_from_history(conversation_history)
            if history_occasions:
                parsed_intent["occasions"] = history_occasions

    parsed_intent["cuisines"] = [normalize_cuisine(c) for c in parsed_intent.get("cuisines", [])]
    user_preferences["cuisines"] = [normalize_cuisine(c) for c in user_preferences.get("cuisines", [])]

    needs_live_info = needs_live_context(effective_message)
    live_context = ""

    location_keywords = extract_location_from_message(message, effective_message)
    active = build_active_constraints(parsed_intent, user_preferences, location_keywords)

    broad_filters = []

    if active["cuisines"]:
        for c in active["cuisines"]:
            r = {"$regex": c, "$options": "i"}
            broad_filters.extend([
                {"cuisine_type": r},
                {"name": r},
                {"description": r},
                {"keywords": r},
            ])

    if active["locations"]:
        for loc in active["locations"]:
            r = {"$regex": loc, "$options": "i"}
            broad_filters.extend([
                {"city": r},
                {"state": r},
                {"address": r},
                {"zip_code": r},
            ])

    if not active["cuisines"] and not active["locations"]:
        words = [w.strip() for w in effective_message.split() if len(w.strip()) > 2]
        for word in words:
            r = {"$regex": word, "$options": "i"}
            broad_filters.extend([
                {"name": r},
                {"cuisine_type": r},
                {"description": r},
                {"keywords": r},
            ])

    mongo_filter = {"$or": broad_filters} if broad_filters else {}
    raw_docs = await restaurants_collection.find(mongo_filter).limit(100).to_list(length=100)

    def _doc_to_obj(doc):
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return type("Restaurant", (), doc)()

    candidates = [_doc_to_obj(d) for d in raw_docs]

    if not candidates:
        raw_docs = await restaurants_collection.find().sort(
            "average_rating", -1
        ).limit(100).to_list(length=100)
        candidates = [_doc_to_obj(d) for d in raw_docs]

    selected_restaurants = []
    relaxed_labels = []

    strict_matches = [r for r in candidates if restaurant_matches_strict(r, active)]

    if strict_matches:
        selected_restaurants = strict_matches
    else:
        for matched, labels in get_relaxed_groups(candidates, active):
            if matched:
                selected_restaurants = matched
                relaxed_labels = labels
                break

    if not selected_restaurants:
        raw_fallback = await restaurants_collection.find().sort(
            "average_rating", -1
        ).limit(20).to_list(length=20)
        selected_restaurants = [_doc_to_obj(d) for d in raw_fallback]

    if is_price_follow_up(message) and parsed_intent.get("price_range"):
        requested_level = PRICE_ORDER.get(parsed_intent["price_range"], 2)

        if is_cheaper_request(message):
            filtered = [
                r for r in selected_restaurants
                if PRICE_ORDER.get(r.price_range, 99) <= requested_level
            ]
            if filtered:
                selected_restaurants = filtered

        if is_fancier_request(message):
            filtered = [
                r for r in selected_restaurants
                if PRICE_ORDER.get(r.price_range, 0) >= requested_level
            ]
            if filtered:
                selected_restaurants = filtered

    scored = []
    requested_price = active.get("price_range")

    for restaurant in selected_restaurants:
        score, reasons = score_restaurant(restaurant, parsed_intent, user_preferences)

        if is_best_rated_query(message):
            score += float(restaurant.average_rating or 0) * 2
            if restaurant.average_rating:
                reasons = ["highly rated"] + reasons

        extra_score, extra_reasons = boost_score_for_context(restaurant, effective_message)
        score += extra_score

        if requested_price:
            requested_level = PRICE_ORDER.get(requested_price, 2)
            actual_level = PRICE_ORDER.get(restaurant.price_range or "", 99)
            if actual_level != 99:
                diff = abs(actual_level - requested_level)
                score -= diff * 4

        combined_reasons = list(reasons)
        for reason in extra_reasons:
            if reason and reason not in combined_reasons:
                combined_reasons.append(reason)

        scored.append((restaurant, score, combined_reasons))

    sort_by = user_preferences.get("sort_by") or "rating"

    if sort_by == "price":
        scored.sort(
            key=lambda x: (
                -x[1],
                PRICE_ORDER.get(x[0].price_range or "", 99),
                -(float(x[0].average_rating or 0)),
            )
        )
    elif sort_by == "popularity":
        scored.sort(
            key=lambda x: (
                -x[1],
                PRICE_ORDER.get(x[0].price_range or "", 99),
                -(x[0].review_count or 0),
                -(float(x[0].average_rating or 0)),
            )
        )
    else:
        scored.sort(
            key=lambda x: (
                -x[1],
                PRICE_ORDER.get(x[0].price_range or "", 99),
                -(float(x[0].average_rating or 0)),
                -(x[0].review_count or 0),
            )
        )

    follow_up_reasons = get_follow_up_context_reasons(message, effective_message)

    recommendations = []
    top_restaurant_obj = None

    for idx, (restaurant, score, reasons) in enumerate(scored[:3]):
        if idx == 0:
            top_restaurant_obj = restaurant

        priority = []
        for reason in follow_up_reasons + reasons:
            if reason and reason not in priority:
                priority.append(reason)

        final_reason = ", ".join(priority[:2]) if priority else "looks like a strong overall match"

        recommendations.append({
            "id": restaurant.id,
            "name": restaurant.name,
            "cuisine_type": restaurant.cuisine_type,
            "city": restaurant.city,
            "price_range": restaurant.price_range,
            "average_rating": restaurant.average_rating,
            "reason": final_reason,
            "photos": restaurant.photos or [],
        })

    relaxation_note = ""
    if relaxed_labels:
        relaxation_note = build_relaxation_note(relaxed_labels, active)

    if needs_live_info and recommendations:
        live_context = get_live_context(effective_message, recommendations[0]["city"])

    if recommendations:
        reply = build_reply_intro(
            username,
            message,
            effective_message,
            parsed_intent,
            recommendations,
            needs_live_info,
            location_keywords=active["locations"],
        )

        if relaxation_note:
            reply = f"{reply}\n\n{relaxation_note}"

        if live_context:
            reply = f"{reply}\n\nLive info: {live_context}\nPlease verify hours. 🌙"
    else:
        reply = (
            f"Hi {username}, I couldn't find a match. "
            "Try a different cuisine, price range, or location! 😊"
        )

    return {
        "reply": reply,
        "conversation_history_count": len(conversation_history),
        "recommendations": recommendations,
    }