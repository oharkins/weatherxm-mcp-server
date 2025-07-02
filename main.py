from mcp.server.fastmcp import FastMCP
import httpx
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from datetime import datetime
import logging

# Load environment variables from .env file
load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHERXM_API_KEY")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger("WeatherMCP")

# Create an MCP server named "WeatherMCP"
mcp = FastMCP(name="WeatherMCP",prompt="This is a WeatherXM server. You can get current weather, forecast, air quality, and astronomy information by calling the available tools.")

# Helper: call WeatherXM API asynchronously
def validate_date(dt_str: str) -> None:
    """
    Ensure date string is in YYYY-MM-DD format.
    Raises HTTPException if invalid.
    """
    try:
        datetime.strptime(dt_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date: {dt_str}. Use YYYY-MM-DD.")

async def fetch(endpoint: str, params: dict = None) -> dict:
    """
    Perform async GET to WeatherXM API and return JSON.
    Raises HTTPException on errors.
    Enhanced: logs requests, handles non-JSON errors gracefully.
    """
    if not WEATHER_API_KEY:
        logger.error("WeatherXM API key not set.")
        raise HTTPException(status_code=500, detail="WeatherXM API key not set.")

    if params is None:
        params = {}
    
    # WeatherXM uses Bearer token authentication
    headers = {
        "Authorization": f"Bearer {WEATHER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"https://api.weatherxm.com/v1/{endpoint}"
    logger.info(f"Requesting {url} with params {params}")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            try:
                data = resp.json()
            except Exception:
                data = None
            if resp.status_code != 200:
                detail = (data or {}).get("error", {}).get("message", resp.text)
                logger.error(f"WeatherXM API error {resp.status_code}: {detail}")
                raise HTTPException(status_code=resp.status_code, detail=detail)
            logger.info(f"WeatherXM API success: {url}")
            return data
        except httpx.RequestError as e:
            logger.error(f"HTTPX request error: {e}")
            raise HTTPException(status_code=500, detail=f"Request error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


# MCP Tools

@mcp.tool()
async def weather_current(lat: float, lon: float) -> dict:
    """
    Get current weather for a location using coordinates.
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
    Returns:
        dict: WeatherXM current weather JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    return await fetch("weather/current", {"lat": lat, "lon": lon})

@mcp.tool()
async def weather_forecast(
    lat: float,
    lon: float,
    days: int = 1
) -> dict:
    """
    Get weather forecast for a location using coordinates.
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
        days (int): Number of days for forecast.
    Returns:
        dict: WeatherXM forecast JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    if days < 1 or days > 7:
        raise HTTPException(status_code=400, detail="'days' must be between 1 and 7.")
    return await fetch("weather/forecast", {"lat": lat, "lon": lon, "days": days})

@mcp.tool()
async def weather_history(lat: float, lon: float, date: str) -> dict:
    """
    Get historical weather for a location on a given date (YYYY-MM-DD).
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
        date (str): Date in YYYY-MM-DD format.
    Returns:
        dict: WeatherXM history JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    validate_date(date)
    return await fetch("weather/history", {"lat": lat, "lon": lon, "date": date})

@mcp.tool()
async def weather_stations(lat: float, lon: float, radius: float = 10.0) -> dict:
    """
    Get nearby weather stations for a location.
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
        radius (float): Search radius in kilometers (default 10km).
    Returns:
        dict: WeatherXM stations JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    return await fetch("stations/nearby", {"lat": lat, "lon": lon, "radius": radius})

@mcp.tool()
async def weather_station_data(station_id: str, start_date: str = None, end_date: str = None) -> dict:
    """
    Get weather data from a specific station.
    Args:
        station_id (str): Weather station ID.
        start_date (str): Start date in YYYY-MM-DD format (optional).
        end_date (str): End date in YYYY-MM-DD format (optional).
    Returns:
        dict: WeatherXM station data JSON.
    """
    if not station_id:
        raise HTTPException(status_code=400, detail="Station ID is required.")
    
    params = {"station_id": station_id}
    if start_date:
        validate_date(start_date)
        params["start_date"] = start_date
    if end_date:
        validate_date(end_date)
        params["end_date"] = end_date
    
    return await fetch("stations/data", params)

@mcp.tool()
async def weather_airquality(lat: float, lon: float) -> dict:
    """
    Get air quality for a location.
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
    Returns:
        dict: WeatherXM air quality JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    return await fetch("weather/air-quality", {"lat": lat, "lon": lon})

@mcp.tool()
async def weather_astronomy(lat: float, lon: float, date: str) -> dict:
    """
    Get astronomy data (sunrise, sunset, moon) for a date (YYYY-MM-DD).
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
        date (str): Date in YYYY-MM-DD format.
    Returns:
        dict: WeatherXM astronomy JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    validate_date(date)
    return await fetch("weather/astronomy", {"lat": lat, "lon": lon, "date": date})

@mcp.tool()
async def weather_location_search(query: str) -> dict:
    """
    Search for locations matching query.
    Args:
        query (str): Location query (city name, address, etc.).
    Returns:
        dict: WeatherXM location search JSON.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Location query is required.")
    return await fetch("locations/search", {"q": query})

@mcp.tool()
async def weather_timezone(lat: float, lon: float) -> dict:
    """
    Get timezone info for a location.
    Args:
        lat (float): Latitude coordinate.
        lon (float): Longitude coordinate.
    Returns:
        dict: WeatherXM timezone JSON.
    """
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    return await fetch("weather/timezone", {"lat": lat, "lon": lon})

# Run the MCP server
if __name__ == "__main__":
    # This starts a Server-Sent Events (SSE) endpoint on port 8000
    mcp.run()
