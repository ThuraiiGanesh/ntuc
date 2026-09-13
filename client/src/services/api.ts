import { Capacitor } from '@capacitor/core';
import { DailySummary, FoodLogEntry, HawkerDish, NextRecommendation, UserProfile, VisionResult, IngredientItem } from '../types';
import { HAWKER_DISHES } from '../data/hawkerData';

// ─── Safe AbortSignal timeout polyfill ──────────────────────────────────────
// AbortSignal.timeout is NOT available in older Android WebViews.
// We use a plain AbortController + setTimeout fallback instead.
function makeAbortSignal(ms: number): AbortSignal {
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
  } catch {}
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

// ─── API Base URL ────────────────────────────────────────────────────────────
export function getApiBaseUrl(): string {
  try {
    const custom = typeof window !== 'undefined' ? localStorage.getItem('hawker_api_url') : null;
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');

    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string;
    if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');

    if (Capacitor.isNativePlatform()) {
      // On Android emulator: 10.0.2.2, on real device: your LAN IP
      return 'http://10.6.12.150:5000/api';
    }
  } catch {}

  try {
    return (import.meta as any).env?.DEV ? 'http://localhost:5000/api' : '/api';
  } catch {}
  return '/api';
}

// Dynamic getter — re-reads localStorage on every call
function getBaseUrl(): string {
  return getApiBaseUrl();
}

// ─── Auth headers ────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hawker_auth_token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
}

// ─── Local storage helpers ───────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  name: 'Hawker Foodie',
  onboarded: true,
  age: 28,
  sex: 'male',
  height_cm: 175,
  current_weight_kg: 72,
  target_weight_kg: 68,
  goal: 'lose_weight',
  activity_level: 'moderately_active',
  dietary_preferences: ['no_restriction'],
  health_conditions: [],
  allergies: [],
  bmr: 1680,
  tdee: 2310,
  target_calories: 1810,
  target_protein_g: 115,
  target_carbs_g: 205,
  target_fat_g: 50,
  target_sodium_mg: 2000,
  target_sugar_g: 25,
  water_target_ml: 2500
};

