import { AppShell } from "@/components/AppShell";
import { DashboardClient } from "@/components/DashboardClient";
import { getOwnerWorkspaceData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { assets, invitations, profile, userEmail } = await getOwnerWorkspaceData();

  return (
    <AppShell userEmail={userEmail}>
      <DashboardClient assets={assets} invitations={invitations} profile={profile} />
    </AppShell>
  );
}
