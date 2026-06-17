'use server';

import { WeatherData } from '@/lib/weather';
import { generateWeatherInsights, chatWithWeatherAssistant, type WeatherInsights } from '@/lib/gemini';
export type { WeatherInsights };

export async function getAiWeatherInsights(weatherData: WeatherData): Promise<WeatherInsights> {
  return await generateWeatherInsights(weatherData);
}

export async function sendChatMessage(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  weatherData: WeatherData | null
): Promise<string> {
  return await chatWithWeatherAssistant(message, history, weatherData);
}
