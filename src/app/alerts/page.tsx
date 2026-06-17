'use client';

import React, { useEffect, useState } from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createClientBrowser } from '@/lib/supabase';
import { 
  BellRing, 
  MapPin, 
  PlusCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

interface WeatherAlert {
  id: string;
  city: string;
  alert_type: string;
  description: string;
  created_at: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { weatherData, themeStyles } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reporting Form States
  const [formOpen, setFormOpen] = useState(false);
  const [reportCity, setReportCity] = useState('');
  const [reportType, setReportType] = useState('Storm');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handlePostAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to report weather alerts.', 'error');
      return;
    }
    if (!reportCity.trim() || !reportDesc.trim()) {
      showToast('All fields are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .insert({
          city: reportCity.trim(),
          alert_type: reportType,
          description: reportDesc.trim()
        });

      if (error) throw error;

      showToast('Alert reported successfully. Thank you!', 'success');
      setReportCity('');
      setReportDesc('');
      setFormOpen(false);
      fetchAlerts(); // Reload list
    } catch (error: any) {
      console.error('Error reporting alert:', error);
      showToast(error.message || 'Error uploading alert', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine dynamic severe risk parameters
  const analyzeLiveRisks = () => {
    if (!weatherData) return null;
    
    const risks = [];
    const temp = weatherData.current.temp;
    const wind = weatherData.current.windSpeed;
    const uv = weatherData.current.uvIndex;
    const aqi = weatherData.airQuality.aqi;

    if (temp >= 35) {
      risks.push({
        type: 'Extreme Heat Warning',
        desc: `Temperatures have reached ${temp}°C. Stay hydrated and avoid outdoor labor during peak hours.`,
        severity: 'severe'
      });
    } else if (temp <= 0) {
      risks.push({
        type: 'Freezing Warning',
        desc: `Sub-zero weather (${temp}°C) detected. Watch out for black ice on commutes and protect outdoor piping.`,
        severity: 'severe'
      });
    }

    if (wind >= 40) {
      risks.push({
        type: 'High Wind Warning',
        desc: `Sustained winds are currently blowing at ${wind} km/h. Secure loose outdoor objects.`,
        severity: 'warning'
      });
    }

    if (uv >= 8) {
      risks.push({
        type: 'Extreme UV Advisory',
        desc: `UV Index is at a dangerous level of ${uv}. Apply SPF 30+ sunscreen and wear protective eyewear.`,
        severity: 'warning'
      });
    }

    if (aqi >= 151) {
      risks.push({
        type: 'Unhealthy Air Quality Warning',
        desc: `Air Quality Index is at ${aqi} AQI (${weatherData.airQuality.description}). Limit prolonged outdoor activities.`,
        severity: 'severe'
      });
    }

    return risks;
  };

  const liveRisks = analyzeLiveRisks();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-8 h-8 text-sky-400" />
            <span>Weather Warning Center</span>
          </h2>
          <p className="text-slate-400 text-sm">Review safety warnings and report community climate alerts</p>
        </div>

        {user ? (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-all shadow-md shadow-sky-500/10 self-start sm:self-auto"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Report Alert</span>
          </button>
        ) : (
          <span className="text-slate-400 text-xs italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            Log in to file weather reports
          </span>
        )}
      </div>

      {/* Report Alert Panel Modal */}
      {formOpen && (
        <div className={`p-6 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.borderColor} animate-slide-in`}>
          <h3 className="text-lg font-bold text-white mb-4">File Community Weather Warning</h3>
          <form onSubmit={handlePostAlert} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicago"
                  value={reportCity}
                  onChange={(e) => setReportCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-slate-950/50 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Alert Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-slate-950/50 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                >
                  <option value="Storm">Wind Storm / Gale</option>
                  <option value="Flood">Flooding / High Tide</option>
                  <option value="Heatwave">Severe Heatwave</option>
                  <option value="Blizzard">Blizzard / Freezing Cold</option>
                  <option value="Air Quality">Toxic Smog / AQI Risk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Detailed Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe road blocks, precipitation forecasts, or utility shutdowns..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-slate-950/50 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600/50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Submit Report</span>}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Live Risks vs Community Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 1 Column: Live AI Risks */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BellRing className="w-5 h-5 text-sky-400" />
            <span>Live Local Risks</span>
          </h3>

          {weatherData ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Checking thresholds for <span className="font-bold text-white">{weatherData.city}</span></span>
              </div>

              {liveRisks && liveRisks.length > 0 ? (
                liveRisks.map((risk, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border flex gap-3 ${
                      risk.severity === 'severe'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">{risk.type}</h4>
                      <p className="text-xs leading-relaxed mt-1 font-medium">{risk.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-6 rounded-xl border text-center flex flex-col items-center justify-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2" />
                  <h4 className="text-sm font-bold text-slate-200">No Local Risks Detected</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Humidity, wind speed, UV levels and temp are within normal levels.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-xs italic bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              Please search or select a city on the dashboard to evaluate local severe weather risk thresholds.
            </div>
          )}
        </div>

        {/* Right 2 Columns: Community reported warnings */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-sky-400" />
            <span>Community Warning Logs</span>
          </h3>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span className="ml-2 text-sm text-slate-400 font-medium">Loading warnings...</span>
            </div>
          ) : alerts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between ${themeStyles.cardBg} ${themeStyles.borderColor}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {alert.alert_type}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{alert.city}</span>
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed mt-2 p-2.5 rounded bg-white/5 border border-white/5">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-12 rounded-xl border text-center flex flex-col items-center justify-center ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
              <Info className="w-10 h-10 text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-300">No Warning Reports Filed</h4>
              <p className="text-xs text-slate-400 mt-0.5">The community has not reported any severe warnings today.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
