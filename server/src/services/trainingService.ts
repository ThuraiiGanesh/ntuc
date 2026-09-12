import fs from 'fs';
import path from 'path';
import { db, TrainingSample } from '../db.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const TRAINING_DIR = path.join(UPLOADS_DIR, 'training');

if (!fs.existsSync(TRAINING_DIR)) {
  fs.mkdirSync(TRAINING_DIR, { recursive: true });
}

export interface IngestSampleParams {
  userId?: string;
  imageBase64?: string;
  photoUrl?: string;
  dishId: string;
  dishName: string;
  category?: string;
  confidence?: number;
  userConfirmed?: boolean;
  userCorrected?: boolean;
  originalPrediction?: string;
  ingredientsBreakdown?: any[];
  portionMultiplier?: number;
}

export class TrainingService {
  /**
   * Save food photo to disk and record verified training sample in SQLite database
   */
  async ingestSample(params: IngestSampleParams): Promise<TrainingSample> {
    const id = `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let imagePath = params.photoUrl || '';

    // If base64 provided, persist the image file to disk in training dataset folder
    if (params.imageBase64 && params.imageBase64.startsWith('data:image')) {
      try {
        const matches = params.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const filename = `${id}.${ext}`;
          const filePath = path.join(TRAINING_DIR, filename);
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          imagePath = `/uploads/training/${filename}`;
        }
      } catch (err) {
        console.warn('Failed to save training image file to disk:', err);
      }
    }

    const sample = db.addTrainingSample({
      id,
      user_id: params.userId,
      image_path: imagePath,
      dish_id: params.dishId,
      dish_name: params.dishName,
      category: params.category || 'Hawker',
      confidence: params.confidence || 0.95,
      user_confirmed: params.userConfirmed === false ? 0 : 1,
      user_corrected: params.userCorrected ? 1 : 0,
      original_prediction: params.originalPrediction || params.dishName,
      ingredients_json: JSON.stringify(params.ingredientsBreakdown || []),
      portion_multiplier: params.portionMultiplier || 1.0
    });

    return sample;
  }

  /**
   * Continuous Learning Context: Get verified hawker training cues & learned corrections
   * to inject directly into the Vision prompt
   */
  getContinuousLearningPromptContext(): string {
    const samples = db.getTrainingSamples(15);
    if (!samples.length) return '';

    const lines: string[] = [
      'CONTINUOUS TRAINING KNOWLEDGE & LEARNED HAWKER SAMPLES (Verified by Singapore Users):'
    ];

    // Group samples by dish
    const corrections = samples.filter(s => s.user_corrected === 1);
    if (corrections.length > 0) {
      lines.push('Learned User Corrections (Watch out for these common visual confusions):');
      corrections.slice(0, 5).forEach(c => {
        lines.push(`- Corrected from "${c.original_prediction}" to authentic dish: "${c.dish_name}" (Category: ${c.category})`);
      });
    }

    const verified = samples.filter(s => s.user_confirmed === 1 && s.user_corrected === 0);
    if (verified.length > 0) {
      lines.push('Recently Confirmed Real-World Hawker Dishes:');
      verified.slice(0, 6).forEach(v => {
        let ingSummary = '';
        try {
          const ing = JSON.parse(v.ingredients_json || '[]');
          if (ing.length) {
            ingSummary = ` with [${ing.map((i: any) => i.ingredient).slice(0, 3).join(', ')}]`;
          }
        } catch {}
        lines.push(`- "${v.dish_name}" (${v.category})${ingSummary}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Export training dataset in JSONL format for Vertex AI / Gemini Fine-Tuning
   */
  exportFineTuningJSONL(): string {
    const samples = db.getTrainingSamples(500);
    return samples.map(s => {
      let ingredients = [];
      try { ingredients = JSON.parse(s.ingredients_json || '[]'); } catch {}

      return JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert Singapore hawker food culinary vision classifier.' },
          { role: 'user', content: `Identify the Singapore hawker dish in this photo (${s.image_path || s.dish_name}).` },
          {
            role: 'model',
            content: JSON.stringify({
              dish_name: s.dish_name,
              category: s.category,
              confidence: s.confidence,
              ingredients_breakdown: ingredients
            })
          }
        ]
      });
    }).join('\n');
  }

  getStats() {
    return db.getTrainingStats();
  }
}

export const trainingService = new TrainingService();
