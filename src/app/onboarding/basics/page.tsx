import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { BasicsForm } from "@/components/onboarding/basics-form";

export const dynamic = "force-dynamic";

export default async function BasicsPage() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);

  return (
    <WizardShell
      current="basics"
      completed={row.completedSteps}
      title="Tell us about your business"
      description="We use this to label your dashboard and route notifications. You can change any of these later."
    >
      <BasicsForm
        defaultValues={{
          name: row.name && row.name !== "My business" ? row.name : "",
          website: row.website ?? "",
          contactName: row.contactName ?? "",
        }}
      />
    </WizardShell>
  );
}
