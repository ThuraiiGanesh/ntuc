import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Scale, Plus, Check, Award, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const WeeklyProgressView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState<string>('');
  const [addingWeight, setAddingWeight] = useState(false);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    setLoading(true);
    try {
      const data = await api.getWeeklyStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load weekly stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) return;
    try {
      await api.logWeight(Number(newWeight));
      setNewWeight('');
      setAddingWeight(false);
      loadWeeklyData();
    } catch (err) {
      console.error('Failed to log weight:', err);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-xs text-stone-400">
        Loading weekly insights...
      </div>
    );
  }

  const { dailyHistory, target_calories, averages, weight_logs, adherence_streak_days } = stats;

  const maxCal = Math.max(target_calories * 1.2, ...dailyHistory.map((d: any) => d.calories));

  return (
    <div className="p-4 space-y-4 pb-24">
      
      {/* Adherence Streak Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 rounded-3xl p-5 text-white shadow-float flex items-center justify-between animate-fade-slide-up">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Singapore Hawker Streak
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <Flame className="w-6 h-6 text-pink-200 fill-pink-100 animate-pulse" />
            <h2 className="text-2xl font-black">{adherence_streak_days} Days Consistent!</h2>
          </div>
          <p className="text-xs text-rose-100 mt-0.5">
            You've logged and balanced your hawker meals 4 days in a row.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-sm">
          🏆
        </div>
      </div>

      {/* 7-DAY CALORIE BAR CHART */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-soft space-y-3 animate-fade-slide-up delay-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">7-Day Calorie Adherence</h3>
            <p className="text-[11px] text-stone-500">Target: {target_calories} kcal/day</p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
            Avg: {averages.calories} kcal
          </span>
        </div>

        {/* Bar Chart Container */}
        <div className="h-44 pt-6 flex items-end justify-between gap-2 border-b border-pink-50 pb-2 relative">
          {/* Target Reference Line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-rose-300 z-10 pointer-events-none"
            style={{ bottom: `${(target_calories / maxCal) * 100}%` }}
          >
            <span className="absolute right-0 -top-3 text-[9px] font-bold text-rose-400">
              Target
            </span>
          </div>

          {dailyHistory.map((day: any, idx: number) => {
            const heightPercent = maxCal > 0 ? (day.calories / maxCal) * 100 : 0;
            const isOver = day.calories > target_calories;
            const isToday = idx === dailyHistory.length - 1;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded-lg font-bold transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-sm">
                  {day.calories} kcal
                </div>

                <div className="w-full max-w-[28px] h-full flex items-end">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      day.calories === 0
                        ? 'bg-stone-100 h-1'
                        : isToday
                        ? 'bg-rose-500 shadow-sm shadow-pink-500/30'
                        : isOver
                        ? 'bg-pink-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                  />
                </div>
                <span className={`text-[10px] mt-1.5 font-bold ${isToday ? 'text-rose-500' : 'text-stone-400'}`}>
                  {day.day_name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-[10px] text-stone-500 pt-1">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>On Target</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Over Target</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* 7-DAY AVERAGE MACROS */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-soft space-y-3 animate-fade-slide-up delay-150">
        <h3 className="text-sm font-extrabold text-slate-900">Weekly Macro Average</h3>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-rose-800">Protein</span>
            <div className="text-xl font-extrabold text-rose-600 mt-0.5">{averages.protein_g}g</div>
            <span className="text-[10px] text-stone-400 font-medium">Daily Avg</span>
          </div>

          <div className="p-3 bg-pink-50/60 border border-pink-100 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-pink-800">Carbs</span>
            <div className="text-xl font-extrabold text-pink-600 mt-0.5">{averages.carbs_g}g</div>
            <span className="text-[10px] text-stone-400 font-medium">Daily Avg</span>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-rose-800">Fat</span>
            <div className="text-xl font-extrabold text-rose-600 mt-0.5">{averages.fat_g}g</div>
            <span className="text-[10px] text-stone-400 font-medium">Daily Avg</span>
          </div>
        </div>
      </div>

      {/* WEIGHT TRACKER & TREND */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-soft space-y-3 animate-fade-slide-up delay-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-extrabold text-slate-900">Weight Tracking</h3>
          </div>
          <button
            onClick={() => setAddingWeight(!addingWeight)}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Weight</span>
          </button>
        </div>

        {addingWeight && (
          <form onSubmit={handleLogWeight} className="bg-rose-50/30 p-3 rounded-2xl border border-rose-100 flex items-center space-x-2 animate-scale-in">
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 71.8"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
              autoFocus
            />
            <span className="text-xs font-bold text-stone-500">kg</span>
            <button
              type="submit"
              className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-sm press-anim"
            >
              Save
            </button>
          </form>
        )}

        {/* Weight history list */}
        <div className="divide-y divide-pink-50">
          {weight_logs.map((w: any) => (
            <div key={w.id} className="py-2 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">{w.date}</span>
              <strong className="text-slate-900 font-extrabold text-sm">{w.weight_kg} kg</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
