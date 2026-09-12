import { Router, Request, Response } from 'express';
import { identifyWithGoogleGemini } from '../services/geminiVision.js';
import { identifyHawkerDish } from '../services/claudeVision.js';

export const visionRouter = Router();

// POST /api/vision/identify
// Body: { imageBase64: string, sampleDishId?: string, modelProvider?: 'gemini' | 'claude', customApiKey?: string, mimeType?: string }
visionRouter.post('/identify', async (req: Request, res: Response) => {
  try {
    const { imageBase64, sampleDishId, modelProvider = 'gemini', customApiKey, mimeType } = req.body;

    if (!imageBase64 && !sampleDishId) {
      res.status(400).json({ error: 'Either imageBase64 or sampleDishId is required.' });
      return;
    }

    let result;
    if (modelProvider === 'claude') {
      result = await identifyHawkerDish(
        imageBase64 || '',
        mimeType || 'image/jpeg',
        sampleDishId,
        customApiKey
      );
    } else {
      // Default to Google Gemini model for deep ingredient breakdown
      result = await identifyWithGoogleGemini(
        imageBase64 || '',
        mimeType || 'image/jpeg',
        sampleDishId,
        customApiKey
      );
    }

    res.json(result);
  } catch (error: any) {
    console.error('Vision identification error:', error);
    res.status(500).json({ error: 'Failed to process food image', details: error.message });
  }
});
