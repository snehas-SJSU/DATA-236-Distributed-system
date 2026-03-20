def parse_user_intent(message: str):
    text = message.lower()

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
    ]

    dietary_words = [
        "vegan",
        "vegetarian",
        "halal",
        "gluten-free",
        "gluten free",
    ]

    ambiance_words = [
        "romantic",
        "casual",
        "family-friendly",
        "family friendly",
        "quiet",
        "outdoor",
        "wifi",
    ]

    occasion_words = [
        "anniversary",
        "date",
        "birthday",
        "dinner",
        "lunch",
        "breakfast",
    ]

    price_words = ["$", "$$", "$$$", "$$$$"]

    found_cuisines = [item for item in cuisines if item in text]
    found_dietary = [item for item in dietary_words if item in text]
    found_ambiance = [item for item in ambiance_words if item in text]
    found_occasions = [item for item in occasion_words if item in text]
    found_prices = [item for item in price_words if item in message]

    return {
        "cuisines": found_cuisines,
        "dietary": found_dietary,
        "ambiance": found_ambiance,
        "occasions": found_occasions,
        "price_range": found_prices[0] if found_prices else None,
    }