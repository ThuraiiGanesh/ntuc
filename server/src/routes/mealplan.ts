import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { HAWKER_DISHES, HawkerDish } from '../hawkerData.js';

export const mealplanRouter = Router();

function filterAllowedDishes(user: any): HawkerDish[] {
  return HAWKER_DISHES.filter(dish => {
    if (user.dietary_preferences.includes('halal') && !dish.dietary_flags.includes('halal')) return false;
    if (user.dietary_preferences.includes('vegetarian') && !dish.dietary_flags.includes('vegetarian') && !dish.dietary_flags.includes('vegan')) return false;
    if (user.dietary_preferences.includes('vegan') && !dish.dietary_flags.includes('vegan')) return false;
    if (user.dietary_preferences.includes('low_carb') && dish.carbs_g > 45) return false;
    if (user.health_conditions.includes('diabetes') && dish.sugar_g > 12) return false;
    return true;
  });
}

function getRandomItem(items: HawkerDish[]): HawkerDish {
  return items[Math.floor(Math.random() * items.length)];
}

function generateDayPlan(targetCalories: number, allowedDishes: HawkerDish[], usedDishIds: Set<string> = new Set()) {
  // Breakfast: ~22% of calories
  // Lunch: ~38% of calories
  // Dinner: ~32% of calories
  // Snack/Drink: ~8% of calories
  const bgtBreakfast = targetCalories * 0.25;
  const bgtLunch = targetCalories * 0.40;
  const bgtDinner = targetCalories * 0.35;

  const breakfasts = allowedDishes.filter(d => 
    !usedDishIds.has(d.id) &&
    (d.name_en.includes('Toast') || d.name_en.includes('Thosai') || d.name_en.includes('Porridge') || d.name_en.includes('Fishball') || d.name_en.includes('Chee Cheong') || d.category === 'Dim Sum')
  );
  const pickedBreakfast = breakfasts.length > 0 ? getRandomItem(breakfasts) : allowedDishes[0];
  usedDishIds.add(pickedBreakfast.id);

  const lunches = allowedDishes.filter(d => 
    !usedDishIds.has(d.id) &&
    d.category !== 'Drinks' && d.category !== 'Snacks' && d.calories >= 400 && d.calories <= bgtLunch + 150
  );
  const pickedLunch = lunches.length > 0 ? getRandomItem(lunches) : allowedDishes[1];
  usedDishIds.add(pickedLunch.id);

  const dinners = allowedDishes.filter(d => 
    !usedDishIds.has(d.id) &&
    d.category !== 'Drinks' && d.category !== 'Snacks' && d.category !== pickedLunch.category // rotate cuisine!
  );
  const pickedDinner = dinners.length > 0 ? getRandomItem(dinners) : (allowedDishes.find(d => !usedDishIds.has(d.id)) || allowedDishes[2]);
  usedDishIds.add(pickedDinner.id);

  const snacks = allowedDishes.filter(d => 
    !usedDishIds.has(d.id) &&
    (d.category === 'Drinks' || d.category === 'Snacks' || d.calories < 250)
  );
  const pickedSnack = snacks.length > 0 ? getRandomItem(snacks) : allowedDishes[3];

  const totalCalories = pickedBreakfast.calories + pickedLunch.calories + pickedDinner.calories + (pickedSnack?.calories || 0);
  const totalProtein = pickedBreakfast.protein_g + pickedLunch.protein_g + pickedDinner.protein_g + (pickedSnack?.protein_g || 0);
  const totalCarbs = pickedBreakfast.carbs_g + pickedLunch.carbs_g + pickedDinner.carbs_g + (pickedSnack?.carbs_g || 0);
  const totalFat = pickedBreakfast.fat_g + pickedLunch.fat_g + pickedDinner.fat_g + (pickedSnack?.fat_g || 0);

  return {
    breakfast: pickedBreakfast,
    lunch: pickedLunch,
    dinner: pickedDinner,
    snack: pickedSnack,
    total_calories: totalCalories,
    total_protein_g: totalProtein,
    total_carbs_g: totalCarbs,
    total_fat_g: totalFat
  };
}

// GET /api/plans/daily
mealplanRouter.get('/daily', (_req: Request, res: Response) => {
  const user = db.getProfile();
  const allowed = filterAllowedDishes(user);
  const plan = generateDayPlan(user.target_calories, allowed);

  res.json({
    target_calories: user.target_calories,
    plan
  });
});

// GET /api/plans/weekly
mealplanRouter.get('/weekly', (_req: Request, res: Response) => {
  const user = db.getProfile();
  const allowed = filterAllowedDishes(user);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const weeklyPlan = daysOfWeek.map((dayName, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    
    // Create new pool for each day to avoid repeating dishes on consecutive days
    const dayPlan = generateDayPlan(user.target_calories, allowed);
    return {
      day_name: dayName,
      date: dateStr,
      ...dayPlan
    };
  });

  res.json({
    target_calories: user.target_calories,
    weeklyPlan
  });
});

// GET /api/plans/swap?meal_type=lunch&category=Malay
mealplanRouter.get('/swap', (req: Request, res: Response) => {
  const user = db.getProfile();
  const { meal_type, exclude_id } = req.query;
  const allowed = filterAllowedDishes(user);

  let candidates = allowed.filter(d => d.id !== exclude_id);
  if (meal_type === 'breakfast') {
    candidates = candidates.filter(d => d.category === 'Dim Sum' || d.category === 'Chinese' || d.category === 'Indian');
  } else if (meal_type === 'snack') {
    candidates = candidates.filter(d => d.category === 'Drinks' || d.category === 'Snacks' || d.calories < 300);
  } else {
    candidates = candidates.filter(d => d.category !== 'Drinks' && d.category !== 'Snacks');
  }

  const swapped = candidates.length > 0 ? getRandomItem(candidates) : allowed[0];
  res.json({ swappedDish: swapped });
});
