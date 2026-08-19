import { createClient } from '@supabase/supabase-js';
import { FoodItem, MealRecipe, WeightLog, DailyLog, UserSettings } from '../types';
import { INITIAL_FOODS, INITIAL_MEAL_PLAN, INITIAL_USER_SETTINGS, INITIAL_WEIGHT_LOGS } from '../data/initialData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xrmvingehhiymchoggka.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEYS = {
  WEIGHT: 'spiros_local_weights',
  FOODS: 'spiros_local_foods',
  MEALS: 'spiros_local_meals',
  DAILY: 'spiros_local_daily',
  SETTINGS: 'spiros_local_settings',
};

// --- DATA SERVICE WITH AUTO SUPABASE + LOCALSTORAGE FALLBACK ---

export const DataService = {
  // --- WEIGHT LOGS (spiros_weight_logs) ---
  async getWeightLogs(): Promise<WeightLog[]> {
    try {
      const { data, error } = await supabase
        .from('spiros_weight_logs')
        .select('*')
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        throw new Error(error?.message || 'No remote logs found');
      }
      return data;
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.WEIGHT);
      if (local) {
        try { return JSON.parse(local); } catch { /* ignore */ }
      }
      localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(INITIAL_WEIGHT_LOGS));
      return INITIAL_WEIGHT_LOGS;
    }
  },

  async addWeightLog(log: Omit<WeightLog, 'id'>): Promise<WeightLog> {
    const newLog: WeightLog = {
      ...log,
      id: 'weight-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('spiros_weight_logs')
        .insert([newLog])
        .select()
        .single();
      if (!error && data) {
        // Sync local storage too
        const local = await this.getWeightLogs();
        const updated = [...local.filter(l => l.id !== data.id), data].sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(updated));
        return data;
      }
    } catch {
      // Local fallback
    }

    // LocalStorage fallback
    const current = await this.getWeightLogs();
    const updated = [...current, newLog].sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(updated));
    return newLog;
  },

  async deleteWeightLog(id: string): Promise<void> {
    try {
      await supabase.from('spiros_weight_logs').delete().eq('id', id);
    } catch {
      // ignore
    }
    const current = await this.getWeightLogs();
    const updated = current.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(updated));
  },

  // --- FOODS DIRECTORY (spiros_foods) ---
  async getFoods(): Promise<FoodItem[]> {
    try {
      const { data, error } = await supabase
        .from('spiros_foods')
        .select('*');

      if (error || !data || data.length === 0) {
        throw new Error(error?.message || 'No remote foods found');
      }
      return data;
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.FOODS);
      if (local) {
        try { return JSON.parse(local); } catch { /* ignore */ }
      }
      localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(INITIAL_FOODS));
      return INITIAL_FOODS;
    }
  },

  async addFood(food: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const newFood: FoodItem = {
      ...food,
      id: 'food-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('spiros_foods')
        .insert([newFood])
        .select()
        .single();
      if (!error && data) {
        const local = await this.getFoods();
        const updated = [data, ...local.filter(f => f.id !== data.id)];
        localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(updated));
        return data;
      }
    } catch {
      // Local fallback
    }

    const current = await this.getFoods();
    const updated = [newFood, ...current];
    localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(updated));
    return newFood;
  },

  async deleteFood(id: string): Promise<void> {
    try {
      await supabase.from('spiros_foods').delete().eq('id', id);
    } catch {
      // ignore
    }
    const current = await this.getFoods();
    const updated = current.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(updated));
  },

  // --- MEALS (spiros_meals) ---
  async getMeals(): Promise<MealRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('spiros_meals')
        .select('*');

      if (error || !data || data.length === 0) {
        throw new Error(error?.message || 'No remote meals');
      }
      return data;
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.MEALS);
      if (local) {
        try { return JSON.parse(local); } catch { /* ignore */ }
      }
      localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(INITIAL_MEAL_PLAN));
      return INITIAL_MEAL_PLAN;
    }
  },

  // --- DAILY LOGS (spiros_daily_logs) ---
  async getDailyLog(date: string): Promise<DailyLog> {
    try {
      const { data, error } = await supabase
        .from('spiros_daily_logs')
        .select('*')
        .eq('date', date)
        .single();
      if (!error && data) return data;
    } catch {
      // fallback
    }

    const localStr = localStorage.getItem(STORAGE_KEYS.DAILY + '_' + date);
    if (localStr) {
      try { return JSON.parse(localStr); } catch { /* ignore */ }
    }

    const defaultLog: DailyLog = {
      id: 'daily-' + date,
      date,
      water_ml: 1250,
      fasting_hours: 16,
      exercise_minutes: 20,
      exercise_type: 'recumbent_bike',
      lumbar_feeling: 'good',
      completed_habits: ['water_morning', 'fasting_16', 'no_sugar', 'bike_20'],
      notes: 'Καλή ενέργεια και καμία ενόχληση στη μέση.',
    };
    return defaultLog;
  },

  async saveDailyLog(log: DailyLog): Promise<void> {
    try {
      await supabase
        .from('spiros_daily_logs')
        .upsert([log], { onConflict: 'date' });
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEYS.DAILY + '_' + log.date, JSON.stringify(log));
  },

  // --- SETTINGS (spiros_settings) ---
  async getSettings(): Promise<UserSettings> {
    const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (local) {
      try { return JSON.parse(local); } catch { /* ignore */ }
    }
    return INITIAL_USER_SETTINGS;
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    try {
      await supabase
        .from('spiros_settings')
        .upsert([{ id: 'spiros-main-profile', ...settings }], { onConflict: 'id' });
    } catch {
      // ignore
    }
  }
};

