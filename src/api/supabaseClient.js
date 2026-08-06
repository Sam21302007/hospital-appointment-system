import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && 
  !supabaseUrl.includes('placeholder.supabase.co') &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' && 
  !supabaseAnonKey.includes('placeholder_key') &&
  supabaseAnonKey.trim() !== '';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!isConfigured;

