'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WeatherData, getWeatherData } from '@/lib/weather';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { createClientBrowser } from '@/lib/supabase';

export interface ThemeStyles {
  bgGradient: string;
  cardBg: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  weatherEffect: 'none' | 'sun' | 'clouds' | 'rain' | 'snow' | 'storm';
}

interface WeatherThemeContextProps {
  weatherData: WeatherData | null;
  loading: boolean;
  units: 'C' | 'F';
  setUnits: (u: 'C' | 'F') => void;
  fetchWeather: (city: string) => Promise<boolean>;
  themeStyles: ThemeStyles;
}

const WeatherThemeContext = createContext<WeatherThemeContextProps | undefined>(undefined);

const defaultTheme: ThemeStyles = {
  bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
  cardBg: 'bg-slate-900/40 backdrop-blur-md',
  textColor: 'text-slate-100',
  borderColor: 'border-slate-800/40',
  accentColor: 'text-indigo-400',
  weatherEffect: 'none',
};

export const WeatherThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<'C' | 'F'>('C');
  const [themeStyles, setThemeStyles] = useState<ThemeStyles>(defaultTheme);
  const { showToast } = useToast();
  const { user } = useAuth();
  const supabase = createClientBrowser();

  // Load preferred unit from local storage if available
  useEffect(() => {
    const savedUnit = localStorage.getItem('weather_unit');
    if (savedUnit === 'C' || savedUnit === 'F') {
      setUnits(savedUnit);
    }

    // Default fetch for a common city if none selected yet
    const lastCity = localStorage.getItem('last_searched_city');
    if (lastCity) {
      fetchWeather(lastCity);
    } else {
      fetchWeather('New York');
    }
  }, []);

  const changeUnits = (newUnit: 'C' | 'F') => {
    setUnits(newUnit);
    localStorage.setItem('weather_unit', newUnit);
    showToast(`Switched unit to °${newUnit}`, 'info');
  };

  const getThemeForCode = (code: number, isDay: boolean): ThemeStyles => {
    // Sunny/Clear
    if (code === 0 || code === 1) {
      return {
        bgGradient: isDay 
          ? 'from-sky-400 via-blue-500 to-indigo-950' 
          : 'from-slate-950 via-indigo-950 to-blue-950',
        cardBg: 'bg-white/10 backdrop-blur-md',
        textColor: 'text-white',
        borderColor: 'border-white/10',
        accentColor: isDay ? 'text-amber-300' : 'text-sky-300',
        weatherEffect: 'sun',
      };
    }
    // Cloudy/Overcast
    if (code === 2 || code === 3) {
      return {
        bgGradient: 'from-slate-600 via-slate-800 to-slate-950',
        cardBg: 'bg-slate-900/50 backdrop-blur-md',
        textColor: 'text-slate-100',
        borderColor: 'border-slate-700/30',
        accentColor: 'text-slate-300',
        weatherEffect: 'clouds',
      };
    }
    // Fog/Mist
    if (code === 45 || code === 48) {
      return {
        bgGradient: 'from-zinc-700 via-stone-800 to-zinc-950',
        cardBg: 'bg-zinc-900/50 backdrop-blur-md',
        textColor: 'text-zinc-100',
        borderColor: 'border-zinc-800/30',
        accentColor: 'text-zinc-400',
        weatherEffect: 'clouds',
      };
    }
    // Rain/Drizzle
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return {
        bgGradient: 'from-cyan-900 via-blue-950 to-slate-950',
        cardBg: 'bg-slate-900/60 backdrop-blur-lg',
        textColor: 'text-cyan-50',
        borderColor: 'border-cyan-800/30',
        accentColor: 'text-cyan-400',
        weatherEffect: 'rain',
      };
    }
    // Snow
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return {
        bgGradient: 'from-blue-900 via-indigo-950 to-slate-950',
        cardBg: 'bg-white/5 backdrop-blur-md',
        textColor: 'text-blue-50',
        borderColor: 'border-white/5',
        accentColor: 'text-blue-200',
        weatherEffect: 'snow',
      };
    }
    // Thunderstorm
    if (code >= 95) {
      return {
        bgGradient: 'from-violet-950 via-slate-950 to-neutral-950',
        cardBg: 'bg-black/60 backdrop-blur-xl',
        textColor: 'text-violet-100',
        borderColor: 'border-violet-900/30',
        accentColor: 'text-violet-400',
        weatherEffect: 'storm',
      };
    }

    return defaultTheme;
  };

  const fetchWeather = async (city: string): Promise<boolean> => {
    if (!city.trim()) return false;
    setLoading(true);
    try {
      const data = await getWeatherData(city);
      if (data) {
        setWeatherData(data);
        setThemeStyles(getThemeForCode(data.current.weatherCode, data.current.isDay));
        localStorage.setItem('last_searched_city', data.city);
        
        // Log search history to Supabase if user is logged in
        if (user) {
          await supabase.from('weather_search_history').insert({
            user_id: user.id,
            city: data.city,
            temperature: data.current.temp,
            weather_condition: data.current.conditionText
          });
        }
        
        return true;
      } else {
        showToast(`Could not find weather data for "${city}"`, 'error');
        return false;
      }
    } catch (error) {
      console.error(error);
      showToast('Network error while fetching weather data.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WeatherThemeContext.Provider
      value={{
        weatherData,
        loading,
        units,
        setUnits: changeUnits,
        fetchWeather,
        themeStyles,
      }}
    >
      {children}
    </WeatherThemeContext.Provider>
  );
};

export const useWeatherTheme = () => {
  const context = useContext(WeatherThemeContext);
  if (!context) {
    throw new Error('useWeatherTheme must be used within a WeatherThemeProvider');
  }
  return context;
};
