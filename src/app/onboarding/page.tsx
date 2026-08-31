import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";

export default async function OnboardingPage() {
  if (!env.supabase.isConfigured) {
    redirect("/login");
  }
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile?.onboarding_completed) redirect("/home");

  return (
    <div className="min-h-screen bg-cream-50">
      <OnboardingFlow />
    </div>
  );
}
