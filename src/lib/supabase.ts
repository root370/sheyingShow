import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl && typeof window !== 'undefined') {
  console.error('Supabase URL is missing! Check .env file.')
}
// Remove console.log in production to avoid leaking info in server logs if any
// console.log('Supabase URL:', supabaseUrl)

// Safer initialization for SSR
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    }
  }
)
