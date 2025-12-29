/**
 * Supabase client initialization
 */

import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '@/constants/config'
import type { Database } from '@/types/database'

// Use placeholder values if env vars are missing to prevent app crash
// The app will still work but auth operations will fail gracefully
const supabaseUrl = CONFIG.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY || 'placeholder-key'

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Please check your .env file.')
  console.warn('The app will run but authentication features will not work.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

