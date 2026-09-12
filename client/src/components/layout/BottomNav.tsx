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
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D9381E] animate-bounce-in" />
        )}

        {/* Icon */}
        <span
          className={`transition-all duration-200 ${
            isActive
              ? 'text-[#D9381E] scale-110'
              : 'text-stone-400 group-hover:text-stone-600 group-hover:scale-105'
          }`}
        >
          {item.icon}
        </span>

        {/* Label */}
        <span
          className={`text-[10px] mt-0.5 font-bold transition-all duration-200 ${
            isActive ? 'text-[#D9381E]' : 'text-stone-400'
          }`}
        >
          {item.label}
        </span>

        {/* Active pill underline */}
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[#D9381E] transition-all duration-300 ease-spring ${
            isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[440px] mx-auto bg-white/95 backdrop-blur-xl border-t border-stone-200/60 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around">

        {/* Left tabs */}
        {navItems.map(renderTab)}

        {/* Centre Camera FAB */}
        <div className="-mt-7 relative flex flex-col items-center">
          <button
            onClick={onOpenScanner}
            className="relative w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#FAF7F2] shadow-glow-red press-anim animate-glow-pulse"
            style={{
              background: 'linear-gradient(135deg, #D9381E 0%, #EA580C 50%, #F59E0B 100%)',
            }}
            title="Scan Hawker Meal"
            aria-label="Scan Hawker Meal"
          >
            {/* Outer shimmer ring */}
            <span className="absolute inset-0 rounded-full ring-4 ring-[#D9381E]/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <Camera className="w-6 h-6 text-white stroke-[2.3] relative z-10" />
          </button>
          <span className="text-[10px] font-bold text-[#D9381E] mt-1 leading-none">Scan</span>
        </div>

        {/* Right tabs */}
        {navItemsRight.map(renderTab)}
      </div>
    </nav>
  );
};
