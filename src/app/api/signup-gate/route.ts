import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET() {
    const cap = env.usage.signupCap;

  if (!env.supabase.isConfigured || !env.supabase.serviceRoleKey) {
        return NextResponse.json({ open: true, count: 0, cap });
  }

  try {
        const admin = createAdminClient();
        const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
        if (error) throw error;

      const used = count ?? 0;
        return NextResponse.json({ open: used < cap, count: used, cap });
  } catch (err) {
        console.error("[signup-gate] failed to check profile count, failing open:", err);
        return NextResponse.json({ open: true, count: 0, cap });
  }
}
