export interface WeatherData {
  city: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    pressure: number;
    uvIndex: number;
    isDay: boolean;
    weatherCode: number;
    conditionText: string;
  };
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    co: number;
    no2: number;
    so2: number;
    o3: number;
    description: string;
  };
  hourly: {
    time: string[];
    temp: number[];
    rainProb: number[];
    weatherCode: number[];
  };
  daily: {
    date: string[];
    tempMax: number[];
    tempMin: number[];
    weatherCode: number[];
    rainProbMax: number[];
    uvIndexMax: number[];
    sunrise: string[];
    sunset: string[];
  };
}

// Map WMO codes to human-readable weather descriptions
export function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56: return 'Light freezing drizzle';
    case 57: return 'Dense freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66: return 'Light freezing rain';
    case 67: return 'Heavy freezing rain';
    case 71: return 'Slight snow fall';
    case 73: return 'Moderate snow fall';
    case 75: return 'Heavy snow fall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return 'Unknown weather';
  }
}

// Convert AQI value to category description
export function getAqiDescription(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// Geocode city name to coordinates
export async function geocodeCity(city: string): Promise<{
  lat: number;
  lon: number;
  name: string;
  country: string;
  state?: string;
} | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding service error');
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
      country: result.country || '',
      state: result.admin1
    };
  } catch (error) {
    console.error('Error geocoding city:', error);
    return null;
  }
}

// Fetch unified weather report for a city
export async function getWeatherData(city: string): Promise<WeatherData | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;
  
  const { lat, lon, name, country, state } = geo;
  
  // Forecast endpoints
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
  
  try {
    const [forecastRes, aqiRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(airQualityUrl)
    ]);
    
    if (!forecastRes.ok) throw new Error('Forecast API returned an error status');
    
    const forecastData = await forecastRes.json();
    const aqiData = aqiRes.ok ? await aqiRes.json() : null;
    
    const current = forecastData.current;
    const hourly = forecastData.hourly;
    const daily = forecastData.daily;
    
    // Find current UV index from hourly data or use index 0
    const uvIndex = hourly?.uv_index ? hourly.uv_index[0] : 0;
    const visibility = hourly?.visibility ? hourly.visibility[0] : 10000;
    
    // Map current air quality
    const aqCurrent = aqiData?.current || {};
    const aqiVal = aqCurrent.us_aqi || 25; // fallback
    
    const airQuality = {
      aqi: aqiVal,
      pm25: aqCurrent.pm2_5 || 0,
      pm10: aqCurrent.pm10 || 0,
      co: aqCurrent.carbon_monoxide || 0,
      no2: aqCurrent.nitrogen_dioxide || 0,
      so2: aqCurrent.sulphur_dioxide || 0,
      o3: aqCurrent.ozone || 0,
      description: getAqiDescription(aqiVal)
    };
    
    // Process hourly (next 24 hours)
    const times24 = (hourly?.time || []).slice(0, 24);
    const temps24 = (hourly?.temperature_2m || []).slice(0, 24);
    const rainProb24 = (hourly?.precipitation_probability || []).slice(0, 24);
    const codes24 = (hourly?.weather_code || []).slice(0, 24);
    
    // Process daily (next 7 days)
    const dates7 = daily?.time || [];
    const tempsMax7 = daily?.temperature_2m_max || [];
    const tempsMin7 = daily?.temperature_2m_min || [];
    const codes7 = daily?.weather_code || [];
    const rainProbMax7 = daily?.precipitation_probability_max || [];
    const uvMax7 = daily?.uv_index_max || [];
    const sunrise7 = daily?.sunrise || [];
    const sunset7 = daily?.sunset || [];
    
    return {
      city: name,
      country,
      state,
      latitude: lat,
      longitude: lon,
      current: {
        temp: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        visibility: visibility,
        pressure: current.pressure_msl,
        uvIndex: uvIndex,
        isDay: current.is_day === 1,
        weatherCode: current.weather_code,
        conditionText: getWeatherDescription(current.weather_code)
      },
      airQuality,
      hourly: {
        time: times24,
        temp: temps24,
        rainProb: rainProb24,
        weatherCode: codes24
      },
      daily: {
        date: dates7,
        tempMax: tempsMax7,
        tempMin: tempsMin7,
        weatherCode: codes7,
        rainProbMax: rainProbMax7,
        uvIndexMax: uvMax7,
        sunrise: sunrise7,
        sunset: sunset7
      }
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}
