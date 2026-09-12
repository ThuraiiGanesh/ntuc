import React, { useState } from 'react';
import { X, Check, Save, HeartPulse, User, LogOut, Mail, Sparkles, BrainCircuit } from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  currentUser?: { id?: string; name: string; email: string } | null;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  currentUser,
  onClose,
  onProfileUpdated,
  onLogout
}) => {
  if (!isOpen || !profile) return null;

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [currentWeight, setCurrentWeight] = useState(profile.current_weight_kg);
  const [targetWeight, setTargetWeight] = useState(profile.target_weight_kg || 68);
  const [height, setHeight] = useState(profile.height_cm);
  const [goal, setGoal] = useState(profile.goal);
  const [activityLevel, setActivityLevel] = useState(profile.activity_level);
  const [healthConditions, setHealthConditions] = useState<string[]>(profile.health_conditions || []);
  const [dietary, setDietary] = useState<string[]>(profile.dietary_preferences || ['no_restriction']);
  const [saving, setSaving] = useState(false);

  const toggleHealth = (cond: string) => {
    if (healthConditions.includes(cond)) {
      setHealthConditions(healthConditions.filter(c => c !== cond));
    } else {
      setHealthConditions([...healthConditions, cond]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        age: Number(age),
        current_weight_kg: Number(currentWeight),
        target_weight_kg: Number(targetWeight),
        height_cm: Number(height),
        goal,
        activity_level: activityLevel,
        health_conditions: healthConditions,
        dietary_preferences: dietary
      });

      onProfileUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200 animate-scale-in">
        
        {/* Header */}
        <div className="bg-white px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#D9381E]" />
            <h3 className="font-extrabold text-sm text-slate-900">Profile & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:rotate-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          
          {/* User Account Card */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-soft space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D9381E] to-[#EA580C] text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">{name}</div>
                  <div className="text-[11px] text-stone-500 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>{currentUser?.email || 'demo@hawker.sg'}</span>
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>

          {/* User Name & Goal */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-soft">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#D9381E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Nutrition Goal</label>
              <select
                value={goal}
                onChange={e => setGoal(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#D9381E]"
              >
                <option value="lose_weight">Lose Weight (-500 kcal/day)</option>
                <option value="maintain">Maintain Current Weight (TDEE)</option>
                <option value="build_muscle">Build Muscle (+450 kcal/day)</option>
                <option value="gain_weight">Gain Weight (+350 kcal/day)</option>
              </select>
            </div>
          </div>

          {/* Body Stats */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-soft">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Physical Stats</h4>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Current Wt (kg)</label>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={e => setCurrentWeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Target Wt (kg)</label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={e => setTargetWeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="sedentary">Sedentary (desk job, low activity)</option>
                <option value="lightly_active">Lightly Active (1-3 days exercise)</option>
                <option value="moderately_active">Moderately Active (3-5 days exercise)</option>
                <option value="very_active">Very Active (hard training 6-7 days)</option>
              </select>
            </div>
          </div>

          {/* Health Conditions (Dynamic Sodium/Sugar Caps) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2.5 shadow-soft">
            <div className="flex items-center space-x-1.5">
              <HeartPulse className="w-4 h-4 text-[#D9381E]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Health Conditions (HPB Caps)
              </h4>
            </div>
            <p className="text-[11px] text-stone-500">
              Enforces health caps on daily sodium and added sugar metrics.
            </p>

            <div className="space-y-1.5 pt-1">
              {[
                { id: 'hypertension', label: 'Hypertension (Sodium Cap < 1,500mg)' },
                { id: 'diabetes', label: 'Diabetes / Pre-Diabetes (Sugar Cap < 20g)' },
                { id: 'high_cholesterol', label: 'High Cholesterol (Flags Fried Lard)' },
                { id: 'kidney_condition', label: 'Kidney Condition (Low Sodium & Protein)' }
              ].map(h => {
                const active = healthConditions.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHealth(h.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                      active
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <span>{h.label}</span>
                    {active && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Continuous Vision Learning Status Card */}
          <div className="bg-gradient-to-br from-red-50/70 via-white to-amber-50/70 p-4 rounded-2xl border border-red-100 shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <BrainCircuit className="w-4 h-4 text-[#D9381E]" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Continuous Vision Training
                </h4>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Self-Improving Active
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every meal photo you log and verify is saved to the continuous training dataset, progressively sharpening the model's accuracy on authentic Singapore hawker dishes and portion estimation.
            </p>
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="p-4 bg-white border-t border-stone-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-[#D9381E] to-[#EA580C] hover:opacity-95 active:scale-[0.99] text-white rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-red-500/20 transition-all press-anim"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Targets...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
