import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { LicensesForm } from "@/components/onboarding/licenses-form";

export const dynamic = "force-dynamic";

export default async function LicensesPage() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);

  return (
    <WizardShell
      current="licenses"
      completed={row.completedSteps}
      title="Any existing licenses?"
      description="Optional — check the ones that apply. We'll skip obligations you've already satisfied structurally and highlight ones you still need."
    >
      <LicensesForm
        defaultValues={{
          licensedByCbn: row.licensedByCbn,
          licensedByNcc: row.licensedByNcc,
          registeredWithSec: row.registeredWithSec,
          hasDpo: row.hasDpo,
        }}
      />
    </WizardShell>
  );
}
