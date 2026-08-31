import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";
import { MobileTopbar } from "@/components/nav/mobile-topbar";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";
import { Alert } from "@/components/ui/alert";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!env.supabase.isConfigured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
        <Alert variant="warning" title="Supabase isn't configured yet">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment to use
          HelloBuddy. See the README for setup steps.
        </Alert>
      </div>
    );
  }

  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }

  if (current.profile && !current.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-ink-950">
      <Sidebar preferredName={current.profile?.preferred_name} plan={current.profile?.plan ?? "free"} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopbar />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
