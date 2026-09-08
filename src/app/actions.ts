'use server';

import type { WeatherData } from '@/lib/weather';

import {
  generateWeatherInsights,
  chatWithWeatherAssistant,
} from '@/lib/gemini';

/* =========================================================
   WEATHER AI INSIGHTS
   ========================================================= */

export async function getAiWeatherInsights(
  weatherData: WeatherData
) {
  return await generateWeatherInsights(weatherData);
}

/* =========================================================
   CHAT WITH GEMINI
   ========================================================= */

export async function sendChatMessage(
  message: string,
  history: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[],
  weatherData: WeatherData | null
): Promise<string> {
  return await chatWithWeatherAssistant(
    message,
    history,
    weatherData
  );
}
