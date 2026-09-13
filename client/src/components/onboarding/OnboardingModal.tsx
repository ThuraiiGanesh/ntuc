import React, { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Sparkles, HeartPulse, Scale, Activity, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../../types';
import { api } from '../../services/api';

interface OnboardingModalProps {
  initialProfile?: UserProfile | null;
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  isOpen,
  onComplete,
  onClose
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(initialProfile?.name || 'Fellow Makan Lover');
  const [goal, setGoal] = useState<'lose_weight' | 'maintain' | 'gain_weight' | 'build_muscle'>(
    initialProfile?.goal || 'lose_weight'
  );
  const [targetWeight, setTargetWeight] = useState(initialProfile?.target_weight_kg || 68);
  const [age, setAge] = useState(initialProfile?.age || 28);
  const [sex, setSex] = useState<'male' | 'female'>(initialProfile?.sex || 'male');
  const [height, setHeight] = useState(initialProfile?.height_cm || 172);
  const [currentWeight, setCurrentWeight] = useState(initialProfile?.current_weight_kg || 74);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'>(
    initialProfile?.activity_level || 'lightly_active'
  );
  
  // Dietary Preferences
  const [dietary, setDietary] = useState<string[]>(initialProfile?.dietary_preferences || ['no_restriction']);
  
  // Health Conditions
  const [healthConditions, setHealthConditions] = useState<string[]>(initialProfile?.health_conditions || []);
  
  // Allergies
  const [allergies, setAllergies] = useState<string[]>(initialProfile?.allergies || []);

  const toggleDietary = (item: string) => {
    if (item === 'no_restriction') {
      setDietary(['no_restriction']);
      return;
    }
    const filtered = dietary.filter(d => d !== 'no_restriction');
    if (filtered.includes(item)) {
      const next = filtered.filter(d => d !== item);
      setDietary(next.length ? next : ['no_restriction']);
    } else {
      setDietary([...filtered, item]);
    }
  };

  const toggleHealth = (cond: string) => {
    if (cond === 'none') {
      setHealthConditions([]);
      return;
    }
    if (healthConditions.includes(cond)) {
      setHealthConditions(healthConditions.filter(h => h !== cond));
    } else {
      setHealthConditions([...healthConditions, cond]);
    }
  };

  const toggleAllergy = (al: string) => {
    if (al === 'none') {
      setAllergies([]);
      return;
    }
    if (allergies.includes(al)) {
      setAllergies(allergies.filter(a => a !== al));
    } else {
      setAllergies([...allergies, al]);
    }
  };

  // Preview Calculations (Mifflin-St Jeor)
  const bmr = Math.round(
    sex === 'male'
      ? 10 * currentWeight + 6.25 * height - 5 * age + 5
      : 10 * currentWeight + 6.25 * height - 5 * age - 161
  );
  const mults = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
  const tdee = Math.round(bmr * mults[activityLevel]);
  
  let targetCalories = tdee;
  if (goal === 'lose_weight') targetCalories = Math.max(1200, tdee - 500);
  else if (goal === 'gain_weight') targetCalories = tdee + 350;
  else if (goal === 'build_muscle') targetCalories = tdee + 450;

  const targetProtein = Math.round(currentWeight * (goal === 'build_muscle' ? 2.0 : goal === 'lose_weight' ? 1.8 : 1.5));
  const targetFat = Math.round((targetCalories * 0.28) / 9);
  const targetCarbs = Math.round(Math.max(0, targetCalories - targetProtein * 4 - targetFat * 9) / 4);
  const targetSodium = healthConditions.includes('hypertension') ? 1500 : 2000;
  const targetSugar = (healthConditions.includes('diabetes') || healthConditions.includes('pre_diabetes')) ? 20 : 35;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updated = await api.updateProfile({
        name,
        onboarded: true,
        age: Number(age),
        sex,
        height_cm: Number(height),
        current_weight_kg: Number(currentWeight),
        target_weight_kg: Number(targetWeight),
        goal,
        activity_level: activityLevel,
        dietary_preferences: dietary,
        health_conditions: healthConditions,
        allergies
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onComplete(updated);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200">
        
        {/* Header with Progress Bar */}
        <div className="bg-gradient-to-r from-[#D9381E] to-[#EA580C] text-white p-5 pb-6 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-red-100">
              Personalised SG Tracker
            </span>
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
              Step {step} of 5
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {step === 1 && "What's Your Nutrition Goal?"}
            {step === 2 && 'Your Body Stats'}
            {step === 3 && 'Dietary Preferences'}
            {step === 4 && 'Health & Allergies'}
            {step === 5 && 'Your Hawker Targets'}
          </h2>
          <p className="text-xs text-red-100 mt-1">
            {step === 1 && 'Personalize your daily calorie and macro budget.'}
            {step === 2 && 'Used for Mifflin-St Jeor BMR & TDEE calculation.'}
            {step === 3 && 'We will tailor hawker recommendations to fit.'}
            {step === 4 && 'Adjusts sodium & sugar caps (HPB aligned).'}
            {step === 5 && 'Scientifically calculated for Singapore hawker dining.'}
          </p>

          {/* Progress dots */}
          <div className="flex space-x-1.5 mt-4">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-white/70' : 'w-4 bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: GOAL */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Select Primary Goal
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'lose_weight', title: 'Lose Weight / Fat', desc: '-500 kcal/day (~0.5kg/week loss)', icon: '🥗' },
                  { id: 'maintain', title: 'Maintain Current Weight', desc: 'Eat at your exact daily TDEE', icon: '⚖️' },
                  { id: 'build_muscle', title: 'Build Muscle & Lean Bulk', desc: '+450 kcal with high protein target', icon: '💪' },
                  { id: 'gain_weight', title: 'Gain Weight / Surplus', desc: '+350 kcal healthy caloric surplus', icon: '🍲' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as any)}
                    className={`flex items-start p-3.5 rounded-2xl border text-left transition-all ${
                      goal === item.id
                        ? 'bg-red-50/80 border-[#D9381E] shadow-sm ring-1 ring-[#D9381E]'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{item.desc}</div>
                    </div>
                    {goal === item.id && (
                      <div className="w-5 h-5 rounded-full bg-[#D9381E] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {goal === 'lose_weight' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={e => setTargetWeight(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BODY STATS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Sex</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSex('male')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        sex === 'male' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex('female')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        sex === 'female' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Age (years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    value={currentWeight}
                    onChange={e => setCurrentWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#D9381E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Daily Physical Activity Level
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, little to no exercise' },
                    { id: 'lightly_active', label: 'Lightly Active', sub: 'Light exercise 1-3 days/week' },
                    { id: 'moderately_active', label: 'Moderately Active', sub: 'Moderate exercise 3-5 days/week' },
                    { id: 'very_active', label: 'Very Active', sub: 'Hard training / sports 6-7 days/week' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityLevel(act.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        activityLevel === act.id
                          ? 'bg-red-50 border-[#D9381E] text-slate-900 font-bold'
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{act.label}</div>
                        <div className="text-[11px] text-stone-500">{act.sub}</div>
                      </div>
                      {activityLevel === act.id && <Check className="w-4 h-4 text-[#D9381E]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DIETARY PREFERENCES */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 font-medium">
                Select your food preferences. Googoogaga prioritizes compliant hawker stalls (Halal, Vegetarian, etc.).
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'no_restriction', label: 'No Restrictions', emoji: '🍜' },
                  { id: 'halal', label: 'Halal Certified', emoji: '🕌' },
                  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
                  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
                  { id: 'low_carb', label: 'Low-Carb / Keto', emoji: '🥑' },
                  { id: 'high_protein', label: 'High Protein Focus', emoji: '🍗' }
                ].map(item => {
                  const active = dietary.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleDietary(item.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center space-x-2 transition-all ${
                        active
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-xs flex-1">{item.label}</span>
                      {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: HEALTH CONDITIONS & ALLERGIES */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-1.5 mb-2">
                  <HeartPulse className="w-4 h-4 text-[#D9381E]" />
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Health Conditions (Optional)
                  </label>
                </div>
                <p className="text-[11px] text-stone-500 mb-2.5">
                  Helps us cap sodium (&lt;1,500mg for hypertension) and sugar (&lt;20g for diabetes) aligned with Health Promotion Board standards.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'diabetes', title: 'Diabetes / Pre-Diabetes', note: 'Strict sugar cap (<20g) & carb warning' },
                    { id: 'hypertension', title: 'Hypertension (High Blood Pressure)', note: 'Strict sodium cap (<1,500mg) & low-salt nudges' },
                    { id: 'high_cholesterol', title: 'High Cholesterol', note: 'Flags saturated fat & deep-fried lard' },
                    { id: 'kidney_condition', title: 'Kidney Condition', note: 'Monitors sodium, potassium, and protein density' }
                  ].map(h => {
                    const active = healthConditions.includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleHealth(h.id)}
                        className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                          active
                            ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500 text-amber-950 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{h.title}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">{h.note}</div>
                        </div>
                        {active && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center space-x-1.5 mb-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Allergies & Intolerances
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['shellfish', 'peanut', 'gluten', 'lactose', 'soy', 'egg'].map(al => {
                    const active = allergies.includes(al);
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => toggleAllergy(al)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                          active
                            ? 'bg-red-100 border-red-400 text-red-800 font-bold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {al}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CALCULATED TARGETS SUMMARY */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 p-4 rounded-2xl text-center">
                <span className="text-[11px] uppercase font-bold tracking-wider text-amber-800">
                  Daily Calorie Target
                </span>
                <div className="text-4xl font-extrabold text-[#D9381E] mt-1 tracking-tight">
                  {targetCalories} <span className="text-lg font-bold text-stone-500">kcal</span>
                </div>
                <div className="text-xs text-stone-600 mt-1 flex justify-center space-x-3">
                  <span>BMR: <strong>{bmr}</strong></span>
                  <span>•</span>
                  <span>TDEE: <strong>{tdee}</strong> kcal</span>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-stone-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-600">Protein</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-0.5">{targetProtein}g</div>
                  <div className="text-[10px] text-stone-400">{Math.round((targetProtein * 4 * 100) / targetCalories)}% cal</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-stone-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-amber-600">Carbs</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-0.5">{targetCarbs}g</div>
                  <div className="text-[10px] text-stone-400">{Math.round((targetCarbs * 4 * 100) / targetCalories)}% cal</div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-stone-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-600">Fat</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-0.5">{targetFat}g</div>
                  <div className="text-[10px] text-stone-400">28% cal</div>
                </div>
              </div>

              {/* Health Caps */}
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Singapore Health Caps</div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-600">Sodium Limit (HPB Salt War)</span>
                  <span className={`font-bold ${healthConditions.includes('hypertension') ? 'text-amber-600' : 'text-slate-800'}`}>
                    &lt; {targetSodium} mg/day
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-stone-600">Added Sugar Limit (War on Diabetes)</span>
                  <span className={`font-bold ${healthConditions.includes('diabetes') ? 'text-amber-600' : 'text-slate-800'}`}>
                    &lt; {targetSugar} g/day
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs flex items-center space-x-1 hover:bg-stone-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-[#D9381E] hover:bg-[#B91C1C] text-white font-bold text-xs flex items-center space-x-1 shadow-md shadow-red-500/20"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9381E] to-[#EA580C] text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-500/30 hover:opacity-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Calculating...' : 'Start Makan Tracking!'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
