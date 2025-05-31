import { supabase } from '../lib/supabase';

interface LoginResult {
  success: boolean;
  user: any | null;
  token: string | null;
  message?: string;
}

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return {
        success: false,
        user: null,
        token: null,
        message: error.message
      };
    }

    if (!data.session) {
      return {
        success: false,
        user: null,
        token: null,
        message: 'No session returned'
      };
    }

    return {
      success: true,
      user: data.user,
      token: data.session.access_token
    };
  } catch (error) {
    return {
      success: false,
      user: null,
      token: null,
      message: 'An error occurred during login'
    };
  }
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const checkAuth = async (): Promise<{ user: any | null; token: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { user: null, token: null };
  }

  return {
    user: session.user,
    token: session.access_token
  };
};

export const validateToken = async (token: string): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session && session.access_token === token;
};