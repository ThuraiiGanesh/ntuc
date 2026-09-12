export interface UserProfileInput {
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
}

export interface NutritionTargets {
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

export function calculateNutritionTargets(input: UserProfileInput): NutritionTargets {
  const { age, sex, height_cm, current_weight_kg, goal, activity_level, health_conditions } = input;

  // 1. Mifflin-St Jeor Equation for BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  bmr = Math.round(bmr);

  // 2. Activity Multiplier for TDEE
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725
  };
  const multiplier = multipliers[activity_level] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment
  let target_calories = tdee;
  if (goal === 'lose_weight') {
    target_calories = Math.max(1200, tdee - 500); // safe minimum 1200 kcal
  } else if (goal === 'gain_weight') {
    target_calories = tdee + 350;
  } else if (goal === 'build_muscle') {
    target_calories = tdee + 450;
  }

  // 4. Macro Targets
  // Protein: g per kg of body weight
  let proteinPerKg = 1.6;
  if (goal === 'build_muscle') proteinPerKg = 2.0;
  if (goal === 'lose_weight') proteinPerKg = 1.8; // spare muscle during deficit
  if (health_conditions.includes('kidney_condition')) proteinPerKg = 0.8; // renal restriction

  const target_protein_g = Math.round(current_weight_kg * proteinPerKg);
  const protein_calories = target_protein_g * 4;

  // Fat: 28% of total calories
  const fat_calories = target_calories * 0.28;
  const target_fat_g = Math.round(fat_calories / 9);

  // Carbs: Remaining calories
  const remaining_calories = Math.max(0, target_calories - protein_calories - fat_calories);
  let target_carbs_g = Math.round(remaining_calories / 4);

  // Adjust for diabetes/pre-diabetes if selected
  const hasDiabetes = health_conditions.includes('diabetes') || health_conditions.includes('pre_diabetes');
  if (hasDiabetes && target_carbs_g > 180) {
    target_carbs_g = 180; // moderate carb constraint
  }

  // 5. Sodium Cap (mg)
  // Standard Singapore HPB recommendation: 2000mg. Hypertension: 1500mg.
  let target_sodium_mg = 2000;
  if (health_conditions.includes('hypertension') || health_conditions.includes('kidney_condition')) {
    target_sodium_mg = 1500;
  }

  // 6. Sugar Cap (g)
  // Standard WHO / HPB: <10% calories (~50g), ideally <25g. Diabetes: <25g.
  let target_sugar_g = 35;
  if (hasDiabetes) {
    target_sugar_g = 20;
  }

  // 7. Water target (ml)
  const water_target_ml = Math.round(current_weight_kg * 35); // 35ml/kg

  return {
    bmr,
    tdee,
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    target_sodium_mg,
    target_sugar_g,
    water_target_ml
  };
}
