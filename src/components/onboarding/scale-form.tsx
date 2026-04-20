"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "./form-error";
import { submitScale, type ScaleState } from "@/app/onboarding/scale/actions";

interface Props {
  defaultValues: {
    nigerianUsers: number;
    processesPersonalData: boolean;
    handlesPayments: boolean;
    custodiesDigitalAssets: boolean;
    sendsTelcoTraffic: boolean;
  };
}

const initial: ScaleState = { error: null };

export function ScaleForm({ defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(submitScale, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nigerian users (approximate)</span>
        <Input
          name="nigerianUsers"
          type="number"
          min={0}
          defaultValue={defaultValues.nigerianUsers || 0}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </legend>
        <Check
          name="processesPersonalData"
          defaultChecked={defaultValues.processesPersonalData}
        >
          We process personal data of Nigerian residents
        </Check>
        <Check name="handlesPayments" defaultChecked={defaultValues.handlesPayments}>
          We handle payments, wallets, or remittance
        </Check>
        <Check
          name="custodiesDigitalAssets"
          defaultChecked={defaultValues.custodiesDigitalAssets}
        >
          We offer or custody digital assets (crypto)
        </Check>
        <Check name="sendsTelcoTraffic" defaultChecked={defaultValues.sendsTelcoTraffic}>
          We send SMS/voice traffic through Nigerian telco routes
        </Check>
      </fieldset>

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
