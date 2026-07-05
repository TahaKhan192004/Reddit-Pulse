import { createClient } from "@supabase/supabase-js";

// Server-only. This file must never be imported from a "use client" component —
// the service role key would end up in the browser bundle.
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
