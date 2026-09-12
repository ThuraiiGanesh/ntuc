import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { getAuthUserId } from './auth.js';

export const userRouter = Router();

// GET /api/user/profile
userRouter.get('/profile', (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const profile = db.getProfile(userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile', details: error.message });
  }
});

// POST /api/user/profile
userRouter.post('/profile', (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const updated = db.updateProfile(req.body, userId);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update profile', details: error.message });
  }
});

// POST /api/user/reset
userRouter.post('/reset', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const result = db.resetData(userId);
  res.json({ message: 'Database reset to initial demo state', profile: result.profile });
});
