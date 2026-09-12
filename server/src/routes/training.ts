import { Router, Request, Response } from 'express';
import { trainingService } from '../services/trainingService.js';
import { getAuthUserId } from './auth.js';

export const trainingRouter = Router();

// GET /api/training/stats
trainingRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = trainingService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve training stats', details: error.message });
  }
});

// POST /api/training/feedback
// Called when user confirms or corrects a food scan to improve the model
trainingRouter.post('/feedback', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const {
      imageBase64,
      photoUrl,
      dishId,
      dishName,
      category,
      confidence,
      userConfirmed = true,
      userCorrected = false,
      originalPrediction,
      ingredientsBreakdown,
      portionMultiplier
    } = req.body;

    if (!dishName) {
      res.status(400).json({ error: 'dishName is required for training feedback' });
      return;
    }

    const sample = await trainingService.ingestSample({
      userId,
      imageBase64,
      photoUrl,
      dishId: dishId || 'custom-dish',
      dishName,
      category,
      confidence,
      userConfirmed,
      userCorrected,
      originalPrediction,
      ingredientsBreakdown,
      portionMultiplier
    });

    res.json({
      message: 'Training sample successfully recorded into continuous vision learning dataset!',
      sampleId: sample.id,
      modelImproved: true
    });
  } catch (error: any) {
    console.error('Training feedback error:', error);
    res.status(500).json({ error: 'Failed to save training sample', details: error.message });
  }
});

// GET /api/training/export
trainingRouter.get('/export', (_req: Request, res: Response) => {
  try {
    const jsonl = trainingService.exportFineTuningJSONL();
    res.setHeader('Content-Type', 'application/x-jsonlines');
    res.setHeader('Content-Disposition', 'attachment; filename="hawker_vision_training_dataset.jsonl"');
    res.send(jsonl);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export training dataset', details: error.message });
  }
});
