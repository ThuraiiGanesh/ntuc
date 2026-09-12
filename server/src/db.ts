import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { calculateNutritionTargets, NutritionTargets, UserProfileInput } from './services/nutritionCalc.js';
import { HAWKER_DISHES, HawkerDish } from './hawkerData.js';

export interface UserAccount {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  name: string;
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dish_id: string;
  dish_name: string;
  name_local?: string;
  portion_size: 'small' | 'regular' | 'large' | 'custom';
  portion_multiplier: number; // e.g. 1.0, 0.75, 1.3
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  sugar_g: number;
  photo_url?: string;
  healthier_alternative?: string;
  notes?: string;
  created_at: string;
}

export interface WeightLogEntry {
  id: string;
  user_id?: string;
  date: string;
  weight_kg: number;
  created_at?: string;
}

export interface UserProfile extends UserProfileInput, NutritionTargets {
  user_id?: string;
  name: string;
  email?: string;
  onboarded: boolean;
  updated_at: string;
}

export interface TrainingSample {
  id: string;
  user_id?: string;
  image_path?: string;
  dish_id: string;
  dish_name: string;
  category?: string;
  confidence?: number;
  user_confirmed: number; // 1 or 0
  user_corrected: number; // 1 or 0
  original_prediction?: string;
  ingredients_json?: string;
  portion_multiplier?: number;
  created_at: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hawker.db');

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

export function generateToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', 'hawker-secret-key-2026').update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', 'hawker-secret-key-2026').update(payload).digest('base64url');
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return data.userId || null;
  } catch {
    return null;
  }
}

class Database {
  private db: DatabaseSync;
  public static DEMO_USER_ID = 'demo-user-singapore-2026';

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = new DatabaseSync(DB_FILE);
    this.initSchema();
    this.seedDefaultData();
  }

  private initSchema() {
    // 1. Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        onboarded INTEGER DEFAULT 1,
        age INTEGER,
        sex TEXT,
        height_cm REAL,
        current_weight_kg REAL,
        target_weight_kg REAL,
        goal TEXT,
        activity_level TEXT,
        dietary_preferences TEXT,
        health_conditions TEXT,
        allergies TEXT,
        target_calories INTEGER,
        target_protein_g INTEGER,
        target_carbs_g INTEGER,
        target_fat_g INTEGER,
        target_sodium_mg INTEGER,
        target_sugar_g INTEGER,
        water_target_ml INTEGER,
        updated_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 3. Food Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        dish_id TEXT NOT NULL,
        dish_name TEXT NOT NULL,
        name_local TEXT,
        portion_size TEXT,
        portion_multiplier REAL DEFAULT 1.0,
        calories INTEGER,
        protein_g INTEGER,
        carbs_g INTEGER,
        fat_g INTEGER,
        sodium_mg INTEGER,
        sugar_g INTEGER,
        photo_url TEXT,
        healthier_alternative TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date);
    `);

    // 4. Water Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS water_logs (
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        amount_ml INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT,
        PRIMARY KEY (user_id, date)
      );
    `);

    // 5. Weight Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id, date);
    `);

    // 6. Continuous Vision Training Samples table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS training_samples (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        image_path TEXT,
        dish_id TEXT NOT NULL,
        dish_name TEXT NOT NULL,
        category TEXT,
        confidence REAL,
        user_confirmed INTEGER DEFAULT 1,
        user_corrected INTEGER DEFAULT 0,
        original_prediction TEXT,
        ingredients_json TEXT,
        portion_multiplier REAL DEFAULT 1.0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_training_dish ON training_samples(dish_id);
    `);
  }

  private seedDefaultData() {
    const demoUser = this.getUserByEmail('demo@hawker.sg');
    const today = new Date().toISOString().split('T')[0];

    if (!demoUser) {
      const { hash, salt } = hashPassword('hawker123');
      this.createUser({
        id: Database.DEMO_USER_ID,
        email: 'demo@hawker.sg',
        name: 'Singaporean Foodie',
        password_hash: hash,
        salt,
        created_at: new Date().toISOString()
      });

      // Seed initial profile
      const initialInput: UserProfileInput = {
        age: 29,
        sex: 'male',
        height_cm: 174,
        current_weight_kg: 72,
        target_weight_kg: 68,
        goal: 'lose_weight',
        activity_level: 'lightly_active',
        dietary_preferences: ['no_restriction'],
        health_conditions: [],
        allergies: []
      };
      const targets = calculateNutritionTargets(initialInput);
      this.saveProfile(Database.DEMO_USER_ID, {
        name: 'Singaporean Foodie',
        onboarded: true,
        ...initialInput,
        ...targets,
        updated_at: new Date().toISOString()
      });

      // Seed initial meals
      this.addLog({
        user_id: Database.DEMO_USER_ID,
        date: today,
        meal_type: 'breakfast',
        dish_id: 'kaya-toast-set',
        dish_name: 'Traditional Kaya Butter Toast Set',
        name_local: '咖椰面包及半生熟蛋套餐',
        portion_size: 'regular',
        portion_multiplier: 1.0,
        calories: 450,
        protein_g: 16,
        carbs_g: 52,
        fat_g: 19,
        sodium_mg: 580,
        sugar_g: 18,
        photo_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80',
        healthier_alternative: 'Scrape off excess butter slab and ask for Kopi-O Kosong to cut 18g sugar.',
        notes: 'Breakfast with Kopi-O Kosong at Maxwell Food Centre'
      });

      this.addLog({
        user_id: Database.DEMO_USER_ID,
        date: today,
        meal_type: 'lunch',
        dish_id: 'chicken-rice-steamed',
        dish_name: 'Hainanese Steamed Chicken Rice',
        name_local: '白鸡饭 (Bai Ji Fan)',
        portion_size: 'regular',
        portion_multiplier: 1.0,
        calories: 607,
        protein_g: 27,
        carbs_g: 65,
        fat_g: 23,
        sodium_mg: 980,
        sugar_g: 2,
        photo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
        healthier_alternative: 'Request steamed breast meat without skin, swap half the oily rice for plain rice.',
        notes: 'Lunch at Tian Tian Chicken Rice'
      });

      this.addWater(today, 1250, Database.DEMO_USER_ID);

      // Seed initial weight logs
      this.addWeight('2026-09-06', 72.8, Database.DEMO_USER_ID);
      this.addWeight('2026-09-08', 72.5, Database.DEMO_USER_ID);
      this.addWeight('2026-09-10', 72.2, Database.DEMO_USER_ID);
      this.addWeight(today, 72.0, Database.DEMO_USER_ID);

      // Seed some initial continuous training exemplars
      this.addTrainingSample({
        dish_id: 'chicken-rice-steamed',
        dish_name: 'Hainanese Steamed Chicken Rice',
        category: 'Chinese',
        confidence: 0.96,
        user_confirmed: 1,
        user_corrected: 0,
        ingredients_json: JSON.stringify([
          { ingredient: 'Poached chicken', estimated_weight_g: 130 },
          { ingredient: 'Oily rice', estimated_weight_g: 190 },
          { ingredient: 'Cucumber slices', estimated_weight_g: 30 }
        ])
      });
      this.addTrainingSample({
        dish_id: 'char-kway-teow',
        dish_name: 'Char Kway Teow',
        category: 'Chinese',
        confidence: 0.94,
        user_confirmed: 1,
        user_corrected: 0,
        ingredients_json: JSON.stringify([
          { ingredient: 'Flat rice noodles', estimated_weight_g: 200 },
          { ingredient: 'Chinese sausage (Lap Cheong)', estimated_weight_g: 35 },
          { ingredient: 'Cockles', estimated_weight_g: 25 },
          { ingredient: 'Crispy lard', estimated_weight_g: 15 }
        ])
      });
    }
  }

  // ----------------------------------------------------
  // USER AUTHENTICATION METHODS
  // ----------------------------------------------------
  createUser(account: UserAccount): UserAccount {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(account.id, account.email.toLowerCase(), account.password_hash, account.salt, account.name, account.created_at);

    // Also initialize a default profile
    const initialInput: UserProfileInput = {
      age: 28,
      sex: 'male',
      height_cm: 172,
      current_weight_kg: 70,
      target_weight_kg: 68,
      goal: 'maintain',
      activity_level: 'lightly_active',
      dietary_preferences: ['no_restriction'],
      health_conditions: [],
      allergies: []
    };
    const targets = calculateNutritionTargets(initialInput);
    this.saveProfile(account.id, {
      name: account.name,
      onboarded: true,
      ...initialInput,
      ...targets,
      updated_at: new Date().toISOString()
    });

    return account;
  }

  getUserByEmail(email: string): UserAccount | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email.toLowerCase()) as any;
    if (!row) return null;
    return row as UserAccount;
  }

  getUserById(id: string): UserAccount | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return row as UserAccount;
  }

  // ----------------------------------------------------
  // PROFILE METHODS
  // ----------------------------------------------------
  getProfile(userId: string = Database.DEMO_USER_ID): UserProfile {
    const stmt = this.db.prepare('SELECT * FROM profiles WHERE user_id = ?');
    const row = stmt.get(userId) as any;

    if (!row) {
      // Fallback: return demo profile or synthesize
      const demo = this.db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(Database.DEMO_USER_ID) as any;
      if (demo) return this.mapProfileRow(demo);
      throw new Error(`Profile not found for user ${userId}`);
    }

    return this.mapProfileRow(row);
  }

  private mapProfileRow(row: any): UserProfile {
    return {
      user_id: row.user_id,
      name: row.name,
      onboarded: Boolean(row.onboarded),
      age: row.age,
      sex: row.sex,
      height_cm: row.height_cm,
      current_weight_kg: row.current_weight_kg,
      target_weight_kg: row.target_weight_kg,
      goal: row.goal,
      activity_level: row.activity_level,
      dietary_preferences: row.dietary_preferences ? JSON.parse(row.dietary_preferences) : [],
      health_conditions: row.health_conditions ? JSON.parse(row.health_conditions) : [],
      allergies: row.allergies ? JSON.parse(row.allergies) : [],
      bmr: row.bmr || 1650,
      tdee: row.tdee || 2150,
      target_calories: row.target_calories,
      target_protein_g: row.target_protein_g,
      target_carbs_g: row.target_carbs_g,
      target_fat_g: row.target_fat_g,
      target_sodium_mg: row.target_sodium_mg,
      target_sugar_g: row.target_sugar_g,
      water_target_ml: row.water_target_ml || 2500,
      updated_at: row.updated_at
    };
  }

  saveProfile(userId: string, profile: UserProfile): UserProfile {
    const stmt = this.db.prepare(`
      INSERT INTO profiles (
        user_id, name, onboarded, age, sex, height_cm, current_weight_kg, target_weight_kg,
        goal, activity_level, dietary_preferences, health_conditions, allergies,
        target_calories, target_protein_g, target_carbs_g, target_fat_g,
        target_sodium_mg, target_sugar_g, water_target_ml, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        name = excluded.name,
        onboarded = excluded.onboarded,
        age = excluded.age,
        sex = excluded.sex,
        height_cm = excluded.height_cm,
        current_weight_kg = excluded.current_weight_kg,
        target_weight_kg = excluded.target_weight_kg,
        goal = excluded.goal,
        activity_level = excluded.activity_level,
        dietary_preferences = excluded.dietary_preferences,
        health_conditions = excluded.health_conditions,
        allergies = excluded.allergies,
        target_calories = excluded.target_calories,
        target_protein_g = excluded.target_protein_g,
        target_carbs_g = excluded.target_carbs_g,
        target_fat_g = excluded.target_fat_g,
        target_sodium_mg = excluded.target_sodium_mg,
        target_sugar_g = excluded.target_sugar_g,
        water_target_ml = excluded.water_target_ml,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      userId,
      profile.name,
      profile.onboarded ? 1 : 0,
      profile.age ?? 28,
      profile.sex ?? 'male',
      profile.height_cm ?? 172,
      profile.current_weight_kg ?? 70,
      profile.target_weight_kg ?? 68,
      profile.goal ?? 'maintain',
      profile.activity_level ?? 'lightly_active',
      JSON.stringify(profile.dietary_preferences || []),
      JSON.stringify(profile.health_conditions || []),
      JSON.stringify(profile.allergies || []),
      profile.target_calories ?? 2000,
      profile.target_protein_g ?? 100,
      profile.target_carbs_g ?? 250,
      profile.target_fat_g ?? 65,
      profile.target_sodium_mg ?? 2000,
      profile.target_sugar_g ?? 30,
      profile.water_target_ml || 2500,
      profile.updated_at || new Date().toISOString()
    );

    return profile;
  }

  updateProfile(
    input: Partial<UserProfileInput> & { name?: string; onboarded?: boolean },
    userId: string = Database.DEMO_USER_ID
  ): UserProfile {
    const current = this.getProfile(userId);
    const mergedInput: UserProfileInput = {
      age: input.age ?? current.age,
      sex: input.sex ?? current.sex,
      height_cm: input.height_cm ?? current.height_cm,
      current_weight_kg: input.current_weight_kg ?? current.current_weight_kg,
      target_weight_kg: input.target_weight_kg ?? current.target_weight_kg,
      goal: input.goal ?? current.goal,
      activity_level: input.activity_level ?? current.activity_level,
      dietary_preferences: input.dietary_preferences ?? current.dietary_preferences,
      health_conditions: input.health_conditions ?? current.health_conditions,
      allergies: input.allergies ?? current.allergies
    };

    const newTargets = calculateNutritionTargets(mergedInput);

    const updatedProfile: UserProfile = {
      ...mergedInput,
      ...newTargets,
      user_id: userId,
      name: input.name ?? current.name,
      onboarded: input.onboarded !== undefined ? input.onboarded : current.onboarded,
      updated_at: new Date().toISOString()
    };

    return this.saveProfile(userId, updatedProfile);
  }

  // ----------------------------------------------------
  // FOOD LOG METHODS
  // ----------------------------------------------------
  getLogs(date?: string, userId: string = Database.DEMO_USER_ID): FoodLogEntry[] {
    let query = 'SELECT * FROM food_logs WHERE user_id = ?';
    const params: any[] = [userId];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as any as FoodLogEntry[];
  }

  getRecentLogs(days: number = 7, userId: string = Database.DEMO_USER_ID): FoodLogEntry[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const stmt = this.db.prepare(`
      SELECT * FROM food_logs
      WHERE user_id = ? AND date >= ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, cutoffStr) as any as FoodLogEntry[];
  }

  addLog(entry: Omit<FoodLogEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }): FoodLogEntry {
    const newEntry: FoodLogEntry = {
      ...entry,
      id: entry.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: entry.user_id || Database.DEMO_USER_ID,
      created_at: entry.created_at || new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO food_logs (
        id, user_id, date, meal_type, dish_id, dish_name, name_local,
        portion_size, portion_multiplier, calories, protein_g, carbs_g, fat_g,
        sodium_mg, sugar_g, photo_url, healthier_alternative, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newEntry.id,
      newEntry.user_id || Database.DEMO_USER_ID,
      newEntry.date,
      newEntry.meal_type,
      newEntry.dish_id,
      newEntry.dish_name,
      newEntry.name_local || null,
      newEntry.portion_size || 'regular',
      newEntry.portion_multiplier ?? 1.0,
      newEntry.calories ?? 0,
      newEntry.protein_g ?? 0,
      newEntry.carbs_g ?? 0,
      newEntry.fat_g ?? 0,
      newEntry.sodium_mg ?? 0,
      newEntry.sugar_g ?? 0,
      newEntry.photo_url || null,
      newEntry.healthier_alternative || null,
      newEntry.notes || null,
      newEntry.created_at
    );

    return newEntry;
  }

  updateLog(id: string, updates: Partial<FoodLogEntry>, userId?: string): FoodLogEntry | null {
    const existing = this.db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    const stmt = this.db.prepare(`
      UPDATE food_logs SET
        meal_type = ?,
        dish_id = ?,
        dish_name = ?,
        name_local = ?,
        portion_size = ?,
        portion_multiplier = ?,
        calories = ?,
        protein_g = ?,
        carbs_g = ?,
        fat_g = ?,
        sodium_mg = ?,
        sugar_g = ?,
        photo_url = ?,
        healthier_alternative = ?,
        notes = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.meal_type,
      merged.dish_id,
      merged.dish_name,
      merged.name_local || null,
      merged.portion_size,
      merged.portion_multiplier,
      merged.calories,
      merged.protein_g,
      merged.carbs_g,
      merged.fat_g,
      merged.sodium_mg,
      merged.sugar_g,
      merged.photo_url || null,
      merged.healthier_alternative || null,
      merged.notes || null,
      id
    );

    return merged as FoodLogEntry;
  }

  deleteLog(id: string, userId?: string): boolean {
    const stmt = this.db.prepare('DELETE FROM food_logs WHERE id = ?');
    const info = stmt.run(id);
    return Number(info.changes) > 0;
  }

  // ----------------------------------------------------
  // WATER TRACKING METHODS
  // ----------------------------------------------------
  getWater(date: string, userId: string = Database.DEMO_USER_ID): number {
    const stmt = this.db.prepare('SELECT amount_ml FROM water_logs WHERE user_id = ? AND date = ?');
    const row = stmt.get(userId, date) as any;
    return row ? row.amount_ml : 0;
  }

  addWater(date: string, amount_ml: number, userId: string = Database.DEMO_USER_ID): number {
    const current = this.getWater(date, userId);
    const updated = Math.max(0, current + amount_ml);

    const stmt = this.db.prepare(`
      INSERT INTO water_logs (user_id, date, amount_ml, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        amount_ml = excluded.amount_ml,
        updated_at = excluded.updated_at
    `);
    stmt.run(userId, date, updated, new Date().toISOString());
    return updated;
  }

  // ----------------------------------------------------
  // WEIGHT LOG METHODS
  // ----------------------------------------------------
  getWeights(userId: string = Database.DEMO_USER_ID): WeightLogEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM weight_logs
      WHERE user_id = ?
      ORDER BY date ASC
    `);
    return stmt.all(userId) as any as WeightLogEntry[];
  }

  addWeight(date: string, weight_kg: number, userId: string = Database.DEMO_USER_ID): WeightLogEntry {
    const existing = this.db.prepare('SELECT * FROM weight_logs WHERE user_id = ? AND date = ?').get(userId, date) as any;
    let entry: WeightLogEntry;

    if (existing) {
      this.db.prepare('UPDATE weight_logs SET weight_kg = ? WHERE id = ?').run(weight_kg, existing.id);
      entry = { ...existing, weight_kg };
    } else {
      entry = {
        id: `w-${Date.now()}`,
        user_id: userId,
        date,
        weight_kg,
        created_at: new Date().toISOString()
      };
      this.db.prepare('INSERT INTO weight_logs (id, user_id, date, weight_kg, created_at) VALUES (?, ?, ?, ?, ?)').run(
        entry.id,
        userId,
        date,
        weight_kg,
        entry.created_at!
      );
    }

    // Also update current weight on profile
    this.updateProfile({ current_weight_kg: weight_kg }, userId);
    return entry;
  }

  // ----------------------------------------------------
  // CONTINUOUS VISION TRAINING PIPELINE METHODS
  // ----------------------------------------------------
  addTrainingSample(sample: Omit<TrainingSample, 'id' | 'created_at'> & { id?: string }): TrainingSample {
    const newSample: TrainingSample = {
      id: sample.id || `train-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: sample.user_id || Database.DEMO_USER_ID,
      image_path: sample.image_path || '',
      dish_id: sample.dish_id,
      dish_name: sample.dish_name,
      category: sample.category || 'Hawker',
      confidence: sample.confidence || 0.9,
      user_confirmed: sample.user_confirmed ?? 1,
      user_corrected: sample.user_corrected ?? 0,
      original_prediction: sample.original_prediction || sample.dish_name,
      ingredients_json: sample.ingredients_json || '[]',
      portion_multiplier: sample.portion_multiplier || 1.0,
      created_at: new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO training_samples (
        id, user_id, image_path, dish_id, dish_name, category, confidence,
        user_confirmed, user_corrected, original_prediction, ingredients_json,
        portion_multiplier, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newSample.id,
      newSample.user_id || null,
      newSample.image_path || null,
      newSample.dish_id,
      newSample.dish_name,
      newSample.category || null,
      newSample.confidence || null,
      newSample.user_confirmed,
      newSample.user_corrected,
      newSample.original_prediction || null,
      newSample.ingredients_json || null,
      newSample.portion_multiplier || 1.0,
      newSample.created_at
    );

    return newSample;
  }

  getTrainingSamples(limit: number = 50): TrainingSample[] {
    const stmt = this.db.prepare(`
      SELECT * FROM training_samples
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as any as TrainingSample[];
  }

  getTrainingStats(): {
    totalSamples: number;
    verifiedSamples: number;
    userCorrections: number;
    accuracyRate: number;
    topLearnedDishes: Array<{ dish_name: string; count: number }>;
  } {
    const totalRow = this.db.prepare('SELECT COUNT(*) as count FROM training_samples').get() as any;
    const verifiedRow = this.db.prepare('SELECT COUNT(*) as count FROM training_samples WHERE user_confirmed = 1').get() as any;
    const correctedRow = this.db.prepare('SELECT COUNT(*) as count FROM training_samples WHERE user_corrected = 1').get() as any;

    const total = totalRow?.count || 0;
    const verified = verifiedRow?.count || 0;
    const corrected = correctedRow?.count || 0;
    const accuracy = total > 0 ? Math.round(((total - corrected) / total) * 100) : 95;

    const topDishes = this.db.prepare(`
      SELECT dish_name, COUNT(*) as count
      FROM training_samples
      GROUP BY dish_name
      ORDER BY count DESC
      LIMIT 5
    `).all() as any;

    return {
      totalSamples: total,
      verifiedSamples: verified,
      userCorrections: corrected,
      accuracyRate: Math.max(70, accuracy),
      topLearnedDishes: topDishes || []
    };
  }

  // Reset database for a specific user or demo
  resetData(userId: string = Database.DEMO_USER_ID): any {
    this.db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(userId);
    this.db.prepare('DELETE FROM water_logs WHERE user_id = ?').run(userId);
    this.db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(userId);

    const today = new Date().toISOString().split('T')[0];
    this.addLog({
      user_id: userId,
      date: today,
      meal_type: 'breakfast',
      dish_id: 'kaya-toast-set',
      dish_name: 'Traditional Kaya Butter Toast Set',
      name_local: '咖椰面包及半生熟蛋套餐',
      portion_size: 'regular',
      portion_multiplier: 1.0,
      calories: 450,
      protein_g: 16,
      carbs_g: 52,
      fat_g: 19,
      sodium_mg: 580,
      sugar_g: 18,
      photo_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80',
      healthier_alternative: 'Scrape off excess butter slab and ask for Kopi-O Kosong to cut 18g sugar.'
    });

    return { success: true, profile: this.getProfile(userId) };
  }
}

export const db = new Database();
