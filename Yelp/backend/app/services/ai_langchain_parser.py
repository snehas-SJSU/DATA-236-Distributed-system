import json

from langchain_groq import ChatGroq


# Parse restaurant intent with LangChain + Groq.
def parse_user_intent_with_langchain(message: str) -> dict:
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
    )

    prompt = f"""
You are an intent parser for a restaurant recommendation chatbot.

Read the user message and extract structured intent.

Return only valid JSON with this exact shape:
{{
  "cuisines": [],
  "dietary": [],
  "ambiance": [],
  "occasions": [],
  "price_range": null
}}

Rules:
- cuisines should be a list of cuisine or food-category words like ["italian", "indian", "sushi", "pizza"]
- dietary should be a list like ["vegan", "vegetarian", "halal", "gluten-free"]
- ambiance should be a list like ["romantic", "casual", "quiet", "outdoor", "upscale"]
- occasions should be a list like ["anniversary", "birthday", "date night", "breakfast", "brunch", "dinner"]
- price_range must be one of: "$", "$$", "$$$", "$$$$", or null
- if the user says cheap or affordable, prefer "$"
- if the user says mid-range or moderate, prefer "$$"
- if the user says expensive, upscale, or fine dining, prefer "$$$"
- do not explain anything
- return JSON only

User message:
{message}
"""

    response = llm.invoke(prompt)
    content = (response.content or "").strip()

    parsed = json.loads(content)

    return {
        "cuisines": parsed.get("cuisines", []) or [],
        "dietary": parsed.get("dietary", []) or [],
        "ambiance": parsed.get("ambiance", []) or [],
        "occasions": parsed.get("occasions", []) or [],
        "price_range": parsed.get("price_range"),
    }