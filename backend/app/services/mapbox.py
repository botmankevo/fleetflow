"""
Mapbox service for commercial truck routing and geocoding
"""
import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings


class MapboxService:
    """Mapbox API integration for truck routing and geocoding"""
    
    BASE_URL = "https://api.mapbox.com"
    
    def __init__(self):
        self.api_key = settings.MAPBOX_API_KEY
        if not self.api_key:
            raise ValueError("MAPBOX_API_KEY is not configured")
    
    def get_truck_route(
        self,
        coordinates: List[tuple],  # [(lon, lat), (lon, lat), ...]
        waypoints: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Get optimized truck route between multiple points
        
        Args:
            coordinates: List of (longitude, latitude) tuples
            waypoints: Optional list of waypoint indices for specific order
        
        Returns:
            Route data with distances, durations, and geometry
        """
        if len(coordinates) < 2:
            raise ValueError("At least 2 coordinates required for routing")
        
        # Format coordinates as semicolon-separated string
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        
        # Use driving-traffic profile with truck restrictions
        url = f"{self.BASE_URL}/directions/v5/mapbox/driving/{coords_str}"
        
        params = {
            "access_token": self.api_key,
            "geometries": "geojson",
            "overview": "full",
            "steps": "true",
            "alternatives": "false",
            "exclude": "ferry",  # Exclude ferries for trucks
            "annotations": "distance,duration"
        }
        
        # Add waypoints if specified
        if waypoints:
            params["waypoints"] = ";".join([str(i) for i in waypoints])
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get("routes"):
            raise ValueError("No route found")
        
        route = data["routes"][0]
        
        # Parse legs for segment-by-segment breakdown
        legs = []
        for leg in route.get("legs", []):
            legs.append({
                "distance_meters": leg["distance"],
                "distance_miles": round(leg["distance"] * 0.000621371, 2),
                "duration_seconds": leg["duration"],
                "duration_hours": round(leg["duration"] / 3600, 2),
            })
        
        return {
            "total_distance_miles": round(route["distance"] * 0.000621371, 2),
            "total_duration_hours": round(route["duration"] / 3600, 2),
            "geometry": route["geometry"],
            "legs": legs,
            "waypoint_order": route.get("waypoint_order", []),
        }
    
    def geocode_address(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Geocode an address to coordinates
        
        Args:
            address: Street address to geocode
        
        Returns:
            Dictionary with coordinates and formatted address
        """
        url = f"{self.BASE_URL}/geocoding/v5/mapbox.places/{requests.utils.quote(address)}.json"
        
        params = {
            "access_token": self.api_key,
            "limit": 1,
            "types": "address,poi"
        }
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get("features"):
            return None
        
        feature = data["features"][0]
        coords = feature["geometry"]["coordinates"]
        
        return {
            "longitude": coords[0],
            "latitude": coords[1],
            "formatted_address": feature.get("place_name", address),
            "place_type": feature.get("place_type", []),
        }
    
    def autocomplete_address(self, query: str, proximity: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Get address autocomplete suggestions
        
        Args:
            query: Partial address query
            proximity: Optional (lon, lat) tuple to bias results
        
        Returns:
            List of address suggestions
        """
        url = f"{self.BASE_URL}/geocoding/v5/mapbox.places/{requests.utils.quote(query)}.json"
        
        params = {
            "access_token": self.api_key,
            "limit": 5,
            "types": "address,poi",
            "autocomplete": "true"
        }
        
        if proximity:
            params["proximity"] = f"{proximity[0]},{proximity[1]}"
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        data = response.json()
        
        suggestions = []
        for feature in data.get("features", []):
            coords = feature["geometry"]["coordinates"]
            suggestions.append({
                "place_name": feature.get("place_name"),
                "text": feature.get("text"),
                "longitude": coords[0],
                "latitude": coords[1],
                "context": feature.get("context", []),
            })
        
        return suggestions
    
    def calculate_route_with_stops(self, addresses: List[str]) -> Dict[str, Any]:
        """
        Calculate route through multiple addresses
        
        Args:
            addresses: List of addresses in order
        
        Returns:
            Complete route information with leg-by-leg breakdown
        """
        # Geocode all addresses
        coordinates = []
        geocoded_addresses = []
        
        for address in addresses:
            result = self.geocode_address(address)
            if not result:
                raise ValueError(f"Could not geocode address: {address}")
            
            coordinates.append((result["longitude"], result["latitude"]))
            geocoded_addresses.append(result["formatted_address"])
        
        # Get route
        route_data = self.get_truck_route(coordinates)
        
        # Add address info to legs
        for i, leg in enumerate(route_data["legs"]):
            leg["from_address"] = geocoded_addresses[i]
            leg["to_address"] = geocoded_addresses[i + 1]
        
        route_data["addresses"] = geocoded_addresses
        
        return route_data


def calculate_rate_per_mile(rate_amount: float, total_miles: float) -> float:
    """Calculate rate per mile"""
    if total_miles <= 0:
        return 0.0
    return round(rate_amount / total_miles, 2)


def get_rate_color(rate_per_mile: float) -> str:
    """
    Get color code for rate per mile
    
    Returns:
        'green' for excellent (>$2.50/mile)
        'yellow' for acceptable ($1.50-$2.50/mile)
        'red' for poor (<$1.50/mile)
    """
    if rate_per_mile >= 2.50:
        return "green"
    elif rate_per_mile >= 1.50:
        return "yellow"
    else:
        return "red"
