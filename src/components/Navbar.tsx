'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { 
  CloudSun, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  History, 
  Bookmark, 
  Bell, 
  MessageSquareShare, 
  LayoutDashboard, 
  TrendingUp 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { units, setUnits, weatherData } = useWeatherTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'AI Chat', path: '/chat', icon: MessageSquareShare },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'History', path: '/history', icon: History, protected: true },
    { name: 'Favorites', path: '/favorites', icon: Bookmark, protected: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const activeClass = "bg-white/15 text-white shadow-sm border border-white/10";
  const inactiveClass = "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight group">
              <CloudSun className="h-7 w-7 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
              <span>
                SkyMind<span className="text-sky-400">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => {
              if (item.protected && !user) return null;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Options (Units + User Profile) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Unit Selector Toggle */}
            <div className="flex items-center rounded-lg bg-slate-900/60 p-0.5 border border-white/5">
              <button
                onClick={() => setUnits('C')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  units === 'C'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnits('F')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  units === 'F'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>

            {/* User Session Profile Controls */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full bg-slate-900/60 pl-2 pr-3 py-1.5 border border-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs">
                    {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{profile?.name || 'Account'}</span>
                </button>

                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur-md z-40 origin-top-right transition-all animate-fade-in">
                      <div className="px-3 py-2 border-b border-white/5 mb-1 text-xs text-slate-400">
                        Logged in as <span className="font-semibold text-slate-300 block truncate">{user.email}</span>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border-t border-white/5 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-sky-500/15"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Unit Selector Toggle Mobile */}
            <div className="flex items-center rounded-lg bg-slate-900/60 p-0.5 border border-white/5">
              <button
                onClick={() => setUnits('C')}
                className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  units === 'C' ? 'bg-sky-500 text-white' : 'text-slate-400'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnits('F')}
                className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  units === 'F' ? 'bg-sky-500 text-white' : 'text-slate-400'
                }`}
              >
                °F
              </button>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 p-4 flex flex-col gap-2 animate-slide-in">
          {navigationItems.map((item) => {
            if (item.protected && !user) return null;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="border-t border-white/5 my-2 pt-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 text-xs text-slate-400">
                  Profile: <span className="text-slate-300 font-semibold">{user.email}</span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <User className="w-5 h-5" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-base font-semibold transition-all"
              >
                <User className="w-5 h-5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
