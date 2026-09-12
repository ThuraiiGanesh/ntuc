export interface HawkerDish {
  id: string;
  name_en: string;
  name_local: string;
  aliases: string[];
  category: 'Chinese' | 'Malay' | 'Indian' | 'Western' | 'Drinks' | 'Dim Sum' | 'Peranakan' | 'Snacks';
  stall_type: string;
  portion_default: string;
  portion_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  sugar_g: number;
  fiber_g?: number;
  dietary_flags: Array<'halal' | 'vegetarian' | 'vegan' | 'low_carb' | 'high_protein' | 'healthier_choice' | 'gluten_free'>;
  healthier_alternative: string;
  ordering_tips: string[];
  description: string;
  image_keyword: string;
}

export interface UserProfile {
  name: string;
  onboarded: boolean;
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg?: number;
  goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'build_muscle';
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  dietary_preferences: string[];
  health_conditions: string[];
  allergies: string[];
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_sodium_mg: number;
  target_sugar_g: number;
  water_target_ml: number;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dish_id: string;
  dish_name: string;
  name_local?: string;
  portion_size: 'small' | 'regular' | 'large' | 'custom';
  portion_multiplier: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  sugar_g: number;
  photo_url?: string;
  healthier_alternative?: string;
  notes?: string;
  created_at: string;
}

export interface DailySummary {
  date: string;
  entries: FoodLogEntry[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodium_mg: number;
    sugar_g: number;
  };
  targets: {
    target_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
    target_sodium_mg: number;
    target_sugar_g: number;
    water_target_ml: number;
  };
  remaining: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodium_mg: number;
    sugar_g: number;
  };
  water_ml: number;
}

export interface IngredientItem {
  ingredient: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
}

export interface VisionResult {
  dish_id?: string;
  dish_name: string;
  name_local?: string;
  confidence: number;
  category: string;
  estimated_portion_size: string;
  portion_multiplier: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  sugar_g: number;
  healthier_alternative: string;
  ingredients_breakdown?: IngredientItem[];
  alternative_dishes_if_uncertain: Array<{
    dish_id: string;
    dish_name: string;
    name_local: string;
    confidence: number;
    calories: number;
  }>;
  ai_notes: string;
  source: 'google_gemini' | 'claude_api' | 'smart_classifier';
}

export interface NextRecommendation {
  dish: HawkerDish;
  reasoning: string;
  tweak_summary: string;
}

export interface MealPlanMeal {
  breakfast: HawkerDish;
  lunch: HawkerDish;
  dinner: HawkerDish;
  snack?: HawkerDish;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}
