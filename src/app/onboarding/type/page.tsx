import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { TypeForm } from "@/components/onboarding/type-form";

export const dynamic = "force-dynamic";

export default async function TypePage() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);

  return (
    <WizardShell
      current="type"
      completed={row.completedSteps}
      title="What kind of business is it?"
      description="Pick the closest match. This controls which frameworks apply and which obligations you'll see."
    >
      <TypeForm selected={row.entityType} />
    </WizardShell>
  );
}
