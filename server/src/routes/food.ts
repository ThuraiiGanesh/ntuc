import { Router, Request, Response } from 'express';
import { HAWKER_DISHES, searchDishes, getDishesByCategory, getDishById } from '../hawkerData.js';

export const foodRouter = Router();

// GET /api/food/dishes
foodRouter.get('/dishes', (req: Request, res: Response) => {
  const { query, category, diet } = req.query;

  let results = HAWKER_DISHES;

  if (query && typeof query === 'string') {
    results = searchDishes(query);
  }

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  if (diet && typeof diet === 'string' && diet !== 'all') {
    results = results.filter(d => d.dietary_flags.includes(diet as any));
  }

  res.json({
    count: results.length,
    dishes: results
  });
});

// GET /api/food/dishes/:id
foodRouter.get('/dishes/:id', (req: Request, res: Response) => {
  const dish = getDishById(String(req.params.id));
  if (!dish) {
    res.status(404).json({ error: 'Dish not found' });
    return;
  }
  res.json(dish);
});