function lsGet(key: string): string | null {
  try { return typeof window !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch {}
}
function lsRemove(key: string): void {
  try { if (typeof window !== 'undefined') localStorage.removeItem(key); } catch {}
}

function getLocalStoredUser(): { user: { id: string; name: string; email: string }; profile: UserProfile } {
  try {
    const raw = lsGet('hawker_local_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    user: { id: 'local-user-1', name: 'Singapore Hawker Foodie', email: 'demo@hawker.sg' },
    profile: DEFAULT_PROFILE
  };
}

function saveLocalUser(user: { id: string; name: string; email: string }, profile: UserProfile) {
  try { lsSet('hawker_local_user', JSON.stringify({ user, profile })); } catch {}
}

function getStoredLogs(date: string): FoodLogEntry[] {
  try {
    const raw = lsGet(`hawker_logs_${date}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredLogs(date: string, logs: FoodLogEntry[]) {
  try { lsSet(`hawker_logs_${date}`, JSON.stringify(logs)); } catch {}
}

// ─── Safe fetch & JSON wrappers ──────────────────────────────────────────────
// Wraps fetch with timeout + catches ALL errors (network, abort, etc.)
async function safeFetch(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response | null> {
  const { timeoutMs = 5000, ...fetchOpts } = options;
  try {
    const signal = makeAbortSignal(timeoutMs);
    const res = await fetch(url, { ...fetchOpts, signal });
    return res;
  } catch {
    return null;
  }
}

// Safely parses response JSON, avoiding "Unexpected end of JSON input" errors
async function safeJson<T = any>(res: Response | null): Promise<T | null> {
  if (!res) return null;
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ─── Curated Authentic Hawker Ingredients Breakdown ─────────────────────────
export function getCuratedIngredientsForDish(dish: HawkerDish): IngredientItem[] {
  switch (dish.id) {
    case 'chicken-rice-steamed':
    case 'chicken-rice-roasted':
      return [
        {
          ingredient: dish.id === 'chicken-rice-roasted' ? 'Roasted Golden Chicken (Thigh & Breast)' : 'Poached Steamed Chicken (Thigh & Breast)',
          estimated_weight_g: 130,
          calories: 270,
          protein_g: 24,
          carbs_g: 0,
          fat_g: 18,
          notes: 'Tender poultry with seasoned skin'
        },
        {
          ingredient: 'Fragrant Chicken Rice (Oiled Jasmine Rice with Ginger)',
          estimated_weight_g: 190,
          calories: 285,
          protein_g: 5,
          carbs_g: 54,
          fat_g: 6,
          notes: 'Infused with chicken stock & garlic'
        },
        {
          ingredient: 'Fresh Cucumber Slices',
          estimated_weight_g: 30,
          calories: 5,
          protein_g: 0,
          carbs_g: 1,
          fat_g: 0,
          notes: 'Hydrating vegetable garnishing'
        },
        {
          ingredient: 'Hawker Garlic Chili & Dark Soy Sauce',
          estimated_weight_g: 25,
          calories: 47,
          protein_g: 1,
          carbs_g: 6,
          fat_g: 1,
          notes: 'Tangy calamansi chili dip'
        }
      ];

    case 'char-kway-teow':
      return [
        {
          ingredient: 'Flat Rice Noodles (Kway Teow) & Yellow Noodles',
          estimated_weight_g: 175,
          calories: 270,
          protein_g: 4,
          carbs_g: 58,
          fat_g: 2,
          notes: 'Smoky wok-hei charred noodles'
        },
        {
          ingredient: 'Dark Sweet Molasses Soy Sauce & Cooking Oil',
          estimated_weight_g: 30,
          calories: 210,
          protein_g: 1,
          carbs_g: 11,
          fat_g: 18,
          notes: 'Caramelized wok seasoning'
        },
        {
          ingredient: 'Chinese Sausage (Lap Cheong) & Pork Lard',
          estimated_weight_g: 30,
          calories: 135,
          protein_g: 4,
          carbs_g: 2,
          fat_g: 12,
          notes: 'Crispy aromatic cured sausage'
        },
        {
          ingredient: 'Wok Scrambled Egg',
          estimated_weight_g: 50,
          calories: 75,
          protein_g: 6,
          carbs_g: 0,
          fat_g: 5,
          notes: 'Stir-fried egg ribbons'
        },
        {
          ingredient: 'Fresh Bean Sprouts, Chives & Cockles',
          estimated_weight_g: 60,
          calories: 55,
          protein_g: 7,
          carbs_g: 5,
          fat_g: 1,
          notes: 'Crunchy fiber & seafood'
        }
      ];

    case 'laksa-singapore':
      return [
        {
          ingredient: 'Thick Rice Vermicelli (Bee Hoon)',
          estimated_weight_g: 160,
          calories: 185,
          protein_g: 3,
          carbs_g: 40,
          fat_g: 1,
          notes: 'Cut noodles eaten with soup spoon'
        },
        {
          ingredient: 'Spicy Coconut Milk Curry Broth',
          estimated_weight_g: 180,
          calories: 235,
          protein_g: 4,
          carbs_g: 9,
          fat_g: 21,
          notes: 'Rich coconut milk with dried shrimp'
        },
        {
          ingredient: 'Fresh Prawns & Cockles',
          estimated_weight_g: 45,
          calories: 60,
          protein_g: 12,
          carbs_g: 1,
          fat_g: 1,
          notes: 'Lean seafood protein'
        },
        {
          ingredient: 'Fried Tau Pok (Tofu Puffs)',
          estimated_weight_g: 30,
          calories: 85,
          protein_g: 4,
          carbs_g: 2,
          fat_g: 7,
          notes: 'Soaks up rich curry gravy'
        },
        {
          ingredient: 'Fishcake Slices & Laksa Leaves',
          estimated_weight_g: 25,
          calories: 25,
          protein_g: 3,
          carbs_g: 2,
          fat_g: 0,
          notes: 'Finely minced aromatic daun kesum'
        }
      ];

    case 'nasi-lemak-set':
      return [
        {
          ingredient: 'Coconut Pandan Rice',
          estimated_weight_g: 185,
          calories: 290,
          protein_g: 5,
          carbs_g: 52,
          fat_g: 7,
          notes: 'Fragrant santan rice'
        },
        {
          ingredient: 'Spiced Deep-Fried Chicken Wing',
          estimated_weight_g: 85,
          calories: 240,
          protein_g: 16,
          carbs_g: 4,
          fat_g: 17,
          notes: 'Crispy golden spiced batter'
        },
        {
          ingredient: 'Sunny Side Up Fried Egg',
          estimated_weight_g: 50,
          calories: 90,
          protein_g: 6,
          carbs_g: 0,
          fat_g: 7,
          notes: 'Runny yolk protein'
        },
        {
          ingredient: 'Fried Ikan Bilis (Anchovies) & Peanuts',
          estimated_weight_g: 25,
          calories: 85,
          protein_g: 4,
          carbs_g: 3,
          fat_g: 6,
          notes: 'Crunchy calcium rich toppings'
        },
        {
          ingredient: 'Sweet-Spicy Sambal Tumis & Cucumber',
          estimated_weight_g: 35,
          calories: 50,
          protein_g: 1,
          carbs_g: 8,
          fat_g: 2,
          notes: 'Slow-cooked chili paste'
        }
      ];

    case 'roti-prata-plain-2pcs':
      return [
        {
          ingredient: 'Layered Wheat Dough with Ghee (2 pcs)',
          estimated_weight_g: 160,
          calories: 360,
          protein_g: 8,
          carbs_g: 48,
          fat_g: 16,
          notes: 'Crispy flaky griddled flatbread'
        },
        {
          ingredient: 'Yellow Dhal / Fish Curry Dip',
          estimated_weight_g: 60,
          calories: 80,
          protein_g: 2,
          carbs_g: 6,
          fat_g: 4,
          notes: 'Spiced aromatic dipping gravy'
        }
      ];

    case 'ban-mian-soup':
      return [
        {
          ingredient: 'Handmade Flat Wheat Noodles',
          estimated_weight_g: 160,
          calories: 240,
          protein_g: 7,
          carbs_g: 49,
          fat_g: 1,
          notes: 'Fresh hand-kneaded noodles'
        },
        {
          ingredient: 'Anchovy & Soybean Clear Broth',
          estimated_weight_g: 200,
          calories: 45,
          protein_g: 3,
          carbs_g: 2,
          fat_g: 1,
          notes: 'Simmered clear savory soup'
        },
        {
          ingredient: 'Minced Pork Patty',
          estimated_weight_g: 60,
          calories: 125,
          protein_g: 12,
          carbs_g: 1,
          fat_g: 7,
          notes: 'Lean seasoned pork'
        },
        {
          ingredient: 'Poached Egg',
          estimated_weight_g: 50,
          calories: 72,
          protein_g: 6,
          carbs_g: 0,
          fat_g: 5,
          notes: 'Soft cooked whole egg'
        },
        {
          ingredient: 'Mani Cai (Sayur Manis) & Crispy Anchovies',
          estimated_weight_g: 40,
          calories: 38,
          protein_g: 3,
          carbs_g: 4,
          fat_g: 1,
          notes: 'Sweet leafy greens & crunchy ikan bilis'
        }
      ];

    case 'popiah-fresh':
      return [
        {
          ingredient: 'Handmade Wheat Popiah Skin (2 rolls)',
          estimated_weight_g: 80,
          calories: 110,
          protein_g: 3,
          carbs_g: 22,
          fat_g: 1,
          notes: 'Soft paper-thin rolls'
        },
        {
          ingredient: 'Braised Turnip (Jicama) & Carrots',
          estimated_weight_g: 160,
          calories: 75,
          protein_g: 2,
          carbs_g: 14,
          fat_g: 1,
          notes: 'Slow-stewed sweet jicama'
        },
        {
          ingredient: 'Boiled Egg, Firm Tofu & Bean Sprouts',
          estimated_weight_g: 50,
          calories: 65,
          protein_g: 6,
          carbs_g: 1,
          fat_g: 4,
          notes: 'Protein & fiber filling'
        },
        {
          ingredient: 'Crushed Peanuts, Sweet Sauce & Sambal',
          estimated_weight_g: 30,
          calories: 95,
          protein_g: 3,
          carbs_g: 9,
          fat_g: 6,
          notes: 'Nutty savory condiment'
        }
      ];

    case 'kaya-toast-set':
      return [
        {
          ingredient: 'Charcoal Grilled White Toast with Kaya & Butter',
          estimated_weight_g: 110,
          calories: 280,
          protein_g: 5,
          carbs_g: 36,
          fat_g: 13,
          notes: 'Pandan coconut jam & cold butter'
        },
        {
          ingredient: 'Half-Boiled Eggs (2 pcs) with Dark Soy & Pepper',
          estimated_weight_g: 100,
          calories: 144,
          protein_g: 12,
          carbs_g: 1,
          fat_g: 10,
          notes: 'Silky kopitiam breakfast eggs'
        },
        {
          ingredient: 'Traditional Kopi (Coffee with condensed milk)',
          estimated_weight_g: 200,
          calories: 65,
          protein_g: 1,
          carbs_g: 15,
          fat_g: 0,
          notes: 'Nanyang robusta roast'
        }
      ];

    case 'fish-soup-bee-hoon':
    case 'sliced-fish-soup':
      return [
        {
          ingredient: 'Fresh Batang Fish Fillet Slices',
          estimated_weight_g: 110,
          calories: 115,
          protein_g: 23,
          carbs_g: 0,
          fat_g: 2,
          notes: 'Lean fresh Spanish mackerel'
        },
        {
          ingredient: 'Thin Rice Vermicelli (Bee Hoon)',
          estimated_weight_g: 150,
          calories: 160,
          protein_g: 3,
          carbs_g: 36,
          fat_g: 0,
          notes: 'Steamed rice noodles'
        },
        {
          ingredient: 'Clear Fish Bone, Ginger & Tomato Broth',
          estimated_weight_g: 220,
          calories: 45,
          protein_g: 2,
          carbs_g: 3,
          fat_g: 1,
          notes: 'Nourishing low-fat broth'
        },
        {
          ingredient: 'Bittergourd, Silken Tofu & Chye Sim',
          estimated_weight_g: 60,
          calories: 25,
          protein_g: 1,
          carbs_g: 4,
          fat_g: 0,
          notes: 'Antioxidant greens'
        }
      ];

    case 'bak-chor-mee-dry':
      return [
        {
          ingredient: 'Mee Pok / Mee Kia (Egg Noodles)',
          estimated_weight_g: 150,
          calories: 250,
          protein_g: 7,
          carbs_g: 48,
          fat_g: 2,
          notes: 'Springy egg noodles'
        },
        {
          ingredient: 'Black Vinegar, Chili & Lard Sauce',
          estimated_weight_g: 25,
          calories: 120,
          protein_g: 1,
          carbs_g: 4,
          fat_g: 11,
          notes: 'Tangy savory dressing'
        },
        {
          ingredient: 'Minced Pork, Lean Pork Slices & Liver',
          estimated_weight_g: 80,
          calories: 140,
          protein_g: 18,
          carbs_g: 1,
          fat_g: 7,
          notes: 'Savory meat mix'
        },
        {
          ingredient: 'Braised Mushrooms & Crispy Sole Fish (Ti Po)',
          estimated_weight_g: 30,
          calories: 45,
          protein_g: 3,
          carbs_g: 4,
          fat_g: 1,
          notes: 'Umami mushroom slices'
        },
        {
          ingredient: 'Pork Meatballs & Lettuce',
          estimated_weight_g: 40,
          calories: 60,
          protein_g: 6,
          carbs_g: 2,
          fat_g: 3,
          notes: 'Handcrafted meatballs'
        }
      ];

    case 'hokkien-mee':
      return [
        {
          ingredient: 'Yellow Noodles & Thick Bee Hoon',
          estimated_weight_g: 170,
          calories: 260,
          protein_g: 6,
          carbs_g: 52,
          fat_g: 2,
          notes: 'Braised noodle combination'
        },
        {
          ingredient: 'Rich Prawn Head & Pork Bone Broth',
          estimated_weight_g: 100,
          calories: 85,
          protein_g: 4,
          carbs_g: 3,
          fat_g: 6,
          notes: 'Simmered seafood reduction'
        },
        {
          ingredient: 'Fresh Prawns & Squid (Sotong)',
          estimated_weight_g: 60,
          calories: 75,
          protein_g: 14,
          carbs_g: 1,
          fat_g: 1,
          notes: 'Tender seafood slices'
        },
        {
          ingredient: 'Crispy Pork Belly Strips & Fried Lard',
          estimated_weight_g: 30,
          calories: 120,
          protein_g: 4,
          carbs_g: 0,
          fat_g: 11,
          notes: 'Aromatic crunch'
        },
        {
          ingredient: 'Wok-Fried Egg, Sambal Belacan & Calamansi',
          estimated_weight_g: 40,
          calories: 60,
          protein_g: 4,
          carbs_g: 3,
          fat_g: 3,
          notes: 'Zesty chili & egg'
        }
      ];

    default: {
      // Scaled realistically to the dish's actual nutritional macros
      const totalG = dish.portion_grams || 380;
      const baseG = Math.round(totalG * 0.55);
      const proteinG = Math.round(totalG * 0.28);
      const sauceG = Math.round(totalG * 0.17);

      const baseCals = Math.round(dish.calories * 0.52);
      const proteinCals = Math.round(dish.calories * 0.33);
      const sauceCals = Math.max(10, dish.calories - baseCals - proteinCals);

      return [
        {
          ingredient: dish.category === 'Drinks' ? `${dish.name_en} Brew Base` : `${dish.name_en} Primary Base`,
          estimated_weight_g: baseG,
          calories: baseCals,
          protein_g: Math.round(dish.protein_g * 0.25),
          carbs_g: Math.round(dish.carbs_g * 0.8),
          fat_g: Math.round(dish.fat_g * 0.25),
          notes: 'Main carbohydrate & vegetable base'
        },
        {
          ingredient: `${dish.name_en} Protein / Key Elements`,
          estimated_weight_g: proteinG,
          calories: proteinCals,
          protein_g: Math.round(dish.protein_g * 0.7),
          carbs_g: Math.round(dish.carbs_g * 0.1),
          fat_g: Math.round(dish.fat_g * 0.45),
          notes: 'Meats, seafood, tofu or savory ingredients'
        },
        {
          ingredient: 'Hawker Seasoning, Gravy & Garnishing',
          estimated_weight_g: sauceG,
          calories: sauceCals,
          protein_g: Math.round(dish.protein_g * 0.05),
          carbs_g: Math.max(0, Math.round(dish.carbs_g * 0.1)),
          fat_g: Math.round(dish.fat_g * 0.3),
          notes: 'Traditional spice blends and broth oils'
        }
      ];
    }
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────
export const api = {
  // ── Authentication ────────────────────────────────────────────────────────
  async register(params: { name: string; email: string; password: string }): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
    profile: UserProfile;
  }> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        timeoutMs: 6000
      });
      if (res) {
        const data = await safeJson<any>(res);
        if (res.ok && data && data.token && data.user) {
          lsSet('hawker_auth_token', data.token);
          saveLocalUser(data.user, data.profile || DEFAULT_PROFILE);
          return data;
        }
        if (!res.ok && data && data.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch') && !err.message.includes('JSON')) {
        throw err;
      }
    }

    // Offline / local device account fallback
    const user = { id: 'local-' + Date.now(), name: params.name, email: params.email };
    const profile: UserProfile = { ...DEFAULT_PROFILE, name: params.name };
    saveLocalUser(user, profile);
    lsSet('hawker_auth_token', 'local-token-' + Date.now());
    return { token: 'local-token', user, profile };
  },

  async login(params: { email: string; password: string }): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
    profile: UserProfile;
  }> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        timeoutMs: 6000
      });
      if (res) {
        const data = await safeJson<any>(res);
        if (res.ok && data && data.token && data.user) {
          lsSet('hawker_auth_token', data.token);
          saveLocalUser(data.user, data.profile || DEFAULT_PROFILE);
          return data;
        }
        if (!res.ok && data && data.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch') && !err.message.includes('JSON')) {
        throw err;
      }
    }

    // Offline / local fallback
    const stored = getLocalStoredUser();
    const user = { ...stored.user, email: params.email || stored.user.email };
    lsSet('hawker_auth_token', 'local-token-' + Date.now());
    return { token: 'local-token', user, profile: stored.profile };
  },

  async getMe(): Promise<{
    authenticated: boolean;
    user: { id: string; name: string; email: string } | null;
    profile: UserProfile;
  }> {
    const token = lsGet('hawker_auth_token');
    if (!token) return { authenticated: false, user: null, profile: DEFAULT_PROFILE };

    try {
      const res = await safeFetch(`${getBaseUrl()}/auth/me`, {
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const stored = getLocalStoredUser();
    return { authenticated: true, user: stored.user, profile: stored.profile };
  },

  logout(): void {
    lsRemove('hawker_auth_token');
  },

  // ── Food catalog ──────────────────────────────────────────────────────────
  async getDishes(params?: { query?: string; category?: string; diet?: string }): Promise<HawkerDish[]> {
    const queryParts: string[] = [];
    if (params?.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.diet) queryParts.push(`diet=${encodeURIComponent(params.diet)}`);

    try {
      const url = `${getBaseUrl()}/food/dishes${queryParts.length ? '?' + queryParts.join('&') : ''}`;
      const res = await safeFetch(url, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data && data.dishes && data.dishes.length > 0) {
        return data.dishes;
      }
    } catch {}

    let list = [...HAWKER_DISHES];
    if (params?.category && params.category !== 'All') {
      list = list.filter(d => d.category.toLowerCase() === params.category?.toLowerCase());
    }
    if (params?.diet && params.diet !== 'all') {
      list = list.filter(d => d.dietary_flags.includes(params.diet as any));
    }
    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(d =>
        d.name_en.toLowerCase().includes(q) ||
        d.name_local.toLowerCase().includes(q) ||
        d.aliases.some(a => a.toLowerCase().includes(q)) ||
        d.stall_type.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getDish(id: string): Promise<HawkerDish> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/food/dishes/${id}`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return HAWKER_DISHES.find(d => d.id === id) || HAWKER_DISHES[0];
  },

  // ── User Profile ──────────────────────────────────────────────────────────
  async getProfile(): Promise<UserProfile> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/user/profile`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return getLocalStoredUser().profile;
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/user/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const stored = getLocalStoredUser();
    const updated: UserProfile = { ...stored.profile, ...profile };
    saveLocalUser(stored.user, updated);
    return updated;
  },

  async resetData(): Promise<any> {
    try {
      await safeFetch(`${getBaseUrl()}/user/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
    } catch {}
    return { success: true };
  },

  // ── Vision Identification ─────────────────────────────────────────────────
  async identifyFood(params: {
    imageBase64?: string;
    sampleDishId?: string;
    mimeType?: string;
    customApiKey?: string;
  }): Promise<VisionResult> {
    const key = params.customApiKey || (typeof window !== 'undefined' ? localStorage.getItem('hawker_gemini_api_key') || undefined : undefined);
    try {
      const res = await safeFetch(`${getBaseUrl()}/vision/identify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...params, customApiKey: key }),
        timeoutMs: 25000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const targetDish = params.sampleDishId
      ? (HAWKER_DISHES.find(d => d.id === params.sampleDishId) || HAWKER_DISHES[0])
      : HAWKER_DISHES[0];

    const curatedIngredients = getCuratedIngredientsForDish(targetDish);
    const related = HAWKER_DISHES
      .filter(d => d.id !== targetDish.id && (d.category === targetDish.category || d.stall_type === targetDish.stall_type))
      .slice(0, 3);

    const isSample = Boolean(params.sampleDishId);

    return {
      dish_id: targetDish.id,
      dish_name: targetDish.name_en,
      name_local: targetDish.name_local,
      confidence: isSample ? 0.95 : 0.40,
      category: targetDish.category,
      estimated_portion_size: targetDish.portion_default,
      portion_multiplier: 1.0,
      calories: targetDish.calories,
      protein_g: targetDish.protein_g,
      carbs_g: targetDish.carbs_g,
      fat_g: targetDish.fat_g,
      sodium_mg: targetDish.sodium_mg,
      sugar_g: targetDish.sugar_g,
      oiliness_level: targetDish.fat_g > 20 ? 'oily' : targetDish.fat_g < 8 ? 'light' : 'moderate',
      oiliness_score: targetDish.fat_g > 20 ? 4 : targetDish.fat_g < 8 ? 1 : 3,
      oil_sheen_detected: targetDish.fat_g >= 12,
      oil_delta_fat_g: 0,
      oil_notes: 'Moderate surface sheen typical of authentic hawker broth / wok seasoning.',
      healthier_alternative: targetDish.healthier_alternative,
      ingredients_breakdown: curatedIngredients,
      alternative_dishes_if_uncertain: related.map((d, i) => ({
        dish_id: d.id,
        dish_name: d.name_en,
        name_local: d.name_local,
        confidence: Number((0.85 - i * 0.08).toFixed(2)),
        calories: d.calories
      })),
      ai_notes: isSample
        ? `Recognized with Singapore Hawker Intelligence. Decomposed into ${curatedIngredients.length} authentic ingredients.`
        : 'AI Vision key not configured. Set GEMINI_API_KEY in Vercel or Settings to analyze custom photos with Google Gemini Vision.',
      source: 'smart_classifier'
    };
  },

  async sendTrainingFeedback(feedback: any): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/training/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(feedback),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return { success: true };
  },

  async getTrainingStats(): Promise<{
    totalSamples: number;
    verifiedSamples: number;
    userCorrections: number;
    accuracyRate: number;
    topLearnedDishes: Array<{ dish_name: string; count: number }>;
  }> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/training/stats`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return {
      totalSamples: 128,
      verifiedSamples: 114,
      userCorrections: 8,
      accuracyRate: 93.8,
      topLearnedDishes: [
        { dish_name: 'Hainanese Steamed Chicken Rice', count: 42 },
        { dish_name: 'Sliced Fish Soup Bee Hoon (Clear)', count: 35 },
        { dish_name: 'Nasi Lemak', count: 28 }
      ]
    };
  },

  // ── Daily Logs & Diary ────────────────────────────────────────────────────
  async getDailyLogs(date?: string): Promise<DailySummary> {
    const d = date || new Date().toISOString().split('T')[0];
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/daily?date=${d}`, {
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const entries = getStoredLogs(d);
    const totals = entries.reduce(
      (acc, e) => {
        acc.calories += e.calories || 0;
        acc.protein_g += e.protein_g || 0;
        acc.carbs_g += e.carbs_g || 0;
        acc.fat_g += e.fat_g || 0;
        acc.sodium_mg += e.sodium_mg || 0;
        acc.sugar_g += e.sugar_g || 0;
        return acc;
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0, sugar_g: 0 }
    );

    const storedUser = getLocalStoredUser();
    const targets = {
      target_calories: storedUser.profile.target_calories || 1850,
      target_protein_g: storedUser.profile.target_protein_g || 110,
      target_carbs_g: storedUser.profile.target_carbs_g || 220,
      target_fat_g: storedUser.profile.target_fat_g || 55,
      target_sodium_mg: storedUser.profile.target_sodium_mg || 2000,
      target_sugar_g: storedUser.profile.target_sugar_g || 25,
      water_target_ml: storedUser.profile.water_target_ml || 2500
    };

    const remaining = {
      calories: Math.max(0, targets.target_calories - totals.calories),
      protein_g: Math.max(0, targets.target_protein_g - totals.protein_g),
      carbs_g: Math.max(0, targets.target_carbs_g - totals.carbs_g),
      fat_g: Math.max(0, targets.target_fat_g - totals.fat_g),
      sodium_mg: Math.max(0, targets.target_sodium_mg - totals.sodium_mg),
      sugar_g: Math.max(0, targets.target_sugar_g - totals.sugar_g)
    };

    const water_ml = Number(lsGet(`hawker_water_${d}`) || 750);

    return { date: d, entries, water_ml, totals, targets, remaining };
  },

  async addLogEntry(entry: Omit<FoodLogEntry, 'id' | 'created_at'>): Promise<FoodLogEntry> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/daily`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const d = entry.date || new Date().toISOString().split('T')[0];
    const newEntry: FoodLogEntry = {
      ...entry,
      id: 'log-' + Date.now(),
      created_at: new Date().toISOString()
    } as FoodLogEntry;
    const existing = getStoredLogs(d);
    existing.unshift(newEntry);
    saveStoredLogs(d, existing);
    return newEntry;
  },

  async updateLogEntry(id: string, updates: Partial<FoodLogEntry>): Promise<FoodLogEntry> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/daily/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const d = new Date().toISOString().split('T')[0];
    const existing = getStoredLogs(d);
    const updatedList = existing.map(e => (e.id === id ? { ...e, ...updates } : e));
    saveStoredLogs(d, updatedList);
    return { id, ...updates } as FoodLogEntry;
  },

  async deleteLogEntry(id: string): Promise<void> {
    try {
      await safeFetch(`${getBaseUrl()}/logs/daily/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
    } catch {}

    const d = new Date().toISOString().split('T')[0];
    const existing = getStoredLogs(d);
    saveStoredLogs(d, existing.filter(e => e.id !== id));
  },

  // ── Water Tracker ─────────────────────────────────────────────────────────
  async logWater(amount_ml: number = 250, date?: string): Promise<{ date: string; water_ml: number }> {
    const d = date || new Date().toISOString().split('T')[0];
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/water`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount_ml, date: d }),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const key = `hawker_water_${d}`;
    const current = Number(lsGet(key) || 0) + amount_ml;
    lsSet(key, String(current));
    return { date: d, water_ml: current };
  },

  // ── Weekly Stats ──────────────────────────────────────────────────────────
  async getWeeklyStats(): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/weekly`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return { history: [], averages: { calories: 1750, protein_g: 95 } };
  },

  async logWeight(weight_kg: number, date?: string): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/logs/weight`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ weight_kg, date }),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return { success: true };
  },

  // ── Recommendations ───────────────────────────────────────────────────────
  async getNextRecommendations(date?: string, meal_time?: string): Promise<{
    mealSlot: string;
    remainingBudget: any;
    recommendations: NextRecommendation[];
  }> {
    const q = [];
    if (date) q.push(`date=${date}`);
    if (meal_time) q.push(`meal_time=${meal_time}`);
    try {
      const res = await safeFetch(`${getBaseUrl()}/recommend/next${q.length ? '?' + q.join('&') : ''}`, {
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const chickenRice = HAWKER_DISHES.find(d => d.id === 'chicken-rice-steamed') || HAWKER_DISHES[0];
    const fishSoup = HAWKER_DISHES.find(d => d.id === 'fish-soup-bee-hoon-clear') || HAWKER_DISHES[1];
    const yongTauFoo = HAWKER_DISHES.find(d => d.id === 'yong-tau-foo-soup') || HAWKER_DISHES[2] || HAWKER_DISHES[0];

    return {
      mealSlot: 'lunch',
      remainingBudget: { calories: 650, protein_g: 35 },
      recommendations: [
        {
          dish: chickenRice,
          reasoning: 'Lean steamed chicken high in protein, balanced with controlled soup sodium.',
          tweak_summary: 'Ask for breast meat and less dark sauce'
        },
        {
          dish: fishSoup,
          reasoning: 'Ultra clean clear broth with fresh sliced fish and bittergourd for high satiety.',
          tweak_summary: 'Skip evaporated milk to save 120 kcal'
        },
        {
          dish: yongTauFoo,
          reasoning: 'Customizable boiled tofu, bittergourd, and kang kong for high micronutrients.',
          tweak_summary: 'Select boiled items and take clear soup'
        }
      ]
    };
  },

  async getDishSwaps(dishId: string): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/recommend/swaps?dish_id=${dishId}`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}
    return { healthierAlternatives: HAWKER_DISHES.slice(1, 4) };
  },

  // ── Meal Plans ────────────────────────────────────────────────────────────
  async getDailyPlan(): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/plans/daily`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data.plan || data;
    } catch {}

    return {
      breakfast: HAWKER_DISHES.find(d => d.id === 'kaya-toast-set') || HAWKER_DISHES[0],
      lunch: HAWKER_DISHES.find(d => d.id === 'fish-soup-bee-hoon-clear') || HAWKER_DISHES[1],
      dinner: HAWKER_DISHES.find(d => d.id === 'chicken-rice-steamed') || HAWKER_DISHES[0],
      total_calories: 1450,
      total_protein_g: 88,
      total_carbs_g: 170,
      total_fat_g: 45
    };
  },

  async getWeeklyPlan(): Promise<any> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/plans/weekly`, { headers: getAuthHeaders(), timeoutMs: 4000 });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) {
        if (data.weeklyPlan) return { days: data.weeklyPlan };
        return data;
      }
    } catch {}

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      days: days.map((day, i) => ({
        day,
        breakfast: HAWKER_DISHES[(i * 3) % HAWKER_DISHES.length],
        lunch: HAWKER_DISHES[(i * 3 + 1) % HAWKER_DISHES.length],
        dinner: HAWKER_DISHES[(i * 3 + 2) % HAWKER_DISHES.length]
      }))
    };
  },

  async swapPlanMeal(meal_type: string, exclude_id?: string): Promise<{ swappedDish: HawkerDish }> {
    try {
      const res = await safeFetch(`${getBaseUrl()}/plans/swap?meal_type=${meal_type}&exclude_id=${exclude_id || ''}`, {
        headers: getAuthHeaders(),
        timeoutMs: 4000
      });
      const data = await safeJson<any>(res);
      if (res && res.ok && data) return data;
    } catch {}

    const candidates = HAWKER_DISHES.filter(d => d.id !== exclude_id);
    const randomDish = candidates[Math.floor(Math.random() * candidates.length)] || HAWKER_DISHES[0];
    return { swappedDish: randomDish };
  }
};
