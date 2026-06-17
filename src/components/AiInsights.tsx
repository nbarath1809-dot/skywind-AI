'use client';

import React, { useState, useEffect } from 'react';
import { WeatherData } from '@/lib/weather';
import { getAiWeatherInsights, WeatherInsights } from '@/app/actions';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { 
  Sparkles, 
  CloudRain, 
  AlertTriangle, 
  Car, 
  Heart, 
  Sprout, 
  Zap, 
  Loader2 
} from 'lucide-react';

interface AiInsightsProps {
  data: WeatherData;
}

export const AiInsights: React.FC<AiInsightsProps> = ({ data }) => {
  const { themeStyles } = useWeatherTheme();
  const [insights, setInsights] = useState<WeatherInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'advisory' | 'lifestyle'>('all');

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const result = await getAiWeatherInsights(data);
        setInsights(result);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [data.city, data.current.temp, data.current.weatherCode]); // Reload when critical weather values change

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center min-h-[300px] ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-slate-300 font-semibold mt-4">Consulting Gemini AI Meteorologist...</p>
        <p className="text-xs text-slate-400 mt-1">Generating agricultural, energy, and travel advisories</p>
      </div>
    );
  }

  if (!insights) return null;

  const cards = [
    {
      title: 'Rain Prediction',
      content: insights.rainPrediction,
      icon: CloudRain,
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
      category: 'advisory'
    },
    {
      title: 'Storm Alert',
      content: insights.stormAlert,
      icon: AlertTriangle,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      category: 'advisory'
    },
    {
      title: 'Travel Advisory',
      content: insights.travelRecommendation,
      icon: Car,
      color: 'text-amber-300 border-amber-500/20 bg-amber-500/5',
      category: 'advisory'
    },
    {
      title: 'Health Advisory',
      content: insights.healthAdvisory,
      icon: Heart,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      category: 'lifestyle'
    },
    {
      title: 'Agriculture & Gardening',
      content: insights.agricultureSuggestion,
      icon: Sprout,
      color: 'text-green-400 border-green-500/20 bg-green-500/5',
      category: 'lifestyle'
    },
    {
      title: 'Energy Advisory',
      content: insights.energyConsumption,
      icon: Zap,
      color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
      category: 'lifestyle'
    }
  ];

  const filteredCards = activeTab === 'all' 
    ? cards 
    : cards.filter(c => c.category === activeTab);

  return (
    <div className="space-y-6">
      {/* AI Header Card */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        {/* Sparkle background glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-300 shrink-0 border border-sky-500/20 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Gemini AI Weather Summary</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Custom daily meteorological brief for {data.city}</p>
          </div>
        </div>
        
        <p className="text-slate-200 text-sm leading-relaxed mt-4 p-4 rounded-xl bg-white/5 border border-white/5 shadow-inner">
          {insights.summary}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'all' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Insights
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-400 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('advisory')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'advisory' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Travel & Storm
          {activeTab === 'advisory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-400 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('lifestyle')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'lifestyle' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Health & Home
          {activeTab === 'lifestyle' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-400 rounded-full" />}
        </button>
      </div>

      {/* Grid of advisory/lifestyle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${card.color}`}
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <card.icon className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-100">{card.title}</h4>
              </div>
              <div className="text-xs leading-relaxed text-slate-200 opacity-90 prose prose-invert font-medium">
                {card.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
