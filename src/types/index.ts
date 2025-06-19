import type { User } from '@supabase/supabase-js';

export interface Participant {
  id: string;
  name: string;
  whatsapp: string;
  number: number;
  registrationDate: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AppState {
  drawDate: string;
  participants: Participant[];
  selectedNumbers: number[];
  isDrawComplete: boolean;
  winner: Participant | null;
}

export interface DrawConfig {
  id: string;
  name: string;
  description: string;
  value: string;
  drawDate: string;
  imageUrl: string;
  isFree: boolean;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  category?: string;
  difficulty?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HangmanWord {
  id: number;
  word: string;
  hint?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}