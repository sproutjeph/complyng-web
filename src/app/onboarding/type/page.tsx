import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { Button } from "@/components/ui/button";
import { entityTypes, type EntityType } from "@/lib/rules/types";
import { submitType } from "./actions";

export const dynamic = "force-dynamic";

const entityInfo: Record<EntityType, { label: string; blurb: string }> = {
  fintech: {
    label: "Fintech",
    blurb: "Lending, wallet, neobank, remittance. CBN + NDPC heavy.",
  },
  platform: {
    label: "Platform",
    blurb: "Social, marketplace, UGC. NITDA Code of Practice applies.",
  },
  telco: {
    label: "Telco / ISP",
    blurb: "Voice, SMS, data. NCC Consumer Code + QoS reporting.",
  },
  digital_service_provider: {
    label: "Digital service provider",
    blurb: "SaaS, cloud, API products touching Nigerian users.",
  },
  vasp: {
    label: "Virtual Asset Service Provider",
    blurb: "Crypto exchange or custody. SEC Digital Assets Rules + CBN AML.",
  },
};

export default async function TypePage() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);
  const selected = row.entityType;

  return (
    <WizardShell
      current="type"
      completed={row.completedSteps}
      title="What kind of business is it?"
      description="Pick the closest match. This controls which frameworks apply and which obligations you'll see."
    >
      <form action={submitType} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {entityTypes.map((t) => {
            const info = entityInfo[t];
            return (
              <label
                key={t}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="entityType"
                  value={t}
                  defaultChecked={selected === t}
                  className="mt-1 size-4"
                  required
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{info.label}</span>
                  <span className="text-xs text-muted-foreground">{info.blurb}</span>
                </div>
              </label>
            );
          })}
        </div>

        <Button type="submit" size="lg" className="self-start h-10">
          Continue
        </Button>
      </form>
    </WizardShell>
  );
}
