'use client';

import React, { useState, useEffect } from 'react';
import { WeatherData } from '@/lib/weather';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Thermometer, CloudRain, Calendar, Clock } from 'lucide-react';

interface WeatherChartsProps {
  data: WeatherData;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ data }) => {
  const { units, themeStyles } = useWeatherTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  // Hydration safety workaround for SVG charts in SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full h-80 flex items-center justify-center rounded-2xl border animate-pulse ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <p className="text-slate-400 text-sm font-medium">Hydrating forecast visualizations...</p>
      </div>
    );
  }

  // Helper: Temperature converter
  const toUnit = (c: number) => {
    if (units === 'F') {
      return Math.round((c * 9) / 5 + 32);
    }
    return Math.round(c);
  };

  // 1. Process 24-hour data
  const hourlyData = data.hourly.time.map((time, idx) => {
    const d = new Date(time);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Temp: toUnit(data.hourly.temp[idx]),
      'Rain Prob (%)': data.hourly.rainProb[idx],
    };
  });

  // 2. Process 7-day data
  const dailyData = data.daily.date.map((date, idx) => {
    const d = new Date(date);
    return {
      day: d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
      'Max Temp': toUnit(data.daily.tempMax[idx]),
      'Min Temp': toUnit(data.daily.tempMin[idx]),
      'Rain Prob (%)': data.daily.rainProbMax[idx],
    };
  });

  const tabActiveStyle = "bg-white/10 text-white border-white/20 shadow-inner";
  const tabInactiveStyle = "text-slate-400 hover:text-white border-transparent";

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.borderColor} transition-all duration-300`}>
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span>Interactive Trend Forecasts</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Visualize temperature shifts and rainfall probability cycles</p>
        </div>

        <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              activeTab === 'hourly' ? tabActiveStyle : tabInactiveStyle
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            24h Hourly
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              activeTab === 'daily' ? tabActiveStyle : tabInactiveStyle
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            7-Day Weekly
          </button>
        </div>
      </div>

      {activeTab === 'hourly' ? (
        <div className="space-y-8 animate-fade-in">
          {/* Temperature hourly chart */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>Hourly Temperature Trend (°{units})</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall probability hourly chart */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>Hourly Rainfall Probability (%)</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="Rain Prob (%)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#rainGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Daily Max/Min Temperature Range */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>7-Day Temperature Envelopes (°{units})</span>
            </h4>
            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Max Temp" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Min Temp" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily max rainfall probability */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>7-Day Rainfall Probability (%)</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradientDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="Rain Prob (%)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#rainGradientDaily)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
