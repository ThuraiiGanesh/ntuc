import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { foodRouter } from './routes/food.js';
import { visionRouter } from './routes/vision.js';
import { userRouter } from './routes/user.js';
import { logsRouter } from './routes/logs.js';
import { recommendRouter } from './routes/recommend.js';
import { mealplanRouter } from './routes/mealplan.js';
import { authRouter } from './routes/auth.js';
import { trainingRouter } from './routes/training.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Generous body limit for base64 camera image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check endpoints (both /api/health and /health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    app: 'Googoogaga - Singapore Hawker Food Nutrition API',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone'
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount modular API routes with both /api prefix and root prefix
// so Vercel function rewrites work whether the path retains /api or strips it.
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/training', trainingRouter);
app.use('/training', trainingRouter);

app.use('/api/food', foodRouter);
app.use('/food', foodRouter);

app.use('/api/vision', visionRouter);
app.use('/vision', visionRouter);

app.use('/api/user', userRouter);
app.use('/user', userRouter);

app.use('/api/logs', logsRouter);
app.use('/logs', logsRouter);

app.use('/api/recommend', recommendRouter);
app.use('/recommend', recommendRouter);

app.use('/api/plans', mealplanRouter);
app.use('/plans', mealplanRouter);

export default app;
