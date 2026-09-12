import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeftRight, Check, Heart, ShieldAlert, Plus } from 'lucide-react';
import { NextRecommendation, DailySummary, HawkerDish } from '../../types';
import { api } from '../../services/api';

interface RecommendationsViewProps {
  summary: DailySummary | null;
  onSelectDish: (dish: HawkerDish) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  summary,
  onSelectDish
}) => {
  const [activeTab, setActiveTab] = useState<'next' | 'swaps'>('next');
  const [recommendations, setRecommendations] = useState<NextRecommendation[]>([]);
  const [mealSlot, setMealSlot] = useState('lunch');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [summary?.totals.calories]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.getNextRecommendations();
      setRecommendations(data.recommendations);
      setMealSlot(data.mealSlot);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const remainingCal = summary?.remaining.calories || 600;
  const remainingP = summary?.remaining.protein_g || 30;

  // Curated list of classic Singapore hawker swaps
  const CLASSIC_SWAPS = [
    {
      original: 'Char Kway Teow (~745 kcal, 38g fat)',
      swap: 'Fishball Kway Teow Soup (~380 kcal, 7g fat)',
      savings: 'Save ~365 kcal & 31g fat',
      tip: 'Get that comforting kway teow noodle craving in a clear, low-fat fish soup instead of heavy lard wok stir-fry.'
    },
    {
      original: 'Roti Prata with Sugar & Curry (~440 kcal)',
      swap: 'Plain or Masala Thosai (~270 kcal)',
      savings: 'Save ~170 kcal & cut fat by 60%',
      tip: 'Naturally fermented black lentil crepe cooked dry without ghee. Delivers gut-friendly probiotics and soluble fiber.'
    },
    {
      original: 'Fried Carrot Cake Black (~566 kcal, 18g sugar)',
      swap: 'White Carrot Cake (~466 kcal, 3g sugar)',
      savings: 'Save 15g added sugar',
      tip: 'White carrot cake skips the heavy molasses sweet black sauce. Add an extra egg for +6g lean protein.'
    },
    {
      original: 'Regular Kopi / Teh (~140 kcal, 20g sugar)',
      swap: 'Kopi / Teh Siu Dai (~90 kcal, 11g sugar) or Kosong (0g sugar)',
      savings: 'Cuts sugar by 45% to 100%',
      tip: 'Siu Dai is Singapore\'s most effective everyday upgrade. Tastes bolder and cuts 10-20g sugar per cup.'
    },
    {
      original: 'Fried Chicken Cutlet Western (~820 kcal)',
      swap: 'Grilled Chicken with Baked Potato (~460 kcal)',
      savings: 'Save ~360 kcal & 20g fat',
      tip: 'Ask for baked potato instead of fries, and ask for black pepper sauce on the side.'
    }
  ];

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Sub-tab switcher */}
      <div className="flex bg-stone-200/70 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('next')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'next' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>What to Eat Next</span>
        </button>

        <button
          onClick={() => setActiveTab('swaps')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'swaps' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#D9381E]" />
          <span>Healthier Hawker Swaps</span>
        </button>
      </div>

      {/* TAB A: WHAT TO EAT NEXT */}
      {activeTab === 'next' && (
        <div className="space-y-3">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-amber-500 to-[#D9381E] rounded-3xl p-4 text-white shadow-float">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
              Personalised Recommendation
            </span>
            <h2 className="text-base font-extrabold mt-1">
              Suggestions for {mealSlot.toUpperCase()}
            </h2>
            <p className="text-xs text-red-100 mt-1">
              You have <strong>{remainingCal} kcal</strong> and <strong>{remainingP}g protein</strong> remaining in today's budget.
            </p>
          </div>

          {/* List of recommended dishes */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Finding best matches in hawker catalog...
              </div>
            ) : recommendations.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-soft space-y-3 hover:border-[#D9381E] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9381E] bg-red-50 px-2 py-0.5 rounded-md">
                      {item.dish.category}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                      {item.dish.name_en}
                    </h3>
                    <div className="text-[11px] text-stone-500 font-medium">
                      {item.dish.name_local} • {item.dish.stall_type}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-[#D9381E]">
                      {item.dish.calories}
                    </span>
                    <span className="text-[10px] text-stone-400 block -mt-1 font-bold">kcal</span>
                  </div>
                </div>

                {/* Reasoning Quote */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-slate-700 font-medium leading-relaxed">
                  💡 {item.reasoning}
                </div>

                {/* Macro breakdown row */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <div className="flex space-x-3">
                    <span>Protein: <strong className="text-slate-800">{item.dish.protein_g}g</strong></span>
                    <span>Carbs: <strong className="text-slate-800">{item.dish.carbs_g}g</strong></span>
                    <span>Fat: <strong className="text-slate-800">{item.dish.fat_g}g</strong></span>
                  </div>

                  <button
                    onClick={() => onSelectDish(item.dish)}
                    className="px-3 py-1 bg-[#D9381E] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Dish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB B: HEALTHIER SWAPS */}
      {activeTab === 'swaps' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-soft">
            <h3 className="text-sm font-extrabold text-slate-900">Hawker Smart Swaps</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Enjoy your favourite hawker dishes while effortlessly cutting 200–400 kcal and excessive sodium with these ordering secrets.
            </p>
          </div>

          <div className="space-y-3">
            {CLASSIC_SWAPS.map((swap, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-4 border border-stone-200 shadow-soft space-y-2.5"
              >
                {/* Before / After */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center text-rose-800 bg-rose-50 p-2 rounded-xl">
                    <span className="w-4 font-bold text-rose-500 mr-1.5">✕</span>
                    <span className="font-semibold">{swap.original}</span>
                  </div>

                  <div className="flex items-center text-emerald-900 bg-emerald-50 p-2 rounded-xl font-bold">
                    <span className="w-4 text-emerald-600 mr-1.5">✓</span>
                    <span>{swap.swap}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-extrabold text-[#D9381E] text-[11px] bg-red-50 px-2 py-0.5 rounded-lg">
                    {swap.savings}
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 leading-snug">
                  {swap.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
