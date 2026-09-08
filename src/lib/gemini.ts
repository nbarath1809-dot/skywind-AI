import { GoogleGenAI } from '@google/genai';
import { WeatherData } from './weather';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const MODEL = 'gemini-2.5-flash';

export interface WeatherInsights {
  summary: string;
  rainPrediction: string;
  stormAlert: string;
  travelRecommendation: string;
  healthAdvisory: string;
  agricultureSuggestion: string;
  energyConsumption: string;
}

export async function generateWeatherInsights(
  weatherData: WeatherData
): Promise<WeatherInsights> {
  if (!ai) {
    return {
      summary: `Weather insights for ${weatherData.city} are currently unavailable because the Gemini API key is missing.`,
      rainPrediction: 'No prediction available.',
      stormAlert: 'No warning available.',
      travelRecommendation: 'No recommendation available.',
      healthAdvisory: 'No advisory available.',
      agricultureSuggestion: 'No suggestions available.',
      energyConsumption: 'No recommendations available.'
    };
  }

  try {
    const prompt = `
You are the expert meteorological AI engine for "SkyMind AI Weather".

Analyze the following weather data for ${weatherData.city}, ${weatherData.country} (${weatherData.state || ''}).

Weather Data:
- Latitude: ${weatherData.latitude}
- Longitude: ${weatherData.longitude}
- Temperature: ${weatherData.current.temp}°C
- Feels Like: ${weatherData.current.feelsLike}°C
- Humidity: ${weatherData.current.humidity}%
- Wind: ${weatherData.current.windSpeed} km/h
- UV Index: ${weatherData.current.uvIndex}
- Visibility: ${weatherData.current.visibility}m
- Pressure: ${weatherData.current.pressure} hPa
- Condition: ${weatherData.current.conditionText}
- Weather Code: ${weatherData.current.weatherCode}

Air Quality:
- AQI: ${weatherData.airQuality.aqi}
- Description: ${weatherData.airQuality.description}
- PM2.5: ${weatherData.airQuality.pm25}
- PM10: ${weatherData.airQuality.pm10}

Next 7 Days:
${weatherData.daily.date
  .map(
    (date, idx) =>
      `${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Probability ${weatherData.daily.rainProbMax[idx]}%, UV ${weatherData.daily.uvIndexMax[idx]}`
  )
  .join('\n')}

Return ONLY valid JSON with these keys:

{
  "summary": "",
  "rainPrediction": "",
  "stormAlert": "",
  "travelRecommendation": "",
  "healthAdvisory": "",
  "agricultureSuggestion": "",
  "energyConsumption": ""
}

Base your answer strictly on the supplied weather data.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';

    return JSON.parse(text) as WeatherInsights;

  } catch (error) {
    console.error('Gemini Weather Insights Error:', error);

    return {
      summary: `Failed to generate weather insights for ${weatherData.city}.`,
      rainPrediction: 'Analysis error.',
      stormAlert: 'Analysis error.',
      travelRecommendation: 'Analysis error.',
      healthAdvisory: 'Analysis error.',
      agricultureSuggestion: 'Analysis error.',
      energyConsumption: 'Analysis error.'
    };
  }
}


export async function chatWithWeatherAssistant(
  userMessage: string,
  history: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[],
  weatherData: WeatherData | null
): Promise<string> {

  if (!ai) {
    return 'Gemini API key is missing. Please configure GEMINI_API_KEY.';
  }

  try {

    let systemContext = `
You are "SkyMind AI", a professional, friendly weather assistant.

Your job is to:
- Answer weather questions
- Explain weather conditions
- Give clothing recommendations
- Give travel recommendations
- Give farming recommendations
- Explain weather in simple language

Keep responses concise, useful and well structured.
`;

    if (weatherData) {
      systemContext += `

Current Weather Context:

City: ${weatherData.city}, ${weatherData.country}

Temperature: ${weatherData.current.temp}°C
Feels Like: ${weatherData.current.feelsLike}°C
Humidity: ${weatherData.current.humidity}%
Wind Speed: ${weatherData.current.windSpeed} km/h
Wind Direction: ${weatherData.current.windDirection}°
UV Index: ${weatherData.current.uvIndex}
Condition: ${weatherData.current.conditionText}

Air Quality:
AQI: ${weatherData.airQuality.aqi}
Description: ${weatherData.airQuality.description}

7-Day Forecast:

${weatherData.daily.date
  .map(
    (date, idx) =>
      `${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Probability ${weatherData.daily.rainProbMax[idx]}%`
  )
  .join('\n')}
`;
    }

    const contents = [
      ...history,
      {
        role: 'user' as const,
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemContext
      }
    });

    return response.text || 'I could not generate a response.';

  } catch (error) {

    console.error('Gemini Chat Error:', error);

    return 'I encountered an error while communicating with Gemini. Please try again.';
  }
}
