
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Check if we're running in offline/local mode
const isOfflineMode = import.meta.env.VITE_OFFLINE_MODE === 'true' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// Get Supabase URL - direct connection to local Supabase in offline mode
const getSupabaseUrl = () => {
  if (isOfflineMode) {
    // Always use direct HTTP connection to local Supabase in offline mode
    return "http://127.0.0.1:54321";
  }
  return "https://dgesvcnwarjonxurtxny.supabase.co";
};

const SUPABASE_URL = getSupabaseUrl();

// Get anon key - prefer env var, fallback to hard-coded for offline mode
const getAnonKey = () => {
  // First try to get from environment variable
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Fallback to hard-coded keys based on mode
  if (isOfflineMode) {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MTkyNjIzLCJleHAiOjE5NjA3Njg2MjN9.r94MmQVbJVd7aOz8Xm_VEbKxzKd6QXg-RlK8TQbW_Hk";
  } else {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZXN2Y253YXJqb254dXJ0eG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzI1NjYsImV4cCI6MjA2NTk0ODU2Nn0.k6LGRB_sXRG2qGn65_pRmOCb901UCCxyliqP5gALX-A";
  }
};

const SUPABASE_PUBLISHABLE_KEY = getAnonKey();

// Debug logging for configuration verification
console.log('Supabase Client Configuration:', {
  isOfflineMode,
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  VITE_OFFLINE_MODE: import.meta.env.VITE_OFFLINE_MODE,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Found in env' : 'Using fallback',
  SUPABASE_URL,
  anonKeyPrefix: SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...'
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
