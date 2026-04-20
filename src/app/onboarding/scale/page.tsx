import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { ScaleForm } from "@/components/onboarding/scale-form";

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
      <ScaleForm
        defaultValues={{
          nigerianUsers: row.nigerianUsers,
          processesPersonalData: row.processesPersonalData,
          handlesPayments: row.handlesPayments,
          custodiesDigitalAssets: row.custodiesDigitalAssets,
          sendsTelcoTraffic: row.sendsTelcoTraffic,
        }}
      />
    </WizardShell>
  );
}
