import React, { useEffect, useRef, useState } from 'react';
import { Plus, Camera, Sparkles, Droplets, Trash2, ArrowRight, Zap } from 'lucide-react';
import { DailySummary, FoodLogEntry, NextRecommendation } from '../../types';

interface DashboardViewProps {
  summary: DailySummary | null;
  recommendations: NextRecommendation[];
  onOpenScanner: () => void;
  onOpenManualSearch: () => void;
  onAddWater: (amount_ml: number) => void;
  onDeleteLog: (id: string) => void;
  onSelectRecommendedDish: (dish: any) => void;
  onNavigateToTab: (tab: any) => void;
}

/** Animated circular ring using SVG stroke-dashoffset */
function CalorieRing({
  caloriePercent,
  totals,
  targets,
  remaining,
}: {
  caloriePercent: number;
  totals: any;
  targets: any;
  remaining: any;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (caloriePercent / 100) * circumference;

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const ringColor =
    caloriePercent >= 100
      ? '#E11D48'
      : caloriePercent >= 80
      ? '#F472B6'
      : '#F43F5E';

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left Text */}
      <div className="animate-fade-slide-up">
        <span className="text-[11px] font-black text-rose-300 uppercase tracking-widest block">
          Today's Budget
        </span>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-4xl font-black text-slate-900 tracking-tight leading-none tabular-nums">
            {remaining.calories}
          </span>
          <span className="text-xs font-bold text-stone-500">kcal left</span>
        </div>
        <div className="text-xs text-stone-500 mt-1.5 leading-relaxed">
          Consumed:{' '}
          <strong className="text-rose-500 font-extrabold">{totals.calories}</strong>
          {' / '}
          <span className="text-stone-600">{targets.target_calories} kcal</span>
        </div>
      </div>

      {/* SVG Ring */}
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0 animate-fade-slide-up delay-100">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
          {/* Track */}
          <circle cx="75" cy="75" r={radius} className="stroke-pink-100/70" strokeWidth="12" fill="transparent" />
          {/* Gradient fill */}
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke={caloriePercent >= 100 ? '#E11D48' : 'url(#ringGrad)'}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-slate-900 leading-none tabular-nums">
            {caloriePercent}%
          </span>
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">
            of target
          </span>
        </div>
      </div>
    </div>
  );
}

