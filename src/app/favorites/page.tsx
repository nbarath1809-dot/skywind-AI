'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { createClientBrowser } from '@/lib/supabase';
import { getWeatherData, WeatherData } from '@/lib/weather';
import { WeatherIcon } from '@/components/WeatherCard';
import { Bookmark, Star, MapPin, Loader2, Trash2, Wind, Droplets, ArrowUpRight } from 'lucide-react';

interface FavoriteRecord {
  id: string;
  city_name: string;
}

interface LiveFavorite extends FavoriteRecord {
  weather: WeatherData | null;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { fetchWeather, themeStyles, units } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [favorites, setFavorites] = useState<LiveFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLiveFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = data as FavoriteRecord[];
      
      // Fetch weather details for all cities in parallel
      const liveData: LiveFavorite[] = await Promise.all(
        records.map(async (rec) => {
          try {
            const weather = await getWeatherData(rec.city_name);
            return { ...rec, weather };
          } catch {
            return { ...rec, weather: null };
          }
        })
      );

      setFavorites(liveData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        showToast('Please sign in to view your favorite locations', 'info');
        return;
      }
      fetchLiveFavorites();
    }
  }, [user, authLoading]);

  const handleRemoveFavorite = async (e: React.MouseEvent, rec: LiveFavorite) => {
    e.stopPropagation(); // Avoid triggering card redirection click
    if (!user) return;

    setActionLoading(rec.id);
    try {
      const { error } = await supabase
        .from('favorite_locations')
        .delete()
        .eq('id', rec.id);

      if (error) throw error;
      setFavorites((prev) => prev.filter((f) => f.id !== rec.id));
      showToast(`Removed ${rec.city_name} from starred list`, 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      showToast('Failed to remove favorite location', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectCity = async (city: string) => {
    setLoading(true);
    const success = await fetchWeather(city);
    if (success) {
      showToast(`Switched active city to ${city}`, 'success');
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
        <p className="text-slate-400 text-sm font-semibold mt-4">Retrieving favorite dashboards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bookmark className="w-8 h-8 text-sky-400" />
          <span>Favorite Locations</span>
        </h2>
        <p className="text-slate-400 text-sm">Real-time weather summaries for your bookmarked locations</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const w = fav.weather;
            return (
              <div
                key={fav.id}
                onClick={() => handleSelectCity(fav.city_name)}
                className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:scale-[1.01] hover:bg-slate-900/60 ${themeStyles.cardBg} ${themeStyles.borderColor}`}
              >
                {/* Top header containing city name, country and unfavorite button */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                      <span>{fav.city_name}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    {w ? (
                      <p className="text-xs text-slate-300 capitalize mt-0.5">{w.current.conditionText}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Live data offline</p>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleRemoveFavorite(e, fav)}
                    disabled={actionLoading === fav.id}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-all shrink-0"
                    title="Remove from favorites"
                  >
                    {actionLoading === fav.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {w ? (
                  <>
                    {/* Middle: temperature and big icon */}
                    <div className="flex items-center justify-between my-5">
                      <span className="text-4xl font-bold tracking-tight text-white">{formatTemp(w.current.temp)}</span>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                        <WeatherIcon code={w.current.weatherCode} isDay={w.current.isDay} className="w-10 h-10" />
                      </div>
                    </div>

                    {/* Bottom: quick stats */}
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-sky-400" />
                        <span>{w.current.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{w.current.humidity}% hum</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="my-8 flex items-center justify-center text-xs text-slate-500 italic">
                    Failed to fetch live updates.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
          <Star className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300">No Starred Cities</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Bookmarked locations will display here. Search a city on the dashboard and click "Star Location" to sync!
          </p>
        </div>
      )}
    </div>
  );
}
