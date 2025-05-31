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
  participants: Participant[];
  selectedNumbers: number[];
  isDrawComplete: boolean;
  winner: Participant | null;
}