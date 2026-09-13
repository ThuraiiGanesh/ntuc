/**
 * Client-side Gemini Vision Service
 * Uses @google/genai (v2) which fully supports both AIzaSy... and AQ.Ab8... key formats.
 * Calls Google Gemini API directly from the browser — no server env vars needed.
 */

import { GoogleGenAI } from '@google/genai';
import { VisionResult } from '../types';
import { HAWKER_DISHES } from '../data/hawkerData';
import { getCuratedIngredientsForDish } from './api';

const SYSTEM_INSTRUCTION = `You are an expert Singapore hawker food nutritionist and culinary vision AI.
Your task: Analyze the food photo and identify the Singapore hawker dish.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "dish_name": "English dish name",
  "name_local": "Local language name e.g. 海南鸡饭",
  "confidence": 0.95,
  "category": "Chinese",
  "estimated_portion_size": "1 plate (~450g)",
  "portion_multiplier": 1.0,
  "calories": 490,
  "protein_g": 28,
  "carbs_g": 55,
  "fat_g": 19,
  "sodium_mg": 820,
  "sugar_g": 3,
  "oiliness_level": "moderate",
  "oiliness_score": 3,
  "oil_sheen_detected": true,
  "oil_delta_fat_g": 0,
  "oil_notes": "Standard hawker wok oil level with moderate surface sheen.",
  "healthier_alternative": "Ask for less rice, steamed chicken instead of roasted",
  "ingredients_breakdown": [
    {
      "ingredient": "Ingredient name",
      "estimated_weight_g": 130,
      "calories": 270,
      "protein_g": 24,
      "carbs_g": 0,
      "fat_g": 18,
      "notes": "Description"
    }
  ],
  "alternative_dishes_if_uncertain": [
    {
      "dish_name": "Alternative dish",
      "name_local": "本地名",
      "confidence": 0.25,
      "calories": 400
    }
  ],
  "ai_notes": "Brief notes about what was identified and key nutritional highlights."
}

category must be one of: "Chinese", "Malay", "Indian", "Western", "Drinks", "Dim Sum", "Peranakan", "Snacks"
oiliness_level must be one of: "light", "moderate", "oily", "very_oily"`;

export async function identifyFoodWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  apiKey: string
): Promise<VisionResult> {
  const ai = new GoogleGenAI({ apiKey });

  // Strip data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/, '');

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.6-flash'];
  let lastErr: any = null;
  let responseText = '';

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: (mimeType || 'image/jpeg') as any,
                  data: cleanBase64
                }
              },
              {
                text: SYSTEM_INSTRUCTION + '\n\nAnalyze this Singapore hawker food photo. Identify the dish, decompose all visible ingredients with estimated gram weights, and calculate nutrition.'
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      });
      responseText = response.text ?? '';
      if (responseText) break;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${modelName} failed:`, err?.message || err);
    }
  }

  if (!responseText) {
    throw lastErr || new Error('No response received from Gemini Vision models');
  }

  // Parse the JSON response
  let parsed: any;
  try {
    // Handle cases where model wraps in code block despite instruction
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    throw new Error('Gemini returned invalid JSON: ' + responseText.slice(0, 200));
  }

  // Try to match against local hawker catalog for dish_id linkage
  const dishName = (parsed.dish_name || '').toLowerCase();
  const matchedLocal = HAWKER_DISHES.find(d =>
    dishName.includes(d.name_en.toLowerCase()) ||
    d.name_en.toLowerCase().includes(dishName) ||
    d.aliases.some(a => dishName.includes(a.toLowerCase())) ||
    (parsed.name_local && d.name_local.includes(parsed.name_local))
  ) || null;

  const ingredients = parsed.ingredients_breakdown && parsed.ingredients_breakdown.length > 0
    ? parsed.ingredients_breakdown
    : matchedLocal
      ? getCuratedIngredientsForDish(matchedLocal)
      : [];

  const alternativeDishes = (parsed.alternative_dishes_if_uncertain || []).map((alt: any) => {
    const altMatch = HAWKER_DISHES.find(d =>
      (alt.dish_name || '').toLowerCase().includes(d.name_en.toLowerCase()) ||
      d.name_en.toLowerCase().includes((alt.dish_name || '').toLowerCase())
    );
    return {
      dish_id: altMatch?.id || 'unknown',
      dish_name: alt.dish_name || '',
      name_local: alt.name_local || '',
      confidence: alt.confidence || 0.2,
      calories: alt.calories || 0
    };
  });

  return {
    dish_id: matchedLocal?.id || 'custom-ai',
    dish_name: parsed.dish_name || 'Singapore Hawker Dish',
    name_local: parsed.name_local || '',
    confidence: parsed.confidence || 0.85,
    category: parsed.category || (matchedLocal?.category) || 'Chinese',
    estimated_portion_size: parsed.estimated_portion_size || '1 portion',
    portion_multiplier: parsed.portion_multiplier || 1.0,
    calories: parsed.calories || matchedLocal?.calories || 400,
    protein_g: parsed.protein_g || matchedLocal?.protein_g || 20,
    carbs_g: parsed.carbs_g || matchedLocal?.carbs_g || 50,
    fat_g: parsed.fat_g || matchedLocal?.fat_g || 15,
    sodium_mg: parsed.sodium_mg || matchedLocal?.sodium_mg || 800,
    sugar_g: parsed.sugar_g || matchedLocal?.sugar_g || 5,
    oiliness_level: parsed.oiliness_level || 'moderate',
    oiliness_score: parsed.oiliness_score || 3,
    oil_sheen_detected: parsed.oil_sheen_detected ?? true,
    oil_delta_fat_g: parsed.oil_delta_fat_g || 0,
    oil_notes: parsed.oil_notes || 'Standard hawker preparation.',
    healthier_alternative: parsed.healthier_alternative || matchedLocal?.healthier_alternative || 'Opt for less oil and more vegetables',
    ingredients_breakdown: ingredients,
    alternative_dishes_if_uncertain: alternativeDishes,
    ai_notes: parsed.ai_notes || `Identified by Gemini Vision AI.`,
    source: 'google_gemini'
  };
}

/**
 * Check if a Gemini API key is stored in localStorage
 */
export function getStoredGeminiKey(): string | null {
  try {
    return typeof window !== 'undefined'
      ? localStorage.getItem('hawker_gemini_api_key')
      : null;
  } catch {
    return null;
  }
}

/**
 * Check if VITE_GEMINI_API_KEY env var is available (baked in at Vercel build time)
 */
export function getEnvGeminiKey(): string | null {
  try {
    const k = (import.meta as any).env?.VITE_GEMINI_API_KEY as string;
    return k && k.trim() ? k.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Returns the best available Gemini API key.
 * Priority: user's saved key in Settings → VITE_GEMINI_API_KEY env var (Vercel)
 */
export function getBestGeminiKey(): string | null {
  return getStoredGeminiKey() || getEnvGeminiKey();
}

