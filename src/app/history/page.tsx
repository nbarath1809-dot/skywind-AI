'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { createClientBrowser } from '@/lib/supabase';
import { History, Calendar, Trash2, MapPin, Loader2, ArrowRight, ArrowUpRight } from 'lucide-react';

interface HistoryRecord {
  id: string;
  city: string;
  temperature: number;
  weather_condition: string;
  searched_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { fetchWeather, themeStyles, units } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weather_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        showToast('Please sign in to view your search history', 'info');
        return;
      }
      fetchHistory();
    }
  }, [user, authLoading]);

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('weather_search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setRecords([]);
      showToast('Search history cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('Failed to clear search history', 'error');
    }
  };

  const handleSelectCity = async (city: string) => {
    setLoading(true);
    const success = await fetchWeather(city);
    if (success) {
      showToast(`Loaded weather for ${city}`, 'success');
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  };

  const formatTemp = (celsius: number) => {
    if (units === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-slate-400 text-sm font-semibold mt-4">Compiling search log records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-sky-400" />
            <span>Search History Log</span>
          </h2>
          <p className="text-slate-400 text-sm">Review your logged city searches and click to reload</p>
        </div>

        {records.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 transition-all text-xs font-semibold self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => (
            <button
              key={rec.id}
              onClick={() => handleSelectCity(rec.city)}
              className={`p-5 rounded-xl border flex items-center justify-between text-left group transition-all hover:scale-[1.01] ${themeStyles.cardBg} ${themeStyles.borderColor} hover:bg-slate-900/60`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="w-5 h-5" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                    <span>{rec.city}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  
                  <p className="text-xs text-slate-300 mt-1 capitalize font-medium">{rec.weather_condition}</p>
                  
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rec.searched_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Temperature Badge */}
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold tracking-tight text-white">{formatTemp(rec.temperature)}</span>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase mt-1">Select →</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <History className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300">No Search History Available</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Your search operations are currently empty. Search for cities on the dashboard to build your log!
          </p>
        </div>
      )}
    </div>
  );
}
