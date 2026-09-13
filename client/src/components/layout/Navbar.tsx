import React, { useState, useEffect } from 'react';
import { Settings, Flame } from 'lucide-react';
import { UserProfile } from '../../types';

interface NavbarProps {
  profile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 14) return 'Lunch time?';
  if (h < 17) return 'Good afternoon';
  if (h < 20) return 'Dinner time?';
  return 'Good evening';
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenSettings,
  onOpenOnboarding
}) => {
  const [scrolled, setScrolled] = useState(false);
  const greeting = getGreeting();

  const today = new Date().toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  useEffect(() => {
    const el = document.querySelector('.mobile-app-shell main');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-3 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-pink-100 shadow-soft'
          : 'bg-white/85 backdrop-blur-md border-b border-pink-50/60'
      }`}
    >
      <div className="flex items-center justify-between">

        {/* Brand */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer group"
          onClick={onOpenOnboarding}
        >
          {/* Logo pill */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25 group-hover:scale-105 transition-transform duration-200 animate-fade-slide-up">
            <span className="text-xl leading-none select-none">🍜</span>
            {/* Subtle glow ring on hover */}
            <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-pink-400/30 transition-all duration-200" />
          </div>

          <div className="animate-fade-slide-up delay-50">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">
                Googoogaga
              </h1>
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                SG AI
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-semibold mt-0.5 leading-none">
              {greeting} · {today}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 animate-fade-slide-up delay-100">

          {/* Streak Badge */}
          <div className="flex items-center space-x-1 bg-rose-50 border border-rose-200/80 text-rose-800 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-sm hover:scale-105 transition-transform duration-150 cursor-default">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-400 animate-ping-slow" />
            <span className="text-rose-950 font-extrabold">4</span>
            <span className="text-rose-700 font-semibold">day streak</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white hover:bg-rose-50 border border-rose-100 hover:border-rose-200 flex items-center justify-center text-stone-500 hover:text-rose-600 transition-all duration-150 shadow-soft hover:shadow-md active:scale-95"
            title="Settings & Profile"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
