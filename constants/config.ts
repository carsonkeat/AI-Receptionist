/**
 * App configuration constants
 */

export const CONFIG = {
  APP_NAME: 'AI Receptionist',
  VERSION: '1.0.0',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  // VAPI: Prefer private key for assistant management, fall back to legacy/public
  VAPI_API_KEY: process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY || process.env.EXPO_PUBLIC_VAPI_API_KEY || process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '',
  VAPI_WEBHOOK_URL: process.env.EXPO_PUBLIC_VAPI_WEBHOOK_URL || '',
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
  API_ENVIRONMENT: process.env.EXPO_PUBLIC_API_ENVIRONMENT || 'development',
} as const

