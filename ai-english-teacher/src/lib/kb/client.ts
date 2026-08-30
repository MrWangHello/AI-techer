import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function supabaseAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
}

export function isCloudKbConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isCloudKbConfigured()) return null;
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
