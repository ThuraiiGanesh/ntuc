import React, { useState, useEffect } from 'react';
import { RefreshCw, Shuffle, Share2, Check, Sparkles, Plus, Calendar, ArrowRight } from 'lucide-react';
import { HawkerDish } from '../../types';
import { api } from '../../services/api';

interface MealPlanViewProps {
  onSelectDish: (dish: HawkerDish) => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({ onSelectDish }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [viewMode]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      if (viewMode === 'daily') {
        const data = await api.getDailyPlan();
        setDailyPlan(data.plan);
      } else {
        const data = await api.getWeeklyPlan();
        setWeeklyPlan(data.weeklyPlan || []);
      }
    } catch (err) {
      console.error('Failed to load meal plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!dailyPlan) return;
    try {
      const current = dailyPlan[mealType];
      const data = await api.swapPlanMeal(mealType, current?.id);
      if (data.swappedDish) {
        setDailyPlan((prev: any) => ({
          ...prev,
          [mealType]: data.swappedDish
        }));
      }
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  const handleSharePlan = () => {
    let text = '🍛 My Singapore Hawker Meal Plan (via Googoogaga):\n\n';
    if (viewMode === 'daily' && dailyPlan) {
      text += `Breakfast: ${dailyPlan.breakfast.name_en} (${dailyPlan.breakfast.calories} kcal)\n`;
      text += `Lunch: ${dailyPlan.lunch.name_en} (${dailyPlan.lunch.calories} kcal)\n`;
      text += `Dinner: ${dailyPlan.dinner.name_en} (${dailyPlan.dinner.calories} kcal)\n`;
      if (dailyPlan.snack) text += `Snack: ${dailyPlan.snack.name_en} (${dailyPlan.snack.calories} kcal)\n`;
      text += `\nTotal: ~${dailyPlan.total_calories} kcal`;
    } else {
      weeklyPlan.forEach(d => {
        text += `${d.day_name}: L: ${d.lunch.name_en} | D: ${d.dinner.name_en}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top switch bar */}
      <div className="flex bg-pink-100/60 border border-pink-100/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setViewMode('daily')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            viewMode === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-rose-500'
          }`}
        >
          <span>Today's Hawker Plan</span>
        </button>

        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            viewMode === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-rose-500'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>7-Day Rotation Plan</span>
        </button>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">
            {viewMode === 'daily' ? 'Balanced Hawker Menu' : '7-Day Hawker Multi-Cuisine Rotation'}
          </h2>
          <p className="text-[11px] text-stone-500">
            {viewMode === 'daily' ? 'Rotates Chinese, Malay & Indian cuisines' : 'Prevents dish fatigue with varied stalls'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadPlans}
            className="p-2 bg-white border border-rose-100 rounded-xl text-stone-600 hover:bg-rose-50/50 text-xs font-semibold flex items-center space-x-1 transition-all"
            title="Regenerate Plan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          </button>

          <button
            onClick={handleSharePlan}
            className="px-3 py-1.5 bg-white border border-rose-100 text-stone-700 hover:bg-rose-50/50 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-rose-500" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* DAILY VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          {dailyPlan && (
            <>
              {/* Daily Summary Bar */}
              <div className="bg-gradient-to-r from-rose-50/60 via-pink-50/40 to-rose-50/60 p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between text-xs animate-fade-slide-up">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Planned</span>
                  <strong className="text-base text-rose-500 font-extrabold">{dailyPlan.total_calories} kcal</strong>
                </div>
                <div className="flex space-x-3 text-stone-600">
                  <span>P: <strong className="text-rose-600">{dailyPlan.total_protein_g}g</strong></span>
                  <span>C: <strong className="text-pink-600">{dailyPlan.total_carbs_g}g</strong></span>
                  <span>F: <strong className="text-rose-600">{dailyPlan.total_fat_g}g</strong></span>
                </div>
              </div>

              {/* Meal Cards */}
              {[
                { slot: 'breakfast', label: 'Breakfast', dish: dailyPlan.breakfast, emoji: '☕' },
                { slot: 'lunch', label: 'Lunch', dish: dailyPlan.lunch, emoji: '🍲' },
                { slot: 'dinner', label: 'Dinner', dish: dailyPlan.dinner, emoji: '🥢' },
                { slot: 'snack', label: 'Hydration / Snack', dish: dailyPlan.snack, emoji: '🥤' }
              ].map((item, itemIdx) => {
                if (!item.dish) return null;
                return (
                  <div
                    key={item.slot}
                    className="bg-white rounded-3xl p-4 border border-rose-100 shadow-soft space-y-3 card-hover transition-all animate-fade-slide-up"
                    style={{ animationDelay: `${itemIdx * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{item.emoji}</span>
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSwapMeal(item.slot as any)}
                        className="text-xs text-rose-500 font-bold flex items-center space-x-1 hover:underline bg-pink-50 hover:bg-pink-100/70 border border-pink-100 px-2.5 py-1 rounded-xl transition-all"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Swap Dish</span>
                      </button>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-rose-500 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-md">
                          {item.dish.category} Stall
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          {item.dish.name_en}
                        </h4>
                        <div className="text-[11px] text-stone-400">
                          {item.dish.name_local}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-rose-500">
                          {item.dish.calories}
                        </span>
                        <span className="text-[10px] text-rose-400 block -mt-1 font-bold">kcal</span>
                      </div>
                    </div>

                    {/* Ordering tip */}
                    {item.dish.healthier_alternative && (
                      <p className="text-[11px] text-rose-900 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 font-medium">
                        💡 How to order: {item.dish.healthier_alternative}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-pink-50 text-[11px] text-stone-500">
                      <div className="flex space-x-3">
                        <span>P: <strong className="text-rose-600">{item.dish.protein_g}g</strong></span>
                        <span>C: <strong className="text-pink-600">{item.dish.carbs_g}g</strong></span>
                        <span>F: <strong className="text-rose-600">{item.dish.fat_g}g</strong></span>
                      </div>
                      <button
                        onClick={() => onSelectDish(item.dish)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline"
                      >
                        + Log This Meal
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* 7-DAY ROTATION VIEW */}
      {viewMode === 'weekly' && (
        <div className="space-y-3">
          {weeklyPlan.map((day, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-4 border border-rose-100 shadow-soft space-y-2.5 card-hover transition-all animate-fade-slide-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="font-extrabold text-sm text-slate-900">{day.day_name}</h3>
                </div>
                <span className="text-xs font-extrabold text-rose-500">
                  ~{day.total_calories} kcal
                </span>
              </div>

              {/* Meals summary line */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/70">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">Breakfast</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{day.breakfast.name_en}</div>
                  <div className="text-[10px] text-rose-500 font-semibold">{day.breakfast.calories} kcal</div>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/70">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">Lunch</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{day.lunch.name_en}</div>
                  <div className="text-[10px] text-rose-500 font-semibold">{day.lunch.calories} kcal</div>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/70">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">Dinner</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{day.dinner.name_en}</div>
                  <div className="text-[10px] text-rose-500 font-semibold">{day.dinner.calories} kcal</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
