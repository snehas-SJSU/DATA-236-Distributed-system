import os

from tavily import TavilyClient


def build_live_query(message: str, location: str = "") -> str:
    text = (message or "").strip().lower()

    if "trending" in text or "popular now" in text:
        if location:
            return f"trending restaurants in {location} today"
        return "trending restaurants today"

    if "event" in text or "events" in text or "tonight" in text or "today" in text:
        if location:
            return f"restaurant events in {location} tonight"
        return "restaurant events tonight"

    if "open now" in text or "hours" in text or "currently open" in text:
        if location:
            return f"restaurants open now in {location}"
        return "restaurants open now"

    if location:
        return f"{text} restaurants in {location}"

    return f"{text} restaurants"


def summarize_live_results(query: str, items: list[dict], location: str = "") -> str:
    if not items:
        return ""

    text = (query or "").lower()

    if "trending" in text or "popular now" in text:
        if location:
            return (
                f"Live info: I found current web results related to trending restaurants "
                f"in {location}. Popularity can change quickly, so check recent reviews before visiting."
            )
        return (
            "Live info: I found current web results related to trending restaurants. "
            "Popularity can change quickly, so check recent reviews before visiting."
        )

    if "event" in text or "events" in text or "tonight" in text or "today" in text:
        if location:
            return (
                f"Live info: I found current web results related to restaurant events "
                f"in {location}. Please verify timing and availability before going."
            )
        return (
            "Live info: I found current web results related to restaurant events. "
            "Please verify timing and availability before going."
        )

    if "open now" in text or "hours" in text or "currently open" in text:
        if location:
            return (
                f"Live info: I found current web results related to restaurant availability "
                f"in {location}. Please double-check hours before visiting."
            )
        return (
            "Live info: I found current web results related to restaurant availability. "
            "Please double-check hours before visiting."
        )

    if location:
        return (
            f"Live info: I found current web results related to restaurants in {location}. "
            "Please verify details before visiting."
        )

    return (
        "Live info: I found current web results related to restaurants. "
        "Please verify details before visiting."
    )


def get_live_context(query: str, location: str = "") -> str:
    """
    Fetch short live context from Tavily for queries needing current info.
    Keeps the query restaurant-focused and returns a clean summary.
    """
    if not query or not query.strip():
        return ""

    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return ""

    try:
        client = TavilyClient(api_key=tavily_api_key)

        search_query = build_live_query(query, location)

        result = client.search(
            query=search_query,
            search_depth="basic",
            max_results=3,
        )

        items = result.get("results", [])
        return summarize_live_results(query, items, location)

    except Exception:
        return ""