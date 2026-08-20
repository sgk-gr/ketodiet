export type FoodStatus = 'allowed' | 'forbidden' | 'caution';

export type FoodCategory = 
  | 'proteins' 
  | 'vegetables' 
  | 'fats' 
  | 'dairy' 
  | 'fruits' 
  | 'carbs' 
  | 'beverages' 
  | 'snacks';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  status: FoodStatus;
  description: string;
  benefits_or_harms: string;
  anti_inflammatory_score: number; // 1 to 5 stars
  spine_benefit?: string;
  glycemic_index: 'low' | 'medium' | 'high';
  icon?: string;
  created_at?: string;
}

export interface FoodLogEntry {
  id: string;
  foodId: string;
  name: string;
  quantity: number; // grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  pain_level: number; // 1 to 10 (10 = highest pain, 1 = no pain)
  notes?: string;
  created_at?: string;
}

export interface MealRecipe {
  id: string;
  day: 'Δευτέρα' | 'Τρίτη' | 'Τετάρτη' | 'Πέμπτη' | 'Παρασκευή' | 'Σάββατο' | 'Κυριακή';
  meal_type: 'lunch' | 'snack' | 'dinner';
  time: string; // e.g. "12:00", "16:00", "20:00"
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_anti_inflammatory: boolean;
  spine_benefit?: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  water_ml: number; // goal: 3000ml
  fasting_hours: number; // goal: 16h
  exercise_minutes: number;
  exercise_type: 'recumbent_bike' | 'walking' | 'swimming' | 'decompression_stretches' | 'rest';
  lumbar_feeling: 'excellent' | 'good' | 'moderate' | 'painful';
  completed_habits: any[];
  notes?: string;
  created_at?: string;
}

export interface UserSettings {
  name: string;
  start_weight: number;
  current_weight: number;
  target_weight: number;
  height_cm: number;
  age: number;
  eating_window_start: string; // "12:00"
  eating_window_end: string;   // "20:00"
  water_goal_ml: number;
  daily_steps_goal: number;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  action_data?: any;
}
