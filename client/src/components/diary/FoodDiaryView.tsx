import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Camera, Utensils, Check, ChevronDown } from 'lucide-react';
import { DailySummary, FoodLogEntry } from '../../types';

interface FoodDiaryViewProps {
  summary: DailySummary | null;
  onOpenScanner: () => void;
  onOpenManualSearch: () => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (id: string, updates: Partial<FoodLogEntry>) => void;
}

const SLOT_META = {
  breakfast: { emoji: '☕', label: 'Breakfast', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
  lunch:     { emoji: '🍲', label: 'Lunch',     gradient: 'from-red-50 to-rose-50',    border: 'border-red-100'   },
  dinner:    { emoji: '🥢', label: 'Dinner',    gradient: 'from-indigo-50 to-blue-50', border: 'border-blue-100'  },
  snack:     { emoji: '🥤', label: 'Snacks',    gradient: 'from-lime-50 to-green-50',  border: 'border-lime-100'  },
};

export const FoodDiaryView: React.FC<FoodDiaryViewProps> = ({
  summary,
  onOpenScanner,
  onOpenManualSearch,
  onDeleteLog,
  onUpdateLog
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = useState<number>(1.0);

  if (!summary) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[80, 160, 160].map((h, i) => (
          <div key={i} className="shimmer rounded-3xl" style={{ height: h }} />
        ))}
      </div>
    );
  }

  const { entries, totals, targets } = summary;
  const mealSlots: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleStartEdit = (entry: FoodLogEntry) => {
    setEditingId(entry.id);
    setEditMultiplier(entry.portion_multiplier);
  };

  const handleSaveEdit = (entry: FoodLogEntry) => {
    const ratio = editMultiplier / entry.portion_multiplier;
    onUpdateLog(entry.id, {
      portion_multiplier: editMultiplier,
      calories: Math.round(entry.calories * ratio),
      protein_g: Math.round(entry.protein_g * ratio),
      carbs_g: Math.round(entry.carbs_g * ratio),
      fat_g: Math.round(entry.fat_g * ratio),
      sodium_mg: Math.round(entry.sodium_mg * ratio),
      sugar_g: Math.round(entry.sugar_g * ratio)
    });
    setEditingId(null);
  };

  // Global calorie pct for header
  const pct = Math.min(100, Math.round((totals.calories / targets.target_calories) * 100)) || 0;

  return (
    <div className="p-4 space-y-4 pb-28">

      {/* ── Daily Summary Header ── */}
      <div className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-soft animate-fade-slide-up">
        {/* Top gradient strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#D9381E] via-[#EA580C] to-amber-400" style={{ width: `${pct}%` }} />

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Today's Hawker Diary</h2>
              <p className="text-[11px] text-stone-500 mt-0.5">Breakdown by meal time & portions</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#D9381E] tabular-nums leading-none">{totals.calories}</div>
              <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mt-0.5">
                / {targets.target_calories} kcal
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-stone-100">
            {[
              { label: 'Protein', value: `${totals.protein_g}g`, color: 'text-blue-700', bg: 'bg-blue-50/80' },
              { label: 'Carbs',   value: `${totals.carbs_g}g`,   color: 'text-amber-700', bg: 'bg-amber-50/80' },
              { label: 'Fat',     value: `${totals.fat_g}g`,     color: 'text-rose-700', bg: 'bg-rose-50/80'  },
              { label: 'Sodium',  value: `${totals.sodium_mg}`, sublabel: 'mg', color: 'text-slate-700', bg: 'bg-stone-50' },
            ].map(({ label, value, sublabel, color, bg }) => (
              <div key={label} className={`${bg} p-2 rounded-xl text-center border border-stone-100 animate-fade-slide-up`}>
                <div className="text-[10px] text-stone-400 font-bold">{label}</div>
                <div className={`text-xs font-extrabold tabular-nums ${color}`}>{value}{sublabel && <span className="text-[9px]">{sublabel}</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Meal Slot Groups ── */}
      <div className="space-y-3">
        {mealSlots.map((slot, slotIdx) => {
          const meta = SLOT_META[slot];
          const slotEntries = entries.filter(e => e.meal_type === slot);
          const slotCalories = slotEntries.reduce((sum, e) => sum + e.calories, 0);

          return (
            <div
              key={slot}
              className={`bg-white rounded-3xl border ${meta.border} shadow-soft overflow-hidden animate-fade-slide-up`}
              style={{ animationDelay: `${slotIdx * 80}ms` }}
            >
              {/* Slot Header */}
              <div className={`px-4 py-3 bg-gradient-to-r ${meta.gradient} flex items-center justify-between border-b ${meta.border}`}>
                <div className="flex items-center space-x-2">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{meta.label}</span>
                  {slotEntries.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-stone-800/10 text-stone-700 text-[10px] font-black flex items-center justify-center">
                      {slotEntries.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {slotCalories > 0 && (
                    <span className="text-xs font-extrabold text-[#D9381E] tabular-nums">{slotCalories} kcal</span>
                  )}
                  <button
                    onClick={onOpenManualSearch}
                    className="w-6 h-6 rounded-full bg-white/80 border border-stone-200/80 flex items-center justify-center text-stone-500 hover:text-[#D9381E] hover:border-[#D9381E] transition-all shadow-sm"
                    title={`Add to ${slot}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Entries or Empty */}
              <div className="p-3 space-y-2">
                {slotEntries.length === 0 ? (
                  <div className="py-5 text-center">
                    <div className="text-2xl mb-1 opacity-40">{meta.emoji}</div>
                    <p className="text-[11px] text-stone-400 font-medium">Nothing logged for {slot} yet</p>
                    <button
                      onClick={onOpenManualSearch}
                      className="mt-2 text-[11px] font-bold text-[#D9381E] hover:underline underline-offset-2 transition-all"
                    >
                      + Add {meta.label}
                    </button>
                  </div>
                ) : (
                  slotEntries.map((entry, entryIdx) => (
                    <div
                      key={entry.id}
                      className="bg-[#FAF7F2] rounded-2xl border border-stone-200/70 overflow-hidden group animate-fade-slide-up card-hover"
                      style={{ animationDelay: `${slotIdx * 80 + entryIdx * 60}ms` }}
                    >
                      <div className="p-3 flex items-start space-x-2.5">
                        {/* Thumbnail */}
                        <div className="relative shrink-0">
                          <img
                            src={entry.photo_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&q=80'}
                            alt={entry.dish_name}
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/15 to-transparent" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="text-xs font-extrabold text-slate-900 leading-tight truncate">
                                {entry.dish_name}
                              </div>
                              {entry.name_local && (
                                <div className="text-[10px] text-stone-400 truncate">{entry.name_local}</div>
                              )}
                              <div className="text-[11px] text-[#D9381E] font-extrabold mt-0.5 tabular-nums">
                                {entry.calories} kcal
                                <span className="text-stone-400 font-semibold ml-1.5 text-[10px]">
                                  · {Math.round(entry.portion_multiplier * 100)}% portion
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-1.5 rounded-lg text-stone-300 group-hover:text-stone-500 hover:!text-[#D9381E] hover:bg-white transition-all"
                                title="Edit Portion"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteLog(entry.id)}
                                className="p-1.5 rounded-lg text-stone-300 group-hover:text-stone-400 hover:!text-red-500 hover:bg-red-50 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Macro pills */}
                          <div className="flex items-center space-x-2 mt-2 text-[10px]">
                            <span className="text-blue-600 font-bold">P: {entry.protein_g}g</span>
                            <span className="text-stone-300">·</span>
                            <span className="text-amber-600 font-bold">C: {entry.carbs_g}g</span>
                            <span className="text-stone-300">·</span>
                            <span className="text-rose-600 font-bold">F: {entry.fat_g}g</span>
                            <span className="text-stone-300">·</span>
                            <span className="text-stone-500">Na: {entry.sodium_mg}mg</span>
                          </div>
                        </div>
                      </div>

                      {/* Inline Portion Edit */}
                      {editingId === entry.id && (
                        <div className="px-3 pb-3 pt-0 border-t border-stone-200/50">
                          <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2 mt-2 animate-scale-in">
                            <div className="flex justify-between text-xs font-semibold text-slate-800">
                              <span>Adjust Portion:</span>
                              <span className="font-extrabold text-[#D9381E]">
                                {Math.round(editMultiplier * 100)}% ≈ {Math.round(entry.calories * (editMultiplier / entry.portion_multiplier))} kcal
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.05"
                              value={editMultiplier}
                              onChange={e => setEditMultiplier(parseFloat(e.target.value))}
                              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#D9381E]"
                            />
                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 border border-stone-200 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(entry)}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D9381E] to-[#EA580C] text-white text-xs font-extrabold shadow-sm flex items-center space-x-1 press-anim"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Health tip strip */}
                      {entry.healthier_alternative && (
                        <div className="px-3 pb-2.5">
                          <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg font-medium flex items-start space-x-1">
                            <span className="shrink-0">💡</span>
                            <span className="line-clamp-2">{entry.healthier_alternative}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Add Buttons ── */}
      <div className="flex space-x-2 animate-fade-slide-up delay-300">
        <button
          onClick={onOpenScanner}
          className="flex-1 py-3.5 bg-gradient-to-r from-[#D9381E] to-[#EA580C] hover:from-[#c0321a] hover:to-[#d9500a] text-white rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-float press-anim"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Food Photo</span>
        </button>
        <button
          onClick={onOpenManualSearch}
          className="px-5 py-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-2xl font-bold text-xs transition-all press-anim"
        >
          Browse Catalog
        </button>
      </div>
    </div>
  );
};
