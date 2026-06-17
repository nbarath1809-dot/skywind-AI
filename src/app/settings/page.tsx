'use client';

import React, { useState, useEffect } from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { useToast } from '@/context/ToastContext';
import { 
  Settings, 
  Thermometer, 
  MapPin, 
  Save, 
  Volume2, 
  HelpCircle 
} from 'lucide-react';

export default function SettingsPage() {
  const { units, setUnits, themeStyles } = useWeatherTheme();
  const { showToast } = useToast();

  const [defaultCity, setDefaultCity] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    const savedCity = localStorage.getItem('last_searched_city');
    if (savedCity) setDefaultCity(savedCity);
    
    const savedVoice = localStorage.getItem('voice_assistant_enabled');
    if (savedVoice !== null) {
      setVoiceEnabled(savedVoice === 'true');
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (defaultCity.trim()) {
      localStorage.setItem('last_searched_city', defaultCity.trim());
    }
    
    localStorage.setItem('voice_assistant_enabled', String(voiceEnabled));
    showToast('Preferences updated successfully!', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-sky-400" />
          <span>Application Settings</span>
        </h2>
        <p className="text-slate-400 text-sm">Configure your localized meteorological dashboard preferences</p>
      </div>

      {/* Main card */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Temperature Units */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <span>Temperature Metric Unit</span>
            </label>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUnits('C')}
                className={`flex-1 py-3 rounded-xl border text-center font-bold text-sm transition-all ${
                  units === 'C'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/40 border-white/10 text-slate-300 hover:bg-slate-950/70 hover:text-white'
                }`}
              >
                Celsius (°C)
              </button>
              
              <button
                type="button"
                onClick={() => setUnits('F')}
                className={`flex-1 py-3 rounded-xl border text-center font-bold text-sm transition-all ${
                  units === 'F'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/40 border-white/10 text-slate-300 hover:bg-slate-950/70 hover:text-white'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
              Determines Celsius/Fahrenheit presentation across forecasts, cards, history logs, and AI summaries.
            </p>
          </div>

          {/* Default City */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Default Start City</span>
            </label>
            <input
              type="text"
              placeholder="e.g. New York, London, Tokyo"
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950/50 text-white text-sm focus:outline-none focus:border-sky-500 transition-all placeholder-slate-600"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
              The city that loads weather data immediately when opening the application dashboard.
            </p>
          </div>

          {/* AI Voice Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>AI Conversational Voice Assist</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer mt-1 select-none">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-white/10 bg-slate-950 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sm font-semibold text-slate-200">Enable audio reading of Gemini chat responses</span>
            </label>
          </div>

          {/* Save Button */}
          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/10 group"
            >
              <Save className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Help Card */}
      <div className={`p-6 rounded-2xl border flex items-start gap-4 bg-slate-900/10 ${themeStyles.borderColor}`}>
        <HelpCircle className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white">System Diagnostics</h4>
          <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
            SkyMind AI integrates geolocational geocoding APIs with the Open-Meteo forecast grids and Google Gemini 1.5. 
            All client state is synchronized inside Supabase schemas. 
            For service overrides or key updates, consult the application administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
