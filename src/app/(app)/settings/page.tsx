import { getCurrentUser } from "@/lib/current-user";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const current = await getCurrentUser();
  if (!current || !current.profile) return null;

  return <SettingsView profile={current.profile} email={current.email} />;
}
