import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Returns a Supabase client if credentials are configured, or null for
 * dev/demo mode (when NEXT_PUBLIC_SUPABASE_URL is not set).
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/** Singleton — safe to import from any client component. */
export const supabase = getSupabase();

/** Whether Supabase auth is configured (vs dev/demo mode). */
export const isAuthEnabled = supabase !== null;
