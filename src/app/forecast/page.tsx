'use client';

import React, { useState } from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { WeatherCharts } from '@/components/WeatherCharts';
import { WeatherIcon } from '@/components/WeatherCard';
import { Calendar, Search, MapPin, Loader2, ThermometerSun } from 'lucide-react';

export default function ForecastPage() {
  const { weatherData, loading, fetchWeather, themeStyles, units } = useWeatherTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const success = await fetchWeather(searchQuery);
    if (success) setSearchQuery('');
  };

  const formatTemp = (celsius: number) => {
    if (units === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and City selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ThermometerSun className="w-8 h-8 text-sky-400" />
            <span>Advanced Forecasts</span>
          </h2>
          <p className="text-slate-400 text-sm">
            {weatherData 
              ? `Displaying meteorological timeline reports for ${weatherData.city}, ${weatherData.country}` 
              : 'Interactive hourly and weekly temperature timelines'}
          </p>
        </div>

        {/* Small inline search */}
        <form onSubmit={handleSearch} className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search another city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl border border-white/10 bg-slate-900/40 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all text-xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600/50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {weatherData ? (
        <div className="grid grid-cols-1 gap-8">
          {/* Main Chart Section */}
          <WeatherCharts data={weatherData} />

          {/* 7-Day Quick Overview cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              <span>7-Day Outlook Overview</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {weatherData.daily.date.map((date, idx) => {
                const dayName = new Date(date).toLocaleDateString([], { weekday: 'short' });
                const dateLabel = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
                const code = weatherData.daily.weatherCode[idx];
                const maxTemp = weatherData.daily.tempMax[idx];
                const minTemp = weatherData.daily.tempMin[idx];
                const rainProb = weatherData.daily.rainProbMax[idx];

                return (
                  <div 
                    key={date} 
                    className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] ${themeStyles.cardBg} ${themeStyles.borderColor}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{dayName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{dateLabel}</p>
                    </div>

                    <div className="my-4 bg-white/5 p-3 rounded-lg border border-white/5">
                      <WeatherIcon code={code} isDay={true} className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <span className="font-bold text-rose-300">{formatTemp(maxTemp)}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-semibold text-sky-300">{formatTemp(minTemp)}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-cyan-400">{rainProb}% rain</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <MapPin className="w-12 h-12 text-slate-600 mb-4 animate-bounce-slow" />
          <h3 className="text-xl font-bold text-slate-300">No Location Selected</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Please select or search for a city to see the temperature graphs and weekly forecasts.
          </p>
        </div>
      )}
    </div>
  );
}
