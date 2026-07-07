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
