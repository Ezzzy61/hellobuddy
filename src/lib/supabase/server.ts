import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes the auth cookie via Next's cookies() API.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.supabase.isConfigured ? env.supabase.url : "https://placeholder.supabase.co",
    env.supabase.isConfigured ? env.supabase.anonKey : "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no request context to write to.
            // Middleware refreshes the session cookie, so this can be safely ignored.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. NEVER expose this to the client.
 * Used only for trusted server-side operations that must bypass RLS, such as
 * background analytics writes attributed to a user by id.
 */
export function createAdminClient() {
  if (!env.supabase.isConfigured || !env.supabase.serviceRoleKey) {
    throw new Error("Supabase admin client requested but service role key is not configured.");
  }
  return createSupabaseJsClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
