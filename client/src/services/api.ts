import { Capacitor } from '@capacitor/core';
import { DailySummary, FoodLogEntry, HawkerDish, NextRecommendation, UserProfile, VisionResult } from '../types';

export function getApiBaseUrl(): string {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('hawker_api_url') : null;
  if (custom) return custom.replace(/\/+$/, '');

  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  if (Capacitor.isNativePlatform()) {
    // In Android emulator, 10.0.2.2 is the alias to host computer's localhost
    return 'http://10.0.2.2:5000/api';
  }

  return (import.meta as any).env?.DEV ? 'http://localhost:5000/api' : '/api';
}

const API_BASE = {
  toString() {
    return getApiBaseUrl();
  }
};

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('hawker_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async register(params: { name: string; email: string; password: string }): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
    profile: UserProfile;
  }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create account');
    if (data.token) {
      localStorage.setItem('hawker_auth_token', data.token);
    }
    return data;
  },

  async login(params: { email: string; password: string }): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
    profile: UserProfile;
  }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in');
    if (data.token) {
      localStorage.setItem('hawker_auth_token', data.token);
    }
    return data;
  },

  async getMe(): Promise<{
    authenticated: boolean;
    user: { id: string; name: string; email: string } | null;
    profile: UserProfile;
  }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  logout(): void {
    localStorage.removeItem('hawker_auth_token');
  },

  // Food catalog
  async getDishes(params?: { query?: string; category?: string; diet?: string }): Promise<HawkerDish[]> {
    const queryParts: string[] = [];
    if (params?.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.diet) queryParts.push(`diet=${encodeURIComponent(params.diet)}`);
    
    const url = `${API_BASE}/food/dishes${queryParts.length ? '?' + queryParts.join('&') : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.dishes || [];
  },

  async getDish(id: string): Promise<HawkerDish> {
    const res = await fetch(`${API_BASE}/food/dishes/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // User Profile
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profile)
    });
    return res.json();
  },

  async resetData(): Promise<any> {
    const res = await fetch(`${API_BASE}/user/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Vision Identification
  async identifyFood(params: {
    imageBase64?: string;
    sampleDishId?: string;
    mimeType?: string;
  }): Promise<VisionResult> {
    const res = await fetch(`${API_BASE}/vision/identify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      throw new Error('Vision identification failed');
    }
    return res.json();
  },

  // Continuous Vision Training Feedback
  async sendTrainingFeedback(feedback: {
    imageBase64?: string;
    photoUrl?: string;
    dishId: string;
    dishName: string;
    category?: string;
    confidence?: number;
    userConfirmed?: boolean;
    userCorrected?: boolean;
    originalPrediction?: string;
    ingredientsBreakdown?: any[];
    portionMultiplier?: number;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/training/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(feedback)
      });
      return res.json();
    } catch (err) {
      console.warn('Could not send training feedback:', err);
    }
  },

  async getTrainingStats(): Promise<{
    totalSamples: number;
    verifiedSamples: number;
    userCorrections: number;
    accuracyRate: number;
    topLearnedDishes: Array<{ dish_name: string; count: number }>;
  }> {
    const res = await fetch(`${API_BASE}/training/stats`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Daily Logs & Diary
  async getDailyLogs(date?: string): Promise<DailySummary> {
    const d = date || new Date().toISOString().split('T')[0];
    const res = await fetch(`${API_BASE}/logs/daily?date=${d}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async addLogEntry(entry: Omit<FoodLogEntry, 'id' | 'created_at'>): Promise<FoodLogEntry> {
    const res = await fetch(`${API_BASE}/logs/daily`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entry)
    });
    return res.json();
  },

  async updateLogEntry(id: string, updates: Partial<FoodLogEntry>): Promise<FoodLogEntry> {
    const res = await fetch(`${API_BASE}/logs/daily/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteLogEntry(id: string): Promise<void> {
    await fetch(`${API_BASE}/logs/daily/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Water Tracker
  async logWater(amount_ml: number = 250, date?: string): Promise<{ date: string; water_ml: number }> {
    const res = await fetch(`${API_BASE}/logs/water`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount_ml, date })
    });
    return res.json();
  },

  // Weekly Stats
  async getWeeklyStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/logs/weekly`, { headers: getAuthHeaders() });
    return res.json();
  },

  async logWeight(weight_kg: number, date?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/logs/weight`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ weight_kg, date })
    });
    return res.json();
  },

  // Recommendations
  async getNextRecommendations(date?: string, meal_time?: string): Promise<{
    mealSlot: string;
    remainingBudget: any;
    recommendations: NextRecommendation[];
  }> {
    const q = [];
    if (date) q.push(`date=${date}`);
    if (meal_time) q.push(`meal_time=${meal_time}`);
    const res = await fetch(`${API_BASE}/recommend/next${q.length ? '?' + q.join('&') : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getDishSwaps(dishId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/recommend/swaps?dish_id=${dishId}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Meal Plans
  async getDailyPlan(): Promise<any> {
    const res = await fetch(`${API_BASE}/plans/daily`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getWeeklyPlan(): Promise<any> {
    const res = await fetch(`${API_BASE}/plans/weekly`, { headers: getAuthHeaders() });
    return res.json();
  },

  async swapPlanMeal(meal_type: string, exclude_id?: string): Promise<{ swappedDish: HawkerDish }> {
    const res = await fetch(`${API_BASE}/plans/swap?meal_type=${meal_type}&exclude_id=${exclude_id || ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
