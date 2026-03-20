import os

from tavily import TavilyClient


def build_live_query(message: str, location: str = "") -> str:
    text = (message or "").strip()

    if location:
        return f"{text} restaurants in {location}"

    return f"{text} restaurants"


def summarize_live_results(items: list[dict], location: str = "") -> str:
    if not items:
        return ""

    titles = []
    for item in items[:3]:
        title = (item.get("title") or "").strip()
        if title:
            titles.append(title)

    if not titles:
        return ""

    if location:
        return (
            f"Live info: I found current web results related to restaurant availability "
            f"in {location}. Please double-check hours before visiting."
        )

    return (
        "Live info: I found current web results related to restaurant availability. "
        "Please double-check hours before visiting."
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
        return summarize_live_results(items, location)

    except Exception:
        return ""