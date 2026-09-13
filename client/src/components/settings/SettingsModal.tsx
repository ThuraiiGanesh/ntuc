import React, { useState } from 'react';
import { X, Check, Save, HeartPulse, User, LogOut, Mail, Sparkles, BrainCircuit, Globe, KeyRound, Loader2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../services/api';
import { identifyFoodWithGemini } from '../../services/geminiClient';

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
  const [apiUrl, setApiUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('hawker_api_url') || '' : ''));
  const [geminiKey, setGeminiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('hawker_gemini_api_key') || '' : ''));
  const [saving, setSaving] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [keyError, setKeyError] = useState('');

  const testGeminiKey = async () => {
    if (!geminiKey.trim()) { setKeyStatus('error'); setKeyError('Please paste your API key first.'); return; }
    setKeyStatus('testing');
    setKeyError('');
    try {
      // Use a 1x1 white pixel to validate key without using quota
      const pixel = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
      await identifyFoodWithGemini(pixel, 'image/jpeg', geminiKey.trim());
      setKeyStatus('ok');
      // Save immediately on successful test
      if (typeof window !== 'undefined') localStorage.setItem('hawker_gemini_api_key', geminiKey.trim());
    } catch (err: any) {
      setKeyStatus('error');
      const msg = err?.message || String(err);
      if (msg.includes('API_KEY_INVALID') || msg.includes('invalid') || msg.includes('401')) {
        setKeyError('Invalid API key. Make sure you copied it correctly from aistudio.google.com');
      } else if (msg.includes('quota') || msg.includes('429')) {
        setKeyStatus('ok'); // Key is valid, just rate limited
        setKeyError('');
      } else {
        setKeyError('Test failed: ' + msg.slice(0, 80));
      }
    }
  };

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

      if (typeof window !== 'undefined') {
        if (apiUrl.trim()) {
          localStorage.setItem('hawker_api_url', apiUrl.trim());
        } else {
          localStorage.removeItem('hawker_api_url');
        }

        if (geminiKey.trim()) {
          localStorage.setItem('hawker_gemini_api_key', geminiKey.trim());
        } else {
          localStorage.removeItem('hawker_gemini_api_key');
        }
      }

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

          {/* Backend API Configuration (Mobile / Android Studio) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2.5 shadow-soft">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Backend Server API</h4>
            </div>
            <p className="text-[11px] text-stone-500">
              Android emulator default: <code className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-[10px] font-mono">http://10.0.2.2:5000/api</code>. Leave blank for auto-detect or enter your deployed backend URL.
            </p>
            <input
              type="text"
              placeholder="e.g. http://10.0.2.2:5000/api or https://your-server.vercel.app/api"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono text-slate-800 placeholder:text-stone-400 focus:outline-none focus:border-[#D9381E]"
            />
          </div>

          {/* Google Gemini AI Vision Key */}
          <div className={`p-4 rounded-2xl border space-y-2.5 shadow-soft transition-colors ${
            keyStatus === 'ok' ? 'bg-emerald-50/70 border-emerald-300' :
            keyStatus === 'error' ? 'bg-red-50/70 border-red-300' :
            'bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60 border-blue-200/80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Google Gemini API Key</h4>
              </div>
              {keyStatus === 'ok' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Working
                </span>
              )}
              {keyStatus === 'error' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">Invalid Key</span>
              )}
              {keyStatus === 'idle' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Required for AI Scan</span>
              )}
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              🔑 Needed to identify real food photos (Prata, Laksa, Chicken Rice...). Get a <strong>free</strong> key from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">aistudio.google.com/apikey</a>{' '}
              → tap "Create API Key".
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste your key (AQ... or AIza...)"
                value={geminiKey}
                onChange={e => {
                  const val = e.target.value.trim();
                  setGeminiKey(val);
                  setKeyStatus('idle');
                  if (typeof window !== 'undefined') {
                    if (val) localStorage.setItem('hawker_gemini_api_key', val);
                    else localStorage.removeItem('hawker_gemini_api_key');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono text-slate-800 placeholder:text-stone-400 focus:outline-none focus:border-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={testGeminiKey}
                disabled={keyStatus === 'testing' || !geminiKey.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap transition-all"
              >
                {keyStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {keyStatus === 'testing' ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {keyError && (
              <p className="text-[11px] text-red-600 font-semibold bg-red-50 rounded-lg px-3 py-2 border border-red-200">{keyError}</p>
            )}

            {keyStatus === 'ok' && (
              <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">✓ Key verified — AI photo scanning is now active!</p>
            )}
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
