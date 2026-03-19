def score_restaurant(restaurant, parsed_intent, user_preferences):
    score = 0
    reasons = []

    # 1. Query cuisine match
    if parsed_intent["cuisines"]:
        for cuisine in parsed_intent["cuisines"]:
            if cuisine.lower() in (restaurant.cuisine_type or "").lower():
                score += 5
                reasons.append("matches your requested cuisine")
                break

    # 2. Saved cuisine preference match
    elif user_preferences["cuisines"]:
        for cuisine in user_preferences["cuisines"]:
            if cuisine.lower() in (restaurant.cuisine_type or "").lower():
                score += 3
                reasons.append("matches your saved cuisine preference")
                break

    # 3. Price match
    if parsed_intent["price_range"]:
        if restaurant.price_range == parsed_intent["price_range"]:
            score += 3
            reasons.append("fits your price range")
    elif user_preferences["price_range"]:
        if restaurant.price_range == user_preferences["price_range"]:
            score += 2
            reasons.append("matches your saved price preference")

    # 4. Rating bonus
    if restaurant.average_rating:
        score += float(restaurant.average_rating)

    # 5. Open status bonus
    if restaurant.is_open:
        score += 1

    if not reasons:
        reasons.append("looks like a strong overall match")

    return score, reasons