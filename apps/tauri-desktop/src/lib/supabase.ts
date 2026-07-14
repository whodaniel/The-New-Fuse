import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './safeStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const authConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const isSupabaseConfigured = authConfigured;

if (!authConfigured) {
  console.warn('Supabase configuration missing. Auth will not work correctly.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: authConfigured,
      autoRefreshToken: authConfigured,
      detectSessionInUrl: false,
      storage: safeStorage,
    },
  }
);
