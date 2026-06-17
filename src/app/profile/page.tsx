'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { createClientBrowser } from '@/lib/supabase';
import { User, Mail, Calendar, Edit2, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { themeStyles } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [nameInput, setNameInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        showToast('Please sign in to view your profile', 'info');
        return;
      }
      setNameInput(profile?.name || '');
    }
  }, [user, profile, authLoading]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!nameInput.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: nameInput.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update auth user metadata too
      await supabase.auth.updateUser({
        data: { name: nameInput.trim() }
      });

      await refreshProfile();
      setEditing(false);
      showToast('Profile name updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast('Failed to update name', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-slate-400 text-sm font-semibold mt-4">Loading user credentials...</p>
      </div>
    );
  }

  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-sky-400" />
          <span>My Profile Dashboard</span>
        </h2>
        <p className="text-slate-400 text-sm">Review your account details and update your display identity</p>
      </div>

      {/* Main card panel */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b border-white/5 pb-8">
          {/* Large initials avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-xl shadow-sky-500/10 shrink-0 border border-white/10 select-none">
            {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <span>{profile?.name || 'Account Owner'}</span>
            </h3>
            <p className="text-sm text-sky-300 font-semibold">{user.email}</p>
          </div>
        </div>

        {/* Details and Edit panel */}
        <form onSubmit={handleSaveName} className="space-y-6">
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Display Name</label>
              {editing ? (
                <div className="relative max-w-md">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-white/10 bg-slate-950/50 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="absolute right-1.5 top-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600/50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 max-w-md px-3.5 py-2.5 rounded-xl border border-white/5 bg-slate-950/30">
                  <User className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <span className="text-slate-200 text-sm font-semibold">{profile?.name || 'Not Configured'}</span>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="ml-auto text-sky-400 hover:text-sky-300 hover:bg-sky-500/5 p-1 rounded-lg transition-all"
                    title="Edit name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Registered Email</label>
              <div className="flex items-center gap-3 max-w-md px-3.5 py-2.5 rounded-xl border border-white/5 bg-slate-950/10 text-slate-400">
                <Mail className="w-4.5 h-4.5 shrink-0" />
                <span className="text-sm">{user.email}</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-white/5 rounded border border-white/5">read-only</span>
              </div>
            </div>

            {/* Registration Age */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Member Since</label>
              <div className="flex items-center gap-3 max-w-md px-3.5 py-2.5 rounded-xl border border-white/5 bg-slate-950/10 text-slate-400">
                <Calendar className="w-4.5 h-4.5 shrink-0" />
                <span className="text-sm">{joinDate}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
