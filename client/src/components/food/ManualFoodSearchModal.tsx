import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Sparkles } from 'lucide-react';
import { HawkerDish } from '../../types';
import { api } from '../../services/api';

interface ManualFoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDish: (dish: HawkerDish) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🍽️',
  Chinese: '🥢',
  Malay: '🍛',
  Indian: '🫓',
  Western: '🍔',
  Drinks: '🧃',
  'Dim Sum': '🥟',
  Snacks: '🍡',
};

export const ManualFoodSearchModal: React.FC<ManualFoodSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDish
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [dishes, setDishes] = useState<HawkerDish[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadDishes();
  }, [searchQuery, selectedCategory, selectedDiet]);

  // Auto-focus search on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const loadDishes = async () => {
    setLoading(true);
    try {
      const data = await api.getDishes({
        query: searchQuery,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        diet: selectedDiet !== 'all' ? selectedDiet : undefined
      });
      setDishes(data);
    } catch (err) {
      console.error('Failed to load dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Chinese', 'Malay', 'Indian', 'Western', 'Drinks', 'Dim Sum', 'Snacks'];

  const getDietaryBadge = (dish: HawkerDish) => {
    if (dish.dietary_flags.includes('healthier_choice')) return { label: 'HC', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (dish.dietary_flags.includes('halal')) return { label: 'Halal', color: 'bg-green-100 text-green-700 border-green-200' };
    if (dish.dietary_flags.includes('vegetarian')) return { label: 'Veg', color: 'bg-lime-100 text-lime-700 border-lime-200' };
    if (dish.dietary_flags.includes('high_protein')) return { label: 'Hi-P', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    return null;
  };

  const calorieColor = (cal: number) =>
    cal < 350 ? 'text-emerald-700' : cal < 600 ? 'text-amber-700' : 'text-red-600';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#FFF8FA] w-full max-w-md rounded-3xl shadow-float overflow-hidden flex flex-col max-h-[90vh] border border-pink-100 animate-scale-in">

        {/* ── Header ── */}
        <div className="bg-white/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-pink-100/80">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Hawker Food Catalog</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">80+ authentic Singapore hawker dishes & drinks</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-pink-100 hover:rotate-90 transition-all duration-200 shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Chicken rice, laksa, BCM, teh tarik..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-pink-50/50 border border-pink-100/80 text-xs font-semibold text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-rose-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-2.5 px-3 bg-white/90 border-b border-pink-100/60">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-pink-200'
                  : 'bg-stone-100/80 text-stone-600 hover:bg-pink-50 hover:text-rose-600'
              }`}
            >
              <span>{CATEGORY_EMOJIS[cat]}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* ── Dietary Filters ── */}
        <div className="flex items-center space-x-1.5 text-[11px] overflow-x-auto no-scrollbar px-3 py-2 bg-white/60 border-b border-pink-100/60">
          {[
            { id: 'all',               label: '🍽️ All Diets' },
            { id: 'healthier_choice',  label: '💚 Healthier Choice' },
            { id: 'halal',             label: '🕌 Halal' },
            { id: 'high_protein',      label: '🍗 High Protein' },
            { id: 'vegetarian',        label: '🥬 Vegetarian' },
            { id: 'low_carb',          label: '🥑 Low Carb' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDiet(d.id)}
              className={`px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap transition-all ${
                selectedDiet === d.id
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-pink-200'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-pink-200 hover:text-rose-600'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* ── Results ── */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2 no-scrollbar">
          {loading ? (
            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="shimmer rounded-2xl h-20" />
              ))}
            </div>
          ) : dishes.length === 0 ? (
            <div className="py-14 text-center space-y-2 animate-fade-slide-up">
              <div className="text-4xl">🍜</div>
              <p className="text-sm font-extrabold text-slate-700">No matching dishes found</p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Try a different local name or category.<br />
                <span className="text-rose-600 font-semibold">Tip:</span> Try "BCM", "carrot cake", or "chicken"
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {dishes.length} dishes found
                </span>
                {searchQuery && (
                  <span className="text-[10px] text-stone-400">Results for "{searchQuery}"</span>
                )}
              </div>

              {dishes.map((dish, idx) => {
                const badge = getDietaryBadge(dish);
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => onSelectDish(dish)}
                    className="w-full bg-white p-3.5 rounded-2xl border border-pink-100/80 hover:border-rose-400 text-left flex items-center justify-between transition-all duration-200 hover:shadow-glow-pink group card-hover animate-fade-slide-up press-anim"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex-1 pr-3 min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                          {dish.name_en}
                        </span>
                        {badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border ${badge.color} shrink-0`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center space-x-1.5">
                        <span>{dish.name_local}</span>
                        {dish.stall_type && (
                          <>
                            <span>·</span>
                            <span className="text-stone-400">{dish.stall_type}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] mt-1.5">
                        <span className={`font-extrabold tabular-nums ${calorieColor(dish.calories)}`}>
                          {dish.calories} kcal
                        </span>
                        <span className="text-blue-600 font-bold">P: {dish.protein_g}g</span>
                        <span className="text-amber-600">C: {dish.carbs_g}g</span>
                        <span className="text-rose-600">F: {dish.fat_g}g</span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-pink-50/50 group-hover:bg-pink-100 flex items-center justify-center text-stone-300 group-hover:text-rose-600 transition-all duration-200 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
