'use client';

import React from 'react';
import { WeatherData, getWeatherDescription } from '@/lib/weather';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  CloudLightning, 
  Wind, 
  Compass, 
  Droplets, 
  Eye, 
  Gauge, 
  SunDim, 
  ShieldAlert, 
  Sunrise, 
  Sunset 
} from 'lucide-react';

interface WeatherCardProps {
  data: WeatherData;
}

// Map WMO Weather Codes to beautiful styled Lucide Icons
export const WeatherIcon: React.FC<{ code: number; isDay: boolean; className?: string }> = ({ 
  code, 
  isDay, 
  className = "w-12 h-12" 
}) => {
  switch (code) {
    case 0:
      return isDay 
        ? <Sun className={`${className} text-amber-400 animate-spin-slow`} /> 
        : <SunDim className={`${className} text-sky-200`} />;
    case 1:
    case 2:
      return isDay 
        ? <CloudSun className={`${className} text-amber-300`} /> 
        : <Cloud className={`${className} text-slate-400`} />;
    case 3:
      return <Cloud className={`${className} text-slate-400`} />;
    case 45:
    case 48:
      return <Wind className={`${className} text-slate-300`} />;
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return <CloudDrizzle className={`${className} text-sky-400`} />;
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return <CloudRain className={`${className} text-blue-400 animate-bounce-slow`} />;
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return <CloudSnow className={`${className} text-blue-100 animate-pulse`} />;
    case 95:
    case 96:
    case 99:
      return <CloudLightning className={`${className} text-violet-400`} />;
    default:
      return <CloudSun className={`${className} text-amber-400`} />;
  }
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const { units, themeStyles } = useWeatherTheme();
  
  const formatTemp = (celsius: number) => {
    if (units === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const getWindDirectionName = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
    return directions[index];
  };

  const aqiColorClass = (aqi: number) => {
    if (aqi <= 50) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (aqi <= 100) return 'text-amber-300 border-amber-500/20 bg-amber-500/5';
    if (aqi <= 150) return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Primary weather status card */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Temperature & Location */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl font-bold tracking-tight">{formatTemp(data.current.temp)}</span>
              <span className="text-sm font-medium text-slate-300">feels like {formatTemp(data.current.feelsLike)}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-semibold mt-3 flex items-center gap-2">
              <span>{data.city}</span>
              {data.state && <span className="text-sm px-2.5 py-0.5 rounded-full bg-white/10 font-normal">{data.state}</span>}
              <span className="text-sm text-slate-300 font-normal">{data.country}</span>
            </h2>
            
            <p className="text-slate-300 mt-1 font-medium capitalize">{data.current.conditionText}</p>
          </div>
          
          {/* Visual Icon */}
          <div className="flex items-center justify-center shrink-0 self-center sm:self-auto bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
            <WeatherIcon code={data.current.weatherCode} isDay={data.current.isDay} className="w-24 h-24" />
          </div>
        </div>
      </div>

      {/* 2. Grid of details */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Wind Speed */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Wind className="w-4.5 h-4.5 text-sky-400" />
            <span>Wind</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{data.current.windSpeed} km/h</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{getWindDirectionName(data.current.windDirection)} ({data.current.windDirection}°)</span>
            </p>
          </div>
        </div>

        {/* Humidity */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Droplets className="w-4.5 h-4.5 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{data.current.humidity}%</p>
            <p className="text-xs text-slate-400 mt-1">Water vapor levels</p>
          </div>
        </div>

        {/* UV Index */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <SunDim className="w-4.5 h-4.5 text-amber-400" />
            <span>UV Index</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{data.current.uvIndex}</p>
            <p className="text-xs text-slate-400 mt-1">
              {data.current.uvIndex <= 2 ? 'Low' : data.current.uvIndex <= 5 ? 'Moderate' : data.current.uvIndex <= 7 ? 'High' : 'Very High'}
            </p>
          </div>
        </div>

        {/* Air Quality Index */}
        <div className={`p-4 rounded-xl border border-dashed flex flex-col justify-between ${aqiColorClass(data.airQuality.aqi)}`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>Air Quality</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{data.airQuality.aqi} AQI</p>
            <p className="text-xs mt-1 font-semibold truncate">{data.airQuality.description}</p>
          </div>
        </div>

        {/* Visibility */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Eye className="w-4.5 h-4.5 text-emerald-400" />
            <span>Visibility</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{(data.current.visibility / 1000).toFixed(1)} km</p>
            <p className="text-xs text-slate-400 mt-1">Atmospheric clarity</p>
          </div>
        </div>

        {/* Pressure */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Gauge className="w-4.5 h-4.5 text-violet-400" />
            <span>Pressure</span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold">{data.current.pressure} hPa</p>
            <p className="text-xs text-slate-400 mt-1">Barometric weight</p>
          </div>
        </div>
      </div>

      {/* 3. Sunrise and Sunset panel */}
      <div className={`p-4 rounded-xl border flex gap-8 items-center justify-around bg-slate-900/10 ${themeStyles.borderColor}`}>
        <div className="flex items-center gap-3">
          <Sunrise className="w-8 h-8 text-amber-300 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sunrise</p>
            <p className="text-sm font-semibold mt-0.5">
              {data.daily.sunrise[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <Sunset className="w-8 h-8 text-orange-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sunset</p>
            <p className="text-sm font-semibold mt-0.5">
              {data.daily.sunset[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
