TYPO_MAP = {
    "cofee": "coffee",
    "coffe": "coffee",
    "coffeee": "coffee",
    "expresso": "espresso",
    "capuccino": "cappuccino",
    "omlet": "omelette",
    "omelet": "omelette",
    "omelete": "omelette",
    "panckes": "pancakes",
    "waffels": "waffles",
    "briyani": "biryani",
    "biriyani": "biryani",
    "tandori": "tandoori",
    "tandoorii": "tandoori",
    "chiken": "chicken",
    "sushii": "sushi",
    "nudles": "noodles",
    "padthai": "pad thai",
    "smothie": "smoothie",
    "friese": "fries",
}

SYNONYM_MAP = {
    "cafe": "coffee",
    "café": "coffee",
    "java": "coffee",
    "brunch spot": "brunch",
    "breakfast spot": "breakfast",
    "cheap eats": "budget",
    "budget friendly": "budget",
    "date night": "romantic",
    "special occasion": "anniversary",
    "veg": "vegan",
    "plant based": "vegan",
    "tea house": "coffee",
    "noodle": "noodles",
    "burger joint": "burger",
    "pie": "pizza",
}


def normalize_user_text(message: str) -> str:
    text = (message or "").lower().strip()
    if not text:
        return ""

    words = text.split()
    normalized_words = [TYPO_MAP.get(word, word) for word in words]
    normalized_text = " ".join(normalized_words)

    for source, target in SYNONYM_MAP.items():
        normalized_text = normalized_text.replace(source, target)

    return normalized_text