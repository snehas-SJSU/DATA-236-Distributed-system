def parse_user_intent(message: str):
    text = (message or "").lower()

    cuisines = [
        "italian",
        "indian",
        "mexican",
        "chinese",
        "japanese",
        "thai",
        "mediterranean",
        "vegan",
        "american",
        "french",
        "korean",
        "sushi",
        "pizza",
        "seafood",
        "steakhouse",
        "breakfast",
        "brunch",
        "burger",
    ]

    dietary_words = [
        "vegan",
        "vegetarian",
        "halal",
        "gluten-free",
        "gluten free",
        "dairy-free",
        "dairy free",
    ]

    ambiance_words = [
        "romantic",
        "casual",
        "family-friendly",
        "family friendly",
        "quiet",
        "outdoor",
        "wifi",
        "cozy",
        "fancy",
        "upscale",
        "fine dining",
        "coffee",
        "cafe",
        "café",
    ]

    occasion_words = [
        "anniversary",
        "date",
        "date night",
        "birthday",
        "dinner",
        "lunch",
        "breakfast",
        "brunch",
        "celebration",
    ]

    found_cuisines = [item for item in cuisines if item in text]
    found_dietary = [item for item in dietary_words if item in text]
    found_ambiance = [item for item in ambiance_words if item in text]
    found_occasions = [item for item in occasion_words if item in text]

    price_range = None

    if "$$$$" in message:
        price_range = "$$$$"
    elif "$$$" in message:
        price_range = "$$$"
    elif "$$" in message:
        price_range = "$$"
    elif "$" in message:
        price_range = "$"

    if not price_range:
        if any(
            word in text
            for word in [
                "cheap",
                "budget",
                "affordable",
                "inexpensive",
                "cheaper",
                "low cost",
            ]
        ):
            price_range = "$"
        elif any(word in text for word in ["mid-range", "mid range", "moderate"]):
            price_range = "$$"
        elif any(word in text for word in ["expensive", "upscale", "fancy", "fine dining"]):
            price_range = "$$$"

    if "romantic" in text and "romantic" not in found_ambiance:
        found_ambiance.append("romantic")

    if "anniversary" in text and "anniversary" not in found_occasions:
        found_occasions.append("anniversary")

    if "date night" in text:
        if "date night" not in found_occasions:
            found_occasions.append("date night")
        if "romantic" not in found_ambiance:
            found_ambiance.append("romantic")

    return {
        "cuisines": found_cuisines,
        "dietary": found_dietary,
        "ambiance": found_ambiance,
        "occasions": found_occasions,
        "price_range": price_range,
    }