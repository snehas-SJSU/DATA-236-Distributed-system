import os

from tavily import TavilyClient


# Build a cleaner Tavily query based on the user's live-information intent.
def build_live_query(message: str, location: str = "") -> str:
    text = (message or "").strip().lower()

    if "trending" in text or "popular now" in text:
        if location:
            return f"best trending restaurants in {location} today"
        return "best trending restaurants today"

    if "open now" in text or "hours" in text or "currently open" in text:
        if location:
            return f"restaurants open now in {location} with current hours"
        return "restaurants open now with current hours"

    if "tonight" in text:
        if location:
            return f"restaurants open for dinner tonight in {location}"
        return "restaurants open for dinner tonight"

    if "today" in text:
        if location:
            return f"restaurants open today in {location}"
        return "restaurants open today"

    if "event" in text or "events" in text:
        if location:
            return f"restaurant specials or dining events in {location} tonight"
        return "restaurant specials or dining events tonight"

    if location:
        return f"restaurants in {location} current information"

    return f"{text} current restaurant information"


# Turn Tavily results into a short, natural live-info sentence.
def summarize_live_results(query: str, items: list[dict], location: str = "") -> str:
    if not items:
        return ""

    text = (query or "").lower()

    if "trending" in text or "popular now" in text:
        if location:
            return f"Live info: I found current web results for popular restaurants in {location}."
        return "Live info: I found current web results for popular restaurants."

    if "open now" in text or "hours" in text or "currently open" in text:
        if location:
            return f"Live info: I found current web results for restaurant hours in {location}."
        return "Live info: I found current web results for restaurant hours."

    if "tonight" in text:
        if location:
            return f"Live info: I found current web results for dinner options in {location} tonight."
        return "Live info: I found current web results for dinner options tonight."

    if "today" in text:
        if location:
            return f"Live info: I found current web results for restaurants in {location} today."
        return "Live info: I found current web results for restaurants today."

    if "event" in text or "events" in text:
        if location:
            return f"Live info: I found current web results for restaurant specials and events in {location}."
        return "Live info: I found current web results for restaurant specials and events."

    if location:
        return f"Live info: I found current web results related to restaurants in {location}."

    return "Live info: I found current web results related to restaurants."


# Fetch short live context from Tavily for queries that need current information.
def get_live_context(query: str, location: str = "") -> str:
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