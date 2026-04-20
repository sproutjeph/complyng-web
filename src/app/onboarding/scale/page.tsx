import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitScale } from "./actions";

export const dynamic = "force-dynamic";

export default async function ScalePage() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);

  return (
    <WizardShell
      current="scale"
      completed={row.completedSteps}
      title="What do you handle?"
      description="These flags determine which obligations actually apply — e.g. NDPA only bites if you process personal data."
    >
      <form action={submitScale} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Nigerian users (approximate)
          </span>
          <Input
            name="nigerianUsers"
            type="number"
            min={0}
            defaultValue={row.nigerianUsers || 0}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </legend>
          <Check name="processesPersonalData" defaultChecked={row.processesPersonalData}>
            We process personal data of Nigerian residents
          </Check>
          <Check name="handlesPayments" defaultChecked={row.handlesPayments}>
            We handle payments, wallets, or remittance
          </Check>
          <Check name="custodiesDigitalAssets" defaultChecked={row.custodiesDigitalAssets}>
            We offer or custody digital assets (crypto)
          </Check>
          <Check name="sendsTelcoTraffic" defaultChecked={row.sendsTelcoTraffic}>
            We send SMS/voice traffic through Nigerian telco routes
          </Check>
        </fieldset>

        <Button type="submit" size="lg" className="self-start h-10">
          Continue
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
