import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions
export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  author_id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number;
  cook_time: number;
  servings: number;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
  order_index: number;
}

export interface CookingStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  duration: number;
  image_url?: string;
}

export interface Nutrition {
  id: string;
  recipe_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}