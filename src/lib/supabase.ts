import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation for Supabase URL
if (!supabaseUrl || typeof supabaseUrl !== 'string') {
  throw new Error(
    'Invalid or missing Supabase URL. Please check your .env file and ensure VITE_SUPABASE_URL is set correctly.' +
    (!supabaseUrl ? ' The URL is completely missing.' : ' The URL is invalid.')
  );
}

// Enhanced validation for Supabase anonymous key
if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
  throw new Error(
    'Invalid or missing Supabase anonymous key. Please check your .env file and ensure VITE_SUPABASE_ANON_KEY is set correctly.' +
    (!supabaseAnonKey ? ' The key is completely missing.' : ' The key is invalid.')
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please ensure it's a valid URL.`);
}

// Create and export the Supabase client with enhanced configuration and error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'lottery-system'
    }
  },
  db: {
    schema: 'public'
  }
});

// Enhanced connection test with detailed error reporting
export const testSupabaseConnection = async () => {
  try {
    // First, test basic connectivity
    const { error: pingError } = await supabase.from('participants').select('count').limit(0);
    
    if (pingError) {
      // Check for specific error types
      if (pingError.message.includes('JWT')) {
        return {
          success: false,
          error: 'Authentication error: Invalid JWT token. Please check your SUPABASE_ANON_KEY.'
        };
      }
      if (pingError.message.includes('connection')) {
        return {
          success: false,
          error: 'Connection error: Unable to reach Supabase. Please check your network connection and SUPABASE_URL.'
        };
      }
      if (pingError.code === '42P01') {
        return {
          success: false,
          error: 'Database error: Table "participants" does not exist. Please check your database schema.'
        };
      }
      return {
        success: false,
        error: `Database error: ${pingError.message}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error 
        ? `Connection error: ${error.message}`
        : 'Unknown connection error occurred'
    };
  }
};