import { auth, clerkClient } from "@clerk/nextjs/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ComplyAgentLanding } from "@/components/dashboard/comply-agent-landing";

export const dynamic = "force-dynamic";

async function resolvePrefillEmail(userId: string | null): Promise<string | undefined> {
  if (!userId) return undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?? user.emailAddresses[0];
    return primary?.emailAddress ?? undefined;
  } catch (e) {
    console.warn(`[comply-agent] could not resolve email for ${userId}:`, e);
    return undefined;
  }
}

export default async function ComplyAgentPage() {
  const { userId } = await auth();
  const prefillEmail = await resolvePrefillEmail(userId);

  return (
    <>
      <DashboardNav current="/dashboard/comply-agent" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ComplyAgentLanding prefillEmail={prefillEmail} />
      </main>
    </>
  );
}
