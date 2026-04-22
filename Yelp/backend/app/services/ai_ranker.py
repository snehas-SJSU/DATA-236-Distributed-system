def score_restaurant(restaurant, parsed_intent, user_preferences):
    score = 0
    reasons = []

    price_order = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4}

    cuisine_text = (restaurant.cuisine_type or "").lower()
    city_text = (restaurant.city or "").lower()
    address_text = (restaurant.address or "").lower()
    description_text = (restaurant.description or "").lower()

    keyword_text = " ".join([str(x) for x in (restaurant.keywords or [])]).lower()
    amenities_text = " ".join([str(x) for x in (restaurant.amenities or [])]).lower()

    combined_text = " ".join([
        cuisine_text,
        city_text,
        address_text,
        description_text,
        keyword_text,
        amenities_text,
    ])

    requested_cuisines = parsed_intent.get("cuisines") or []
    saved_cuisines = user_preferences.get("cuisines") or []

    requested_price = parsed_intent.get("price_range")
    saved_price = user_preferences.get("price_range")

    # 1. Current query cuisine should be strongest.
    if requested_cuisines:
        matched_requested_cuisine = False

        for cuisine in requested_cuisines:
            if cuisine.lower() in cuisine_text:
                score += 10
                reasons.append("matches your requested cuisine")
                matched_requested_cuisine = True
                break

        if not matched_requested_cuisine:
            score -= 12

    # 2. Saved cuisine should still stay strong when no query cuisine is given.
    elif saved_cuisines:
        matched_saved_cuisine = False

        for cuisine in saved_cuisines:
            if cuisine.lower() in cuisine_text:
                score += 8
                reasons.append("matches your saved cuisine preference")
                matched_saved_cuisine = True
                break

        if not matched_saved_cuisine:
            score -= 10

    # 3. Current query price.
    if requested_price:
        if restaurant.price_range == requested_price:
            score += 10
            reasons.append("fits your price range")
        else:
            requested = price_order.get(requested_price, 2)
            actual = price_order.get(restaurant.price_range, 2)
            diff = abs(actual - requested)
            score -= diff * 4

    # 4. Saved price preference.
    elif saved_price:
        if restaurant.price_range == saved_price:
            score += 6
            reasons.append("matches your saved price preference")
        else:
            requested = price_order.get(saved_price, 2)
            actual = price_order.get(restaurant.price_range, 2)
            diff = abs(actual - requested)
            score -= diff * 3

    # 5. Dietary match.
    for item in (parsed_intent.get("dietary") or user_preferences.get("dietary") or []):
        if item.lower() in combined_text:
            score += 2
            reasons.append("fits your dietary preference")
            break

    # 6. Ambiance match.
    for item in (parsed_intent.get("ambiance") or user_preferences.get("ambiance") or []):
        if item.lower() in combined_text:
            score += 2
            reasons.append("matches your preferred ambiance")
            break

    # 7. Location match.
    for loc in (user_preferences.get("locations") or []):
        loc_lower = loc.lower().strip()
        if loc_lower and (loc_lower in city_text or loc_lower in address_text):
            score += 3
            reasons.append("matches your preferred location")
            break

    # 8. Rating bonus stays smaller than cuisine/price logic.
    if restaurant.average_rating:
        score += float(restaurant.average_rating) * 0.4

    # 9. Open status bonus.
    if restaurant.is_open:
        score += 1

    if not reasons:
        reasons.append("looks like a strong overall match")

    return score, reasons