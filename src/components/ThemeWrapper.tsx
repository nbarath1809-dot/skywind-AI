'use client';

import React from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeStyles } = useWeatherTheme();

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${themeStyles.bgGradient} text-white transition-all duration-700 ease-in-out relative`}>
      {/* Dynamic weather ambient overlays */}
      {themeStyles.weatherEffect === 'rain' && (
        <div className="absolute inset-0 pointer-events-none bg-[url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000')] bg-repeat opacity-5 mix-blend-color-dodge animate-pulse" />
      )}
      {themeStyles.weatherEffect === 'storm' && (
        <div className="absolute inset-0 pointer-events-none bg-slate-900/10 mix-blend-overlay animate-pulse" />
      )}
      {themeStyles.weatherEffect === 'snow' && (
        <div className="absolute inset-0 pointer-events-none bg-sky-200/5 mix-blend-overlay" />
      )}
      
      {/* Content wrapper */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
