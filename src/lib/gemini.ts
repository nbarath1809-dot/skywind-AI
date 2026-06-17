import { GoogleGenerativeAI } from '@google/generative-ai';
import { WeatherData } from './weather';

// Initialize the Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

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
export async function generateWeatherInsights(weatherData: WeatherData): Promise<WeatherInsights> {
  if (!apiKey) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
      You are the expert meteorological AI engine for "SkyMind AI Weather".
      Analyze the following weather data for ${weatherData.city}, ${weatherData.country} (${weatherData.state || ''}) and generate professional predictions, recommendations, and advisories.

      Weather Data:
      - Latitude: ${weatherData.latitude}, Longitude: ${weatherData.longitude}
      - Current Conditions: Temp: ${weatherData.current.temp}°C (Feels like ${weatherData.current.feelsLike}°C), Humidity: ${weatherData.current.humidity}%, Wind: ${weatherData.current.windSpeed} km/h, UV: ${weatherData.current.uvIndex}, Visibility: ${weatherData.current.visibility}m, Pressure: ${weatherData.current.pressure} hPa, Weather Code: ${weatherData.current.weatherCode} (${weatherData.current.conditionText}).
      - Air Quality: US AQI: ${weatherData.airQuality.aqi} (${weatherData.airQuality.description}), PM2.5: ${weatherData.airQuality.pm25} µg/m³, PM10: ${weatherData.airQuality.pm10} µg/m³, Ozone: ${weatherData.airQuality.o3} ppb.
      - Next 7 Days (Max Temp / Min Temp / Rain Probability):
        ${weatherData.daily.date.map((date, idx) => `  * ${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Prob: ${weatherData.daily.rainProbMax[idx]}%, UV Max: ${weatherData.daily.uvIndexMax[idx]}`).join('\n')}

      Generate insights based STRICTLY on this data. You MUST return your response as a valid, parsable JSON object with keys: "summary", "rainPrediction", "stormAlert", "travelRecommendation", "healthAdvisory", "agricultureSuggestion", and "energyConsumption". Make all texts concise and use markdown list items or highlights inside the JSON string values where helpful.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as WeatherInsights;
    return parsed;
  } catch (error) {
    console.error('Error generating weather insights from Gemini:', error);
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
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  weatherData: WeatherData | null
): Promise<string> {
  if (!apiKey) {
    return "I'm sorry, my Gemini brain is currently offline. Please configure the `GEMINI_API_KEY` in `.env.local` to start chatting.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Construct the context-enriched system prompt
    let systemContext = `You are "SkyMind AI", a professional, friendly, and helpful weather forecasting expert chatbot. 
    Your goal is to answer the user's weather queries, compare conditions, give recommendations for clothing, travel, farming, or activities. 
    Keep your answers concise, engaging, and well-structured using markdown.`;

    if (weatherData) {
      systemContext += `\n\nYou have access to the current real-time weather context of ${weatherData.city}, ${weatherData.country}:
      - Current Temp: ${weatherData.current.temp}°C (Feels like: ${weatherData.current.feelsLike}°C)
      - Humidity: ${weatherData.current.humidity}%, UV Index: ${weatherData.current.uvIndex}
      - Wind Speed: ${weatherData.current.windSpeed} km/h, Direction: ${weatherData.current.windDirection}°
      - Condition: ${weatherData.current.conditionText} (Code: ${weatherData.current.weatherCode})
      - Air Quality: AQI ${weatherData.airQuality.aqi} (${weatherData.airQuality.description})
      - 7-Day Outlook:
        ${weatherData.daily.date.map((date, idx) => `  * ${date}: Max ${weatherData.daily.tempMax[idx]}°C, Min ${weatherData.daily.tempMin[idx]}°C, Rain Prob: ${weatherData.daily.rainProbMax[idx]}%`).join('\n')}
      Use this context to inform all replies. If the user asks about the weather or recommendations for this location, reference these stats directly.`;
    } else {
      systemContext += `\n\nNo specific city context is selected yet. If the user asks about their weather, politely ask them which city they are interested in, so they can get localized predictions.`;
    }

    // Prepare contents by prepending the system instruction
    const chat = model.startChat({
      history: history.length > 0 ? history : [],
      systemInstruction: systemContext
    });

    const response = await chat.sendMessage(userMessage);
    return response.response.text();
  } catch (error) {
    console.error('Error in Gemini Chat assistant:', error);
    return 'I encountered an error while processing your request. Please try again in a moment.';
  }
}
