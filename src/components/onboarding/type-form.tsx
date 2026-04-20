"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "./form-error";
import { entityTypes, type EntityType } from "@/lib/rules/types";
import { submitType, type TypeState } from "@/app/onboarding/type/actions";

interface Props {
  selected: EntityType | null;
}

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

const initial: TypeState = { error: null };

export function TypeForm({ selected }: Props) {
  const [state, formAction, pending] = useActionState(submitType, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

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

      <Button
        type="submit"
        size="lg"
        className="self-start h-10"
        disabled={pending}
      >
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
