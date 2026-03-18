const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

export interface CurrentWeather {
  temp_c: number;
  condition: { text: string; icon: string; code: number };
}

export interface WeatherResponse {
  location: { name: string };
  current: CurrentWeather;
}

export async function getCurrentWeather(q: string = 'Rotterdam'): Promise<WeatherResponse | null> {
  const key = import.meta.env.PUBLIC_WEATHER_API_KEY ?? import.meta.env.WEATHER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `${WEATHER_API_BASE}/current.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as WeatherResponse;
  } catch {
    return null;
  }
}