// --- SQL MIGRATION SCRIPT GENERATOR (FOR SUPABASE SQL EDITOR) ---
export function generateSupabaseSQLScript(): string {
  return `-- ==========================================================
-- SQL Setup Script for Spiros Health & Low-Carb Dashboard
-- Prefix: spiros_
-- Execute this script in Supabase SQL Editor (https://supabase.com/dashboard)
-- ==========================================================

-- 1. Table: spiros_weight_logs
CREATE TABLE IF NOT EXISTS spiros_weight_logs (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    pain_level INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: spiros_foods
CREATE TABLE IF NOT EXISTS spiros_foods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    benefits_or_harms TEXT,
    anti_inflammatory_score INTEGER DEFAULT 5,
    spine_benefit TEXT,
    glycemic_index TEXT DEFAULT 'low',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: spiros_meals
CREATE TABLE IF NOT EXISTS spiros_meals (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    ingredients JSONB,
    instructions JSONB,
    calories INTEGER,
    protein_g NUMERIC(5,1),
    carbs_g NUMERIC(5,1),
    fat_g NUMERIC(5,1),
    is_anti_inflammatory BOOLEAN DEFAULT true,
    spine_benefit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: spiros_daily_logs
CREATE TABLE IF NOT EXISTS spiros_daily_logs (
    id TEXT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    water_ml INTEGER DEFAULT 0,
    fasting_hours NUMERIC(4,1) DEFAULT 16,
    exercise_minutes INTEGER DEFAULT 0,
    exercise_type TEXT DEFAULT 'recumbent_bike',
    lumbar_feeling TEXT DEFAULT 'good',
    completed_habits JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: spiros_settings
CREATE TABLE IF NOT EXISTS spiros_settings (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT 'Σπύρος',
    start_weight NUMERIC(5,2) DEFAULT 105.0,
    current_weight NUMERIC(5,2) DEFAULT 105.0,
    target_weight NUMERIC(5,2) DEFAULT 90.0,
    height_cm INTEGER DEFAULT 180,
    age INTEGER DEFAULT 45,
    eating_window_start TEXT DEFAULT '12:00',
    eating_window_end TEXT DEFAULT '20:00',
    water_goal_ml INTEGER DEFAULT 3000,
    daily_steps_goal INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create public policies for all spiros_ tables
ALTER TABLE spiros_weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access spiros_weight_logs" ON spiros_weight_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE spiros_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access spiros_foods" ON spiros_foods FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE spiros_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access spiros_meals" ON spiros_meals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE spiros_daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access spiros_daily_logs" ON spiros_daily_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE spiros_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access spiros_settings" ON spiros_settings FOR ALL USING (true) WITH CHECK (true);
`;
}
