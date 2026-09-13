import React from 'react';
import { Home, BookOpen, Camera, CalendarDays, TrendingUp } from 'lucide-react';

export type ActiveTab = 'home' | 'diary' | 'plans' | 'progress' | 'recommend';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

interface NavItem {
  id: ActiveTab;
  icon: React.ReactNode;
  label: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner
}) => {
  const navItems: NavItem[] = [
    { id: 'home',     icon: <Home className="w-5 h-5" />,        label: 'Today' },
    { id: 'diary',    icon: <BookOpen className="w-5 h-5" />,    label: 'Diary' },
  ];
  const navItemsRight: NavItem[] = [
    { id: 'plans',    icon: <CalendarDays className="w-5 h-5" />, label: 'Meal Plan' },
    { id: 'progress', icon: <TrendingUp className="w-5 h-5" />,   label: 'Insights' },
  ];

  const renderTab = (item: NavItem) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className="relative flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all duration-200 group"
        aria-label={item.label}
      >
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500 animate-bounce-in" />
        )}

        {/* Icon */}
        <span
          className={`transition-all duration-200 ${
            isActive
              ? 'text-rose-500 scale-110'
              : 'text-stone-400 group-hover:text-rose-400 group-hover:scale-105'
          }`}
        >
          {item.icon}
        </span>

        {/* Label */}
        <span
          className={`text-[10px] mt-0.5 transition-all duration-200 ${
            isActive ? 'text-rose-500 font-extrabold' : 'text-stone-400 font-semibold'
          }`}
        >
          {item.label}
        </span>

        {/* Active pill underline */}
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300 ease-spring ${
            isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[440px] mx-auto bg-white/95 backdrop-blur-xl border-t border-pink-100/80 px-2 py-1.5 shadow-[0_-4px_24px_rgba(244,63,94,0.08)]">
      <div className="flex items-center justify-around">

        {/* Left tabs */}
        {navItems.map(renderTab)}

        {/* Centre Camera FAB */}
        <div className="-mt-7 relative flex flex-col items-center">
          <button
            onClick={onOpenScanner}
            className="relative w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/45 press-anim animate-glow-pulse"
            style={{
              background: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 50%, #FB7185 100%)',
            }}
            title="Scan Hawker Meal"
            aria-label="Scan Hawker Meal"
          >
            {/* Outer shimmer ring */}
            <span className="absolute inset-0 rounded-full ring-4 ring-pink-400/25 animate-ping" style={{ animationDuration: '2.5s' }} />
            <Camera className="w-6 h-6 text-white stroke-[2.3] relative z-10" />
          </button>
          <span className="text-[10px] font-bold text-rose-500 mt-1 leading-none">Scan</span>
        </div>

        {/* Right tabs */}
        {navItemsRight.map(renderTab)}
      </div>
    </nav>
  );
};
