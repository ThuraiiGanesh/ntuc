import { Router, Request, Response } from 'express';
import { db, hashPassword, verifyPassword, generateToken, verifyToken } from '../db.js';

export const authRouter = Router();

export const DEMO_USER_ID = 'demo-user-singapore-2026';

// Helper to extract authenticated user from header
export function getAuthUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    if (userId) return userId;
  }
  return DEMO_USER_ID;
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = db.createUser({
      id: userId,
      email,
      name,
      password_hash: hash,
      salt,
      created_at: new Date().toISOString()
    });

    const token = generateToken(user.id);
    const profile = db.getProfile(user.id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      profile
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account.', details: error.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = verifyPassword(password, user.password_hash, user.salt);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user.id);
    const profile = db.getProfile(user.id);

    res.json({
      message: 'Welcome back!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      profile
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in.', details: error.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const user = db.getUserById(userId);

    if (!user) {
      // Return demo user if token absent
      const demo = db.getUserById(DEMO_USER_ID);
      const profile = db.getProfile(DEMO_USER_ID);
      res.json({
        authenticated: false,
        user: demo ? { id: demo.id, email: demo.email, name: demo.name } : null,
        profile
      });
      return;
    }

    const profile = db.getProfile(user.id);
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      profile
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile', details: error.message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Signed out successfully.' });
});
