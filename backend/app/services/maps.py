import requests
from app.core.config import settings


def get_route(from_address: str, to_address: str) -> dict:
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY is required")
    params = {
        "origins": from_address,
        "destinations": to_address,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    res = requests.get("https://maps.googleapis.com/maps/api/distancematrix/json", params=params, timeout=20)
    res.raise_for_status()
    data = res.json()
    element = data["rows"][0]["elements"][0]
    return {
        "distance_text": element["distance"]["text"],
        "duration_text": element["duration"]["text"],
    }
