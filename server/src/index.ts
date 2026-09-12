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

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Generous body limit for base64 camera image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static uploads if needed
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Googoogaga - Singapore Hawker Food Nutrition API',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRouter);
app.use('/api/training', trainingRouter);
app.use('/api/food', foodRouter);
app.use('/api/vision', visionRouter);
app.use('/api/user', userRouter);
app.use('/api/logs', logsRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/plans', mealplanRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Googoogaga Hawker Nutrition Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🍲 Hawker dishes catalog loaded with 80+ authentic items.`);
});
