'use client';

import React, { useState, useEffect } from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createClientBrowser } from '@/lib/supabase';
import { WeatherCard } from '@/components/WeatherCard';
import { AiInsights } from '@/components/AiInsights';
import { 
  Search, 
  Star, 
  History, 
  MapPin, 
  Loader2, 
  LogIn, 
  BookmarkCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { weatherData, loading, fetchWeather, themeStyles } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [popularCities] = useState(['Tokyo', 'London', 'Paris', 'New York', 'Sydney']);

  // Check if current city is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !weatherData) {
        setIsFavorite(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('favorite_locations')
          .select('*')
          .eq('user_id', user.id)
          .eq('city_name', weatherData.city);
        
        if (error) throw error;
        setIsFavorite(data && data.length > 0);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [weatherData, user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const success = await fetchWeather(searchQuery);
    if (success) {
      setSearchQuery('');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      showToast('Please sign in to save favorite locations!', 'info');
      return;
    }
    if (!weatherData) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_locations')
          .delete()
          .eq('user_id', user.id)
          .eq('city_name', weatherData.city);
        
        if (error) throw error;
        setIsFavorite(false);
        showToast(`Removed ${weatherData.city} from favorites`, 'success');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_locations')
          .insert({
            user_id: user.id,
            city_name: weatherData.city
          });
        
        if (error) throw error;
        setIsFavorite(true);
        showToast(`Added ${weatherData.city} to favorites`, 'success');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      showToast('Error syncing favorites', 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner for Guest Users */}
      {!user && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-sky-500/10 bg-sky-500/5 text-sky-200 text-sm gap-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 shrink-0 text-sky-400" />
            <span>Sign in to bookmark favorite cities, save searches, and save your AI chat logs.</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 self-start sm:self-auto transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In Now
          </Link>
        </div>
      )}

      {/* Search Header Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search city (e.g. London, Paris, Tokyo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3 rounded-2xl border border-white/10 bg-slate-900/30 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600/50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
            </button>
          </div>
        </form>

        {/* Popular Cities Quick Search */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Trending:</span>
          {popularCities.map((city) => (
            <button
              key={city}
              onClick={() => fetchWeather(city)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 font-medium hover:text-white transition-all disabled:opacity-50"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {weatherData ? (
        <div className="grid grid-cols-1 gap-8">
          {/* Dashboard Main Stats & Favorite Sync Toggle */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Forecasting Panel</span>
              </div>
              
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isFavorite 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {favoriteLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-300' : ''}`} />
                )}
                <span>{isFavorite ? 'Starred Location' : 'Star Location'}</span>
              </button>
            </div>

            <WeatherCard data={weatherData} />
          </div>

          {/* Quick navigation to deeper tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/forecast"
              className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${themeStyles.cardBg} ${themeStyles.borderColor} hover:bg-slate-900/60`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Interactive Charts</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Explore 24-hour trends and weekly envelopes</p>
                </div>
              </div>
              <span className="text-sky-400 text-xs font-semibold">View →</span>
            </Link>
            <Link
              href="/chat"
              className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${themeStyles.cardBg} ${themeStyles.borderColor} hover:bg-slate-900/60`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gemini AI Assistant</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Ask questions about clothing or activities</p>
                </div>
              </div>
              <span className="text-sky-400 text-xs font-semibold">Chat →</span>
            </Link>
          </div>

          {/* Gemini AI Daily brief section */}
          <div className="border-t border-white/10 pt-8">
            <AiInsights data={weatherData} />
          </div>
        </div>
      ) : (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <MapPin className="w-12 h-12 text-slate-600 mb-4 animate-bounce-slow" />
          <h3 className="text-xl font-bold text-slate-300">No Location Selected</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Enter a city name above to compile meteorological updates, AI summaries, and gardening suggestions.
          </p>
        </div>
      )}
    </div>
  );
}
