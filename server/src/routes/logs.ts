import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { getAuthUserId } from './auth.js';

export const logsRouter = Router();

// GET /api/logs/daily?date=YYYY-MM-DD
logsRouter.get('/daily', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const dateQuery = req.query.date;
  const date = (typeof dateQuery === 'string' ? dateQuery : undefined) || new Date().toISOString().split('T')[0];
  const entries = db.getLogs(date, userId);
  const user = db.getProfile(userId);
  const water_ml = db.getWater(date, userId);

  // Compute daily totals
  const totals = entries.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein_g: acc.protein_g + item.protein_g,
      carbs_g: acc.carbs_g + item.carbs_g,
      fat_g: acc.fat_g + item.fat_g,
      sodium_mg: acc.sodium_mg + item.sodium_mg,
      sugar_g: acc.sugar_g + item.sugar_g
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0, sugar_g: 0 }
  );

  const remaining = {
    calories: Math.max(0, user.target_calories - totals.calories),
    protein_g: Math.max(0, user.target_protein_g - totals.protein_g),
    carbs_g: Math.max(0, user.target_carbs_g - totals.carbs_g),
    fat_g: Math.max(0, user.target_fat_g - totals.fat_g),
    sodium_mg: Math.max(0, user.target_sodium_mg - totals.sodium_mg),
    sugar_g: Math.max(0, user.target_sugar_g - totals.sugar_g)
  };

  res.json({
    date,
    entries,
    totals,
    targets: {
      target_calories: user.target_calories,
      target_protein_g: user.target_protein_g,
      target_carbs_g: user.target_carbs_g,
      target_fat_g: user.target_fat_g,
      target_sodium_mg: user.target_sodium_mg,
      target_sugar_g: user.target_sugar_g,
      water_target_ml: user.water_target_ml
    },
    remaining,
    water_ml
  });
});

// POST /api/logs/daily
logsRouter.post('/daily', (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const entry = db.addLog({
      ...req.body,
      user_id: userId
    });
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to add log entry', details: error.message });
  }
});

// PUT /api/logs/daily/:id
logsRouter.put('/daily/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const logId = String(req.params.id);
  const updated = db.updateLog(logId, req.body, userId);
  if (!updated) {
    res.status(404).json({ error: 'Log entry not found' });
    return;
  }
  res.json(updated);
});

// DELETE /api/logs/daily/:id
logsRouter.delete('/daily/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const logId = String(req.params.id);
  const success = db.deleteLog(logId, userId);
  if (!success) {
    res.status(404).json({ error: 'Log entry not found' });
    return;
  }
  res.json({ message: 'Entry deleted' });
});

// POST /api/logs/water
logsRouter.post('/water', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { date, amount_ml } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const newAmount = db.addWater(targetDate, amount_ml || 250, userId);
  res.json({ date: targetDate, water_ml: newAmount });
});

// GET /api/logs/weekly
logsRouter.get('/weekly', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const user = db.getProfile(userId);
  const allLogs = db.getRecentLogs(7, userId);

  // Group by date for the last 7 days
  const days: Record<string, { calories: number; protein_g: number; carbs_g: number; fat_g: number; date: string; day_name: string }> = {};
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    days[dateStr] = {
      date: dateStr,
      day_name: dayName,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    };
  }

  allLogs.forEach(entry => {
    if (days[entry.date]) {
      days[entry.date].calories += entry.calories;
      days[entry.date].protein_g += entry.protein_g;
      days[entry.date].carbs_g += entry.carbs_g;
      days[entry.date].fat_g += entry.fat_g;
    }
  });

  const dailyHistory = Object.values(days);
  const avgCalories = Math.round(dailyHistory.reduce((acc, d) => acc + d.calories, 0) / 7);
  const avgProtein = Math.round(dailyHistory.reduce((acc, d) => acc + d.protein_g, 0) / 7);
  const avgCarbs = Math.round(dailyHistory.reduce((acc, d) => acc + d.carbs_g, 0) / 7);
  const avgFat = Math.round(dailyHistory.reduce((acc, d) => acc + d.fat_g, 0) / 7);

  res.json({
    dailyHistory,
    target_calories: user.target_calories,
    averages: {
      calories: avgCalories,
      protein_g: avgProtein,
      carbs_g: avgCarbs,
      fat_g: avgFat
    },
    weight_logs: db.getWeights(userId),
    adherence_streak_days: Math.max(1, entriesCount(dailyHistory))
  });
});

function entriesCount(days: any[]): number {
  return days.filter(d => d.calories > 0).length;
}

// POST /api/logs/weight
logsRouter.post('/weight', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { date, weight_kg } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const entry = db.addWeight(targetDate, Number(weight_kg), userId);
  res.json(entry);
});
