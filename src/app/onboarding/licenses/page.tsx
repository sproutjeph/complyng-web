import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { Button } from "@/components/ui/button";
import { submitLicenses } from "./actions";

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
      <form action={submitLicenses} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <Check name="licensedByCbn" defaultChecked={row.licensedByCbn}>
            Licensed by the Central Bank of Nigeria (CBN)
          </Check>
          <Check name="licensedByNcc" defaultChecked={row.licensedByNcc}>
            Licensed by the Nigerian Communications Commission (NCC)
          </Check>
          <Check name="registeredWithSec" defaultChecked={row.registeredWithSec}>
            Registered with the Securities and Exchange Commission (SEC)
          </Check>
          <Check name="hasDpo" defaultChecked={row.hasDpo}>
            We have a designated Data Protection Officer (DPO)
          </Check>
        </fieldset>

        <Button type="submit" size="lg" className="self-start h-10">
          Finish & open dashboard
        </Button>
      </form>
    </WizardShell>
  );
}

function Check({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4"
      />
      <span>{children}</span>
    </label>
  );
}
