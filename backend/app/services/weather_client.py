from datetime import datetime, timezone

import httpx

from app.config import settings


async def fetch_forecast(lat: float, lon: float) -> dict:
    """Pull daily rainfall / temp / humidity forecast for a farm location."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min",
        "hourly": "relative_humidity_2m",
        "timezone": "Asia/Ho_Chi_Minh",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.open_meteo_base_url}/forecast", params=params)
        resp.raise_for_status()
        return resp.json()


async def get_today_reading(lat: float, lon: float) -> dict:
    """Reduce a raw forecast response to today's rainfall/temp/humidity."""
    forecast = await fetch_forecast(lat, lon)
    daily = forecast["daily"]
    hourly = forecast["hourly"]["relative_humidity_2m"][:24]
    return {
        "ts": datetime.now(timezone.utc),
        "rainfall_mm": daily["precipitation_sum"][0],
        "temp_c": (daily["temperature_2m_max"][0] + daily["temperature_2m_min"][0]) / 2,
        "humidity_pct": sum(hourly) / len(hourly),
    }