/** Animated progress bar */
function MacroBar({
  value,
  target,
  color,
  label,
  unit = 'g',
  delay = 0,
}: {
  value: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
  delay?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300 + delay);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.min(100, (value / target) * 100);

  return (
    <div
      className={`p-3 rounded-2xl border animate-fade-slide-up transition-all hover:scale-[1.02]`}
      style={{ animationDelay: `${delay}ms`, ...colorStyles(color).card }}
    >
      <div className="flex justify-between text-[11px] font-extrabold" style={colorStyles(color).text}>
        <span>{label}</span>
        <span className="tabular-nums">{value}/{target}{unit}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={colorStyles(color).track}>
        <div
          className="h-full rounded-full"
          style={{
            width: animated ? `${pct}%` : '0%',
            background: colorStyles(color).fill,
            transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 200}ms`,
          }}
        />
      </div>
    </div>
  );
}

function colorStyles(c: string) {
  const map: Record<string, any> = {
    blue: {
      card: { backgroundColor: 'rgba(255,241,242,0.6)', borderColor: '#fecdd3' },
      text: { color: '#be123c' },
      track: { backgroundColor: '#ffe4e6' },
      fill: 'linear-gradient(90deg, #fb7185, #f43f5e)',
    },
    amber: {
      card: { backgroundColor: 'rgba(253,242,248,0.7)', borderColor: '#fbcfe8' },
      text: { color: '#9d174d' },
      track: { backgroundColor: '#fce7f3' },
      fill: 'linear-gradient(90deg, #ec4899, #f472b6)',
    },
    rose: {
      card: { backgroundColor: 'rgba(255,245,247,0.8)', borderColor: '#fda4af' },
      text: { color: '#881337' },
      track: { backgroundColor: '#ffe4e6' },
      fill: 'linear-gradient(90deg, #e11d48, #fb7185)',
    },
  };
  return map[c] || map.blue;
}

function HealthBar({
  label,
  value,
  target,
  unit,
  delay = 0,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  delay?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400 + delay);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.min(100, (value / target) * 100);
  const fillColor =
    pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';

  return (
    <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-200/70 animate-fade-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-stone-600">{label}</span>
        <span className={`font-extrabold tabular-nums ${pct > 90 ? 'text-red-600' : 'text-slate-800'}`}>
          {value} / {target} {unit}
        </span>
      </div>
      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-2">
        <div
          className="h-full rounded-full"
          style={{
            width: animated ? `${pct}%` : '0%',
            backgroundColor: fillColor,
            transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay + 200}ms`,
          }}
        />
      </div>
    </div>
  );
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recommendations,
  onOpenScanner,
  onOpenManualSearch,
  onAddWater,
  onDeleteLog,
  onSelectRecommendedDish,
  onNavigateToTab
}) => {
  // Loading shimmer
  if (!summary) {
    return (
      <div className="p-4 space-y-4 pb-24">
        {[120, 80, 64, 64, 80].map((h, i) => (
          <div key={i} className="shimmer rounded-3xl" style={{ height: h }} />
        ))}
      </div>
    );
  }

  const { totals, targets, remaining, entries, water_ml } = summary;

  const caloriePercent =
    Math.min(100, Math.round((totals.calories / targets.target_calories) * 100)) || 0;

  const waterTarget = targets.water_target_ml || 2500;
  const waterPercent = Math.min(100, Math.round((water_ml / waterTarget) * 100)) || 0;
  const [waterAnimated, setWaterAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaterAnimated(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-4 space-y-4 pb-28">

      {/* ── 1. CALORIE RING CARD ── */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-soft animate-fade-slide-up overflow-hidden relative">
        {/* Subtle decorative blob */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-rose-100/60 to-pink-50/40 opacity-70 blur-xl pointer-events-none" />

        <CalorieRing
          caloriePercent={caloriePercent}
          totals={totals}
          targets={targets}
          remaining={remaining}
        />

        {/* Macro Bars */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-pink-50">
          <MacroBar value={totals.protein_g} target={targets.target_protein_g} color="blue"  label="Protein" delay={0} />
          <MacroBar value={totals.carbs_g}   target={targets.target_carbs_g}   color="amber" label="Carbs"   delay={80} />
          <MacroBar value={totals.fat_g}     target={targets.target_fat_g}     color="rose"  label="Fat"     delay={160} />
        </div>

        {/* Health Caps */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-pink-50">
          <HealthBar label="Sodium (Salt)" value={totals.sodium_mg} target={targets.target_sodium_mg} unit="mg" delay={0} />
          <HealthBar label="Added Sugar"   value={totals.sugar_g}   target={targets.target_sugar_g}   unit="g"  delay={80} />
        </div>
      </div>

      {/* ── 2. CAMERA CTA BANNER ── */}
      <div
        className="relative rounded-3xl p-4 text-white overflow-hidden flex items-center justify-between cursor-pointer group animate-fade-slide-up delay-100 shadow-float press-anim"
        style={{ background: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 50%, #FB7185 100%)' }}
        onClick={onOpenScanner}
      >
        {/* Animated shimmer overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerMove 2s ease-in-out infinite',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/15 blur-md" />
        <div className="absolute right-14 -bottom-8 w-20 h-20 rounded-full bg-white/15 blur-md" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center space-x-1 bg-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>AI Food Vision</span>
          </div>
          <h3 className="text-base font-black tracking-tight">
            At a Hawker Centre?
          </h3>
          <p className="text-xs text-rose-100 max-w-[200px] leading-relaxed">
            Snap a photo — AI estimates calories & portions instantly!
          </p>
        </div>

        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/35 transition-all duration-200 border border-white/30">
          <Camera className="w-7 h-7 text-white stroke-[2.2]" />
        </div>
      </div>

      {/* ── 3. AI RECOMMENDATIONS ── */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-soft space-y-3 animate-fade-slide-up delay-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                What Should I Eat Next?
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('recommend')}
              className="text-xs font-bold text-rose-500 flex items-center space-x-1 hover:underline underline-offset-2 transition-all"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {recommendations.slice(0, 2).map((rec, idx) => (
              <div
                key={idx}
                onClick={() => onSelectRecommendedDish(rec.dish)}
                className="group p-3 rounded-2xl bg-rose-50/20 border border-rose-100/70 hover:border-pink-300 hover:bg-rose-50/40 cursor-pointer transition-all duration-200 hover:shadow-md flex items-start justify-between card-hover animate-fade-slide-up"
                style={{ animationDelay: `${200 + idx * 80}ms` }}
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-rose-500 transition-colors">
                      {rec.dish.name_en}
                    </span>
                    <span className="text-[10px] bg-pink-50 text-rose-500 font-bold px-1.5 py-0.5 rounded-md">
                      {rec.dish.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                    {rec.reasoning}
                  </p>
                  <div className="flex items-center space-x-3 text-[10px] text-stone-500 font-semibold mt-2">
                    <span className="text-rose-500 font-extrabold text-xs">{rec.dish.calories} kcal</span>
                    <span className="text-pink-600 font-bold">{rec.dish.protein_g}g protein</span>
                    <span>{rec.dish.sodium_mg}mg Na</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-white group-hover:bg-rose-500 border border-rose-200 group-hover:border-rose-500 text-rose-500 group-hover:text-white rounded-xl text-xs font-bold shrink-0 mt-1 transition-all duration-200 shadow-sm"
                >
                  + Log
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. WATER TRACKER ── */}
      <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-soft flex items-center justify-between animate-fade-slide-up delay-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center shadow-sm border border-pink-100 animate-float">
            <Droplets className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Hydration</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              <strong className="text-rose-500 tabular-nums">{water_ml}</strong>
              {' / '}{waterTarget} ml
              {' · '}{Math.round(water_ml / 250)} glasses
            </div>
            <div className="w-36 bg-pink-50 h-2 rounded-full overflow-hidden mt-1.5 border border-pink-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: waterAnimated ? `${waterPercent}%` : '0%',
                  background: 'linear-gradient(90deg, #f472b6, #fb7185)',
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1) 500ms',
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onAddWater(250)}
          className="px-3 py-2 bg-pink-50 hover:bg-rose-500 hover:text-white active:scale-95 text-rose-600 font-extrabold text-xs rounded-2xl flex items-center space-x-1.5 transition-all duration-200 border border-pink-200 hover:border-rose-500 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250ml</span>
        </button>
      </div>

      {/* ── 5. TODAY'S LOGGED MEALS ── */}
      <div className="space-y-3 animate-fade-slide-up delay-250">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Today's Meals
            </h3>
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center tabular-nums">
              {entries.length}
            </span>
          </div>
          <button
            onClick={onOpenManualSearch}
            className="text-xs font-bold text-rose-500 hover:underline underline-offset-2 flex items-center space-x-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Add</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 space-y-3 animate-scale-in">
            <div className="text-4xl animate-bounce-in">🍲</div>
            <div>
              <div className="text-sm font-extrabold text-slate-800">No meals logged yet</div>
              <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Snap your hawker meal or pick from 80+ dishes in our Singapore database.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-1">
              <button
                onClick={onOpenScanner}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-float press-anim"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Food Photo</span>
              </button>
              <button
                onClick={onOpenManualSearch}
                className="px-4 py-2.5 rounded-2xl bg-white border border-rose-100 text-stone-700 text-xs font-bold hover:bg-rose-50/40 press-anim"
              >
                Browse Catalog
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl p-3.5 border border-rose-100/80 hover:border-pink-200 shadow-soft flex items-start space-x-3 transition-all duration-200 group animate-fade-slide-up card-hover"
                style={{ animationDelay: `${300 + idx * 60}ms` }}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0">
                  <img
                    src={entry.photo_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80'}
                    alt={entry.dish_name}
                    className="w-16 h-16 rounded-xl object-cover border border-rose-100/60"
                  />
                  {/* Gradient overlay on image */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {entry.meal_type} · {Math.round(entry.portion_multiplier * 100)}%
                    </span>
                    <button
                      onClick={() => onDeleteLog(entry.id)}
                      className="text-stone-200 group-hover:text-stone-400 hover:!text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                    {entry.dish_name}
                  </h4>
                  {entry.name_local && (
                    <div className="text-[11px] text-stone-400 truncate">{entry.name_local}</div>
                  )}

                  <div className="flex items-center space-x-3 text-xs mt-1.5">
                    <span className="font-extrabold text-rose-500 tabular-nums">{entry.calories} kcal</span>
                    <span className="text-stone-400">P: <strong className="text-pink-600">{entry.protein_g}g</strong></span>
                    <span className="text-stone-400">C: <strong className="text-rose-400">{entry.carbs_g}g</strong></span>
                    <span className="text-stone-400">F: <strong className="text-rose-600">{entry.fat_g}g</strong></span>
                  </div>

                  {entry.healthier_alternative && (
                    <div className="text-[10px] text-rose-800 bg-rose-50/80 border border-rose-200/60 px-2 py-1 rounded-lg mt-2 font-semibold flex items-start space-x-1">
                      <span className="shrink-0">💡</span>
                      <span className="line-clamp-1">{entry.healthier_alternative}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
