import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { HAWKER_DISHES, HawkerDish } from '../hawkerData.js';

export const recommendRouter = Router();

// GET /api/recommend/next?date=YYYY-MM-DD&meal_time=lunch
recommendRouter.get('/next', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const entries = db.getLogs(date);
  const user = db.getProfile();

  // Compute consumed
  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.protein_g, 0);
  const totalSodium = entries.reduce((s, e) => s + e.sodium_mg, 0);
  const totalSugar = entries.reduce((s, e) => s + e.sugar_g, 0);

  const remainingCalories = Math.max(0, user.target_calories - totalCalories);
  const remainingProtein = Math.max(0, user.target_protein_g - totalProtein);
  const remainingSodium = Math.max(0, user.target_sodium_mg - totalSodium);
  const remainingSugar = Math.max(0, user.target_sugar_g - totalSugar);

  // Determine current meal window if not provided
  let mealSlot = (req.query.meal_time as string);
  if (!mealSlot) {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 11) mealSlot = 'breakfast';
    else if (currentHour >= 11 && currentHour < 15) mealSlot = 'lunch';
    else if (currentHour >= 15 && currentHour < 18) mealSlot = 'snack';
    else if (currentHour >= 18 && currentHour < 22) mealSlot = 'dinner';
    else mealSlot = 'supper';
  }

  // Filter candidates based on dietary restrictions
  let candidates = HAWKER_DISHES.filter(dish => {
    // Check dietary preferences
    if (user.dietary_preferences.includes('halal') && !dish.dietary_flags.includes('halal')) return false;
    if (user.dietary_preferences.includes('vegetarian') && !dish.dietary_flags.includes('vegetarian') && !dish.dietary_flags.includes('vegan')) return false;
    if (user.dietary_preferences.includes('vegan') && !dish.dietary_flags.includes('vegan')) return false;
    if (user.dietary_preferences.includes('low_carb') && dish.carbs_g > 40) return false;
    
    // Health caps: avoid dishes blowing remaining sodium or sugar excessively
    if (user.health_conditions.includes('hypertension') && dish.sodium_mg > 1200 && remainingSodium < 800) return false;
    if (user.health_conditions.includes('diabetes') && dish.sugar_g > 15) return false;

    return true;
  });

  // Filter for meal category appropriateness
  if (mealSlot === 'breakfast') {
    candidates = candidates.filter(d => 
      ['Kaya Toast', 'Thosai', 'Porridge', 'Fishball', 'Chee Cheong Fun', 'Eggs', 'Kopi', 'Teh', 'Dim Sum'].some(k => 
        d.name_en.includes(k) || d.category === 'Dim Sum' || d.category === 'Drinks'
      )
    );
  } else if (mealSlot === 'snack') {
    candidates = candidates.filter(d => d.category === 'Snacks' || d.category === 'Drinks' || d.category === 'Dim Sum' || d.calories < 350);
  }

  // If filtered set is too small, relax back to broader candidates under remaining calories
  if (candidates.length < 3) {
    candidates = HAWKER_DISHES;
  }

  // Score dishes:
  // 1. Fits within remaining budget (or close to it)
  // 2. High protein if protein gap is high
  // 3. Healthier choice bonus
  const scored = candidates.map(dish => {
    let score = 50;

    // Calorie fit score
    const calDiff = dish.calories - remainingCalories;
    if (calDiff <= 0) {
      score += 30; // perfectly within budget
    } else if (calDiff <= 120) {
      score += 10; // slightly over but manageable
    } else {
      score -= Math.min(40, (calDiff / 10)); // penalize excessive calories
    }

    // Protein contribution
    if (remainingProtein > 20) {
      score += (dish.protein_g / 2); // reward high protein dishes
    }

    // Healthier choice flag
    if (dish.dietary_flags.includes('healthier_choice')) {
      score += 15;
    }

    // Sugar / Sodium penalties if user has health condition
    if (user.health_conditions.includes('diabetes')) {
      score -= dish.sugar_g * 2;
    }
    if (user.health_conditions.includes('hypertension')) {
      score -= (dish.sodium_mg / 100);
    }

    return { dish, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick top 4 distinct dishes
  const topRecommendations = scored.slice(0, 4).map(({ dish }) => {
    let reasoning = `Fits well in your remaining budget (${remainingCalories} kcal left). Provides ${dish.protein_g}g protein.`;
    if (dish.dietary_flags.includes('healthier_choice')) {
      reasoning = `HPB-friendly healthier choice! Provides ${dish.protein_g}g protein with only ${dish.fat_g}g fat.`;
    } else if (dish.protein_g >= 25) {
      reasoning = `High protein boost (+${dish.protein_g}g) to hit your daily goal while leaving ${(remainingCalories - dish.calories) > 0 ? (remainingCalories - dish.calories) + ' kcal remaining' : 'you right on target'}.`;
    }

    return {
      dish,
      reasoning,
      tweak_summary: dish.healthier_alternative
    };
  });

  res.json({
    mealSlot,
    remainingBudget: {
      calories: remainingCalories,
      protein_g: remainingProtein,
      sodium_mg: remainingSodium,
      sugar_g: remainingSugar
    },
    recommendations: topRecommendations
  });
});

// GET /api/recommend/swaps?dish_id=...
recommendRouter.get('/swaps', (req: Request, res: Response) => {
  const dishId = req.query.dish_id as string;
  const targetDish = HAWKER_DISHES.find(d => d.id === dishId) || HAWKER_DISHES[0];

  // Suggest 2 lower-calorie / lower-sodium healthier swaps in same or related category
  const swaps = HAWKER_DISHES.filter(d => 
    d.id !== targetDish.id &&
    d.category === targetDish.category &&
    (d.calories < targetDish.calories || d.sodium_mg < targetDish.sodium_mg || d.sugar_g < targetDish.sugar_g)
  ).slice(0, 2);

  res.json({
    currentDish: targetDish,
    healthier_tweak: targetDish.healthier_alternative,
    ordering_tips: targetDish.ordering_tips,
    suggestedSwaps: swaps
  });
});
