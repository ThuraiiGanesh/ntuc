import React, { useState } from 'react';
import { Check, X, Sliders, AlertCircle, Sparkles, ChevronDown, RefreshCw, Droplets, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VisionResult, FoodLogEntry, OilinessLevel } from '../../types';
import { api } from '../../services/api';

interface AIResultModalProps {
  isOpen: boolean;
  result: VisionResult | null;
  photoUrl?: string;
  onClose: () => void;
  onLogged: (entry: FoodLogEntry) => void;
  onOpenManualSearch: () => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({
  isOpen,
  result,
  photoUrl,
  onClose,
  onLogged,
  onOpenManualSearch
}) => {
  if (!isOpen || !result) return null;

  // Selected Dish State (allows switching to alternative match)
  const [selectedDishName, setSelectedDishName] = useState(result.dish_name);
  const [selectedLocalName, setSelectedLocalName] = useState(result.name_local || '');
  const [selectedDishId, setSelectedDishId] = useState(result.dish_id || 'custom');
  const [category, setCategory] = useState(result.category);

  // Portion State
  const [multiplier, setMultiplier] = useState<number>(result.portion_multiplier || 1.0);
  const [portionLabel, setPortionLabel] = useState<'small' | 'regular' | 'large' | 'custom'>('regular');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Oiliness & Grease Sheen State
  const [selectedOilLevel, setSelectedOilLevel] = useState<OilinessLevel>(
    result.oiliness_level || 'moderate'
  );

  const OIL_DELTA_MAP: Record<OilinessLevel, { fatG: number; label: string; sub: string; tag: string }> = {
    light: { fatG: -6, label: 'Less Oil / Light', sub: '-6g fat (-54 kcal)', tag: '🌱 Less Oil' },
    moderate: { fatG: 0, label: 'Standard Hawker', sub: 'Baseline recipe', tag: '🟡 Standard' },
    oily: { fatG: 8, label: 'Oily / Rich', sub: '+8g fat (+72 kcal)', tag: '🟠 Oily Sheen' },
    very_oily: { fatG: 14, label: 'Extra Lard / Greasy', sub: '+14g fat (+126 kcal)', tag: '🔥 Extra Greasy' }
  };

  const currentOilDeltaFat = OIL_DELTA_MAP[selectedOilLevel].fatG;
  const currentOilDeltaCals = currentOilDeltaFat * 9;

  // Live Recalculated Nutrition based on Multiplier & Oiliness Level
  const baseCal = result.calories;
  const baseP = result.protein_g;
  const baseC = result.carbs_g;
  const baseF = result.fat_g;
  const baseNa = result.sodium_mg;
  const baseSugar = result.sugar_g;

  const adjustedBaseFat = Math.max(1, baseF + currentOilDeltaFat);
  const adjustedBaseCal = Math.max(50, Math.round(baseCal + currentOilDeltaCals));

  const currentCal = Math.round(adjustedBaseCal * multiplier);
  const currentP = Math.round(baseP * multiplier);
  const currentC = Math.round(baseC * multiplier);
  const currentF = Math.round(adjustedBaseFat * multiplier);
  const currentNa = Math.round(baseNa * multiplier);
  const currentSugar = Math.round(baseSugar * multiplier);

  const setPresetPortion = (type: 'small' | 'regular' | 'large', mult: number) => {
    setPortionLabel(type);
    setMultiplier(mult);
  };

  const handleSliderChange = (val: number) => {
    setMultiplier(val);
    if (val <= 0.8) setPortionLabel('small');
    else if (val >= 1.25) setPortionLabel('large');
    else if (val === 1.0) setPortionLabel('regular');
    else setPortionLabel('custom');
  };

  const handleSelectAlternative = (alt: { dish_id: string; dish_name: string; name_local: string; calories: number }) => {
    setSelectedDishName(alt.dish_name);
    setSelectedLocalName(alt.name_local);
    setSelectedDishId(alt.dish_id);
  };

  const handleConfirmLog = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newEntry = await api.addLogEntry({
        date: today,
        meal_type: mealType,
        dish_id: selectedDishId,
        dish_name: selectedDishName,
        name_local: selectedLocalName,
        portion_size: portionLabel,
        portion_multiplier: multiplier,
        calories: currentCal,
        protein_g: currentP,
        carbs_g: currentC,
        fat_g: currentF,
        sodium_mg: currentNa,
        sugar_g: currentSugar,
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
        healthier_alternative: result.healthier_alternative,
        oiliness_level: selectedOilLevel,
        notes
      });

      // Record confirmed or corrected image to continuous learning dataset
      const userCorrected = selectedDishName !== result.dish_name;
      api.sendTrainingFeedback({
        imageBase64: photoUrl?.startsWith('data:image') ? photoUrl : undefined,
        photoUrl: photoUrl?.startsWith('http') ? photoUrl : undefined,
        dishId: selectedDishId,
        dishName: selectedDishName,
        category: category,
        confidence: result.confidence,
        userConfirmed: true,
        userCorrected,
        originalPrediction: result.dish_name,
        ingredientsBreakdown: result.ingredients_breakdown,
        portionMultiplier: multiplier
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });

      onLogged(newEntry);
      onClose();
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200 animate-slide-up">
        
        {/* Header Bar */}
        <div className="bg-white border-b border-stone-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative z-10" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm leading-none">AI Food Identification</h3>
              <p className="text-[10px] text-stone-400 font-medium mt-0.5">Singapore Hawker Vision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:rotate-90 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 no-scrollbar">
          
          {/* Food photo hero */}
          {photoUrl && (
            <div className="relative h-36 rounded-2xl overflow-hidden border border-stone-200 animate-fade-slide-up">
              <img src={photoUrl} alt="Food" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 text-white">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Identified</div>
                <div className="text-sm font-black leading-tight">{selectedDishName}</div>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span className="inline-flex items-center space-x-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{Math.round(result.confidence * 100)}% match</span>
                </span>
              </div>
            </div>
          )}

          {/* Dish Identification Card */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-soft animate-fade-slide-up delay-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-orange-100 text-[#D9381E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {category} Hawker
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  {selectedDishName}
                </h2>
                {selectedLocalName && (
                  <p className="text-xs text-stone-500 font-medium">
                    {selectedLocalName}
                  </p>
                )}
              </div>

              {/* Confidence badge & Model Source */}
              <div className="text-right flex flex-col items-end gap-1">
                <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                  <span>{Math.round(result.confidence * 100)}% match</span>
                </span>
                {result.source === 'google_gemini' ? (
                  <span className="inline-flex items-center space-x-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    <span>Google Gemini Vision</span>
                  </span>
                ) : result.source === 'claude_api' ? (
                  <span className="inline-flex items-center space-x-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    <span>Claude Vision</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 bg-stone-100 border border-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <span>Hawker Classifier</span>
                  </span>
                )}
                <span className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  <span>🧠 Model Training Active</span>
                </span>
              </div>
            </div>

            {/* AI Visual Note */}
            {result.ai_notes && (
              <p className="text-[11px] text-stone-500 italic mt-2.5 bg-stone-50 p-2 rounded-xl border border-stone-100">
                "{result.ai_notes}"
              </p>
            )}

            {/* Visual Ingredient Breakdown (Google Gemini Multimodal Analysis) */}
            {result.ingredients_breakdown && result.ingredients_breakdown.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Visual Ingredient Breakdown
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {Math.round(
                      result.ingredients_breakdown.reduce((sum, item) => sum + (item.estimated_weight_g || 0), 0) * multiplier
                    )}g total
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-2.5">
                  Identified by Google AI vision. Weights & calories recalculate live with your portion slider:
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {result.ingredients_breakdown.map((ing, idx) => {
                    const scaledWeight = Math.round(ing.estimated_weight_g * multiplier);
                    const scaledCals = Math.round(ing.calories * multiplier);
                    const scaledP = Math.round(ing.protein_g * multiplier);
                    const scaledC = Math.round(ing.carbs_g * multiplier);
                    const scaledF = Math.round(ing.fat_g * multiplier);

                    return (
                      <div
                        key={idx}
                        className="bg-stone-50 hover:bg-white p-2 rounded-xl border border-stone-200/70 transition-colors text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E] shrink-0" />
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {ing.ingredient}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 pl-3 flex items-center space-x-2">
                            <span>P: {scaledP}g</span>
                            <span>•</span>
                            <span>C: {scaledC}g</span>
                            <span>•</span>
                            <span>F: {scaledF}g</span>
                            {ing.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate italic text-stone-500">{ing.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {scaledWeight}g
                          </div>
                          <div className="text-[10px] font-semibold text-amber-700">
                            {scaledCals} kcal
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alternative Candidates */}
            {result.alternative_dishes_if_uncertain?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                  Not quite right? Tap a candidate match:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.alternative_dishes_if_uncertain.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAlternative(alt)}
                      className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition-all ${
                        selectedDishName === alt.dish_name
                          ? 'bg-[#D9381E] text-white border-[#D9381E] font-bold'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {alt.dish_name}
                    </button>
                  ))}
                  <button
                    onClick={onOpenManualSearch}
                    className="text-xs px-2.5 py-1 rounded-xl border border-dashed border-stone-300 text-stone-500 hover:text-stone-800"
                  >
                    Search full catalog...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI OILINESS & GREASE SHEEN SCANNER */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-soft space-y-3 animate-fade-slide-up delay-120">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Oiliness & Grease Sheen
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                selectedOilLevel === 'light'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : selectedOilLevel === 'moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : selectedOilLevel === 'oily'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {OIL_DELTA_MAP[selectedOilLevel].tag}
              </span>
            </div>

            {/* AI Oil Observation Pill */}
            <div className="bg-stone-50 border border-stone-200/70 p-2.5 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-500 font-medium">Visual Sheen Analysis:</span>
                <span className="font-semibold text-slate-700">
                  {result.oil_sheen_detected !== false ? '✨ Surface sheen detected' : '🍃 Low surface reflection'}
                </span>
              </div>
              {result.oil_notes && (
                <p className="text-[11px] text-stone-600 italic">
                  "{result.oil_notes}"
                </p>
              )}
            </div>

            {/* Interactive Oiliness Level Selector */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                Adjust Based on Preparation / Hawker Request:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['light', 'moderate', 'oily', 'very_oily'] as OilinessLevel[]).map(level => {
                  const meta = OIL_DELTA_MAP[level];
                  const isSelected = selectedOilLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedOilLevel(level)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500 text-slate-900 shadow-sm'
                          : 'bg-stone-50/60 border-stone-200/80 text-stone-600 hover:bg-stone-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold truncate">
                          {level === 'light' ? 'Light' : level === 'moderate' ? 'Standard' : level === 'oily' ? 'Oily' : 'Extra Lard'}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-amber-600 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        {meta.fatG > 0 ? `+${meta.fatG}g fat` : meta.fatG < 0 ? `${meta.fatG}g fat` : 'Baseline'}
                      </div>
                      <div className={`text-[9px] font-semibold mt-0.5 ${
                        meta.fatG > 0 ? 'text-amber-700' : meta.fatG < 0 ? 'text-emerald-700' : 'text-stone-400'
                      }`}>
                        {meta.fatG > 0 ? `+${meta.fatG * 9} kcal` : meta.fatG < 0 ? `${meta.fatG * 9} kcal` : '±0 kcal'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Oil Impact Summary */}
            {currentOilDeltaFat !== 0 && (
              <div className="text-[11px] font-medium bg-amber-50 text-amber-900 px-2.5 py-1.5 rounded-lg border border-amber-200/60 flex items-center justify-between">
                <span>Cooking oil impact:</span>
                <span className="font-bold">
                  {currentOilDeltaFat > 0 ? `+${currentOilDeltaFat}g fat (${currentOilDeltaCals > 0 ? '+' : ''}${currentOilDeltaCals} kcal)` : `${currentOilDeltaFat}g fat (${currentOilDeltaCals} kcal)`}
                </span>
              </div>
            )}
          </div>

          {/* PORTION ADJUSTER (Core Requirement) */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-soft space-y-3 animate-fade-slide-up delay-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-[#D9381E]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Portion Size Adjuster
                </span>
              </div>
              <span className="text-xs font-bold text-[#D9381E] bg-red-50 px-2 py-0.5 rounded-md">
                {Math.round(multiplier * 100)}% ({portionLabel})
              </span>
            </div>

            {/* Quick portion chips */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Small', mult: 0.75, sub: 'Less rice / light' },
                { label: 'Regular', mult: 1.0, sub: 'Standard plate' },
                { label: 'Large', mult: 1.3, sub: 'Extra rice / upsize' }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPresetPortion(p.label.toLowerCase() as any, p.mult)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    multiplier === p.mult
                      ? 'bg-red-50 border-[#D9381E] text-slate-900 ring-1 ring-[#D9381E] font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-stone-400">{Math.round(p.mult * 100)}%</div>
                </button>
              ))}
            </div>

            {/* Fine range slider */}
            <div className="pt-1">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={multiplier}
                onChange={e => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#D9381E]"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-medium px-1 mt-1">
                <span>50% (Half)</span>
                <span>100% (Standard)</span>
                <span>200% (Double)</span>
              </div>
            </div>

            {/* Live Recalculated Nutrition Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
              <div className="bg-amber-50/70 p-2 rounded-xl text-center border border-amber-200/50">
                <div className="text-[10px] font-bold text-amber-900 uppercase">Calories</div>
                <div className="text-lg font-extrabold text-[#D9381E]">{currentCal}</div>
                <div className="text-[10px] text-stone-500">kcal</div>
              </div>

              <div className="bg-blue-50/70 p-2 rounded-xl text-center border border-blue-200/50">
                <div className="text-[10px] font-bold text-blue-900 uppercase">Protein</div>
                <div className="text-lg font-extrabold text-blue-700">{currentP}g</div>
                <div className="text-[10px] text-stone-500">macro</div>
              </div>

              <div className="bg-emerald-50/70 p-2 rounded-xl text-center border border-emerald-200/50">
                <div className="text-[10px] font-bold text-emerald-900 uppercase">Carbs / Fat</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{currentC}g / {currentF}g</div>
                <div className="text-[10px] text-stone-500">C / F</div>
              </div>
            </div>

            {/* Sodium & Sugar row */}
            <div className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl text-stone-600">
              <div>
                <span>Sodium: </span>
                <strong className={currentNa > 1200 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                  {currentNa} mg
                </strong>
              </div>
              <div>
                <span>Sugar: </span>
                <strong className={currentSugar > 15 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                  {currentSugar} g
                </strong>
              </div>
            </div>
          </div>

          {/* Healthier Alternative Card */}
          {result.healthier_alternative && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl animate-fade-slide-up delay-200">
              <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Healthier Hawker Order Tip:</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {result.healthier_alternative}
              </p>
            </div>
          )}

          {/* Meal Slot Selector */}
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">Log to Meal Time:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setMealType(slot)}
                  className={`py-1.5 text-xs font-bold capitalize rounded-xl transition-all ${
                    mealType === slot
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-stone-200">
          <button
            onClick={handleConfirmLog}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D9381E] to-[#EA580C] hover:from-[#c0321a] hover:to-[#d9500a] active:scale-[0.98] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30 transition-all duration-200 press-anim"
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>{saving ? 'Logging Meal...' : `Confirm & Log ${currentCal} kcal`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
