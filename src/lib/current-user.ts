import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface CurrentUserContext {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

/**
 * Fetches the authenticated user + their profile in Server Components /
 * Route Handlers. Returns null if not authenticated (middleware normally
 * redirects first, but pages should still handle this defensively).
 */
export async function getCurrentUser(): Promise<CurrentUserContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null };
}
