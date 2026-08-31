"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Browser-side Supabase client. Safe to call even when Supabase is not
 * configured — callers should check `env.supabase.isConfigured` (or use the
 * `useSupabaseConfigured` pattern) before relying on real data, since the
 * app must still render a graceful message rather than crash.
 */
export function createClient() {
  if (!env.supabase.isConfigured) {
    // Return a client pointed at placeholder values; every call will fail
    // gracefully and calling code is expected to check isConfigured first.
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-anon-key");
  }
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
