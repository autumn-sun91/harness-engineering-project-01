import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function requiredServerEnv(name: "SUPABASE_URL" | "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

/**
 * Use only from webhook handling and account deletion.
 * This client bypasses RLS and must never be imported by client components.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient {
  return createClient(
    requiredServerEnv("SUPABASE_URL"),
    requiredServerEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
