import { GoogleGenAI } from '@google/genai';
import { WeatherData } from './weather';

// Initialize Gemini client
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

// Generate structured weather reports using Gemini
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

Generate professional predictions, recommendations, and advisories.

Weather Data:

- Latitude: ${weatherData.latitude}
- Longitude: ${weatherData.longitude}

Current Conditions:
- Temperature: ${weatherData.current.temp}°C
- Feels Like: ${weatherData.current.feelsLike}°C
- Humidity: ${weatherData.current.humidity}%
- Wind Speed: ${weatherData.current.windSpeed} km/h
- UV Index: ${weatherData.current.uvIndex}
- Visibility: ${weatherData.current.visibility}m
- Pressure: ${weatherData.current.pressure} hPa
- Weather Code: ${weatherData.current.weatherCode}
- Condition: ${weatherData.current.conditionText}

Air Quality:
- US AQI: ${weatherData.airQuality.aqi}
- Description: ${weatherData.airQuality.description}
- PM2.5: ${weatherData.airQuality.pm25} µg/m³
- PM10: ${weatherData.airQuality.pm10} µg/m³
- Ozone: ${weatherData.airQuality.o3} ppb

Next 7 Days:
${weatherData.daily.date
  .map(
    (date, idx) =>
      `- ${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Probability: ${weatherData.daily.rainProbMax[idx]}%, UV Max: ${weatherData.daily.uvIndexMax[idx]}`
  )
  .join('\n')}

Generate insights STRICTLY from the supplied weather data.

Return ONLY a valid JSON object with exactly these keys:

{
  "summary": "...",
  "rainPrediction": "...",
  "stormAlert": "...",
  "travelRecommendation": "...",
  "healthAdvisory": "...",
  "agricultureSuggestion": "...",
  "energyConsumption": "..."
}

Keep each value concise and useful.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(text) as WeatherInsights;

    return parsed;

  } catch (error) {
    console.error(
      'Error generating weather insights from Gemini:',
      error
    );

    return {
      summary: `Failed to compile automated insights for ${weatherData.city} due to an API processing error.`,
      rainPrediction: 'Analysis error.',
      stormAlert: 'Analysis error.',
      travelRecommendation: 'Analysis error.',
      healthAdvisory: 'Analysis error.',
      agricultureSuggestion: 'Analysis error.',
      energyConsumption: 'Analysis error.'
    };
  }
}


// Conversation assistant for AI Chat page
export async function chatWithWeatherAssistant(
  userMessage: string,
  history: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[],
  weatherData: WeatherData | null
): Promise<string> {

  if (!ai) {
    return "I'm sorry, my Gemini brain is currently offline. Please configure the GEMINI_API_KEY in Vercel.";
  }

  try {

    // System instruction
    let systemContext = `
You are "SkyMind AI", a professional, friendly, and helpful weather forecasting expert chatbot.

Your responsibilities:
- Answer weather-related questions.
- Explain current weather conditions.
- Compare weather conditions.
- Give clothing recommendations.
- Give travel recommendations.
- Give farming/agriculture recommendations.
- Give outdoor activity recommendations.
- Explain rain probability and weather forecasts.

Keep answers:
- Concise
- Clear
- Friendly
- Well structured
- Easy to understand

Do not invent weather information.
Use the supplied weather data whenever it is relevant.
`;

    // Add real-time weather context
    if (weatherData) {

      systemContext += `

CURRENT WEATHER CONTEXT

Location:
${weatherData.city}, ${weatherData.country}

Current Conditions:
- Temperature: ${weatherData.current.temp}°C
- Feels Like: ${weatherData.current.feelsLike}°C
- Humidity: ${weatherData.current.humidity}%
- UV Index: ${weatherData.current.uvIndex}
- Wind Speed: ${weatherData.current.windSpeed} km/h
- Wind Direction: ${weatherData.current.windDirection}°
- Condition: ${weatherData.current.conditionText}
- Weather Code: ${weatherData.current.weatherCode}

Air Quality:
- AQI: ${weatherData.airQuality.aqi}
- Description: ${weatherData.airQuality.description}

7-Day Forecast:
${weatherData.daily.date
  .map(
    (date, idx) =>
      `- ${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Probability: ${weatherData.daily.rainProbMax[idx]}%`
  )
  .join('\n')}

Use this weather context when answering the user's questions.
`;

    } else {

      systemContext += `

No specific weather location is currently selected.

If the user asks for localized weather information,
politely ask them which city/location they are interested in.
`;
    }

    // Prepare conversation history
    const contents = [
      ...history,
      {
        role: 'user' as const,
        parts: [{ text: userMessage }]
      }
    ];

    // Send request to Gemini
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemContext
      }
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;

  } catch (error) {

    console.error(
      'Error in Gemini Chat assistant:',
      error
    );

    return 'I encountered an error while processing your request. Please try again in a moment.';
  }
}
