"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "./form-error";
import {
  submitLicenses,
  type LicensesState,
} from "@/app/onboarding/licenses/actions";

interface Props {
  defaultValues: {
    licensedByCbn: boolean;
    licensedByNcc: boolean;
    registeredWithSec: boolean;
    hasDpo: boolean;
  };
}

const initial: LicensesState = { error: null };

export function LicensesForm({ defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(submitLicenses, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

      <fieldset className="flex flex-col gap-2">
        <Check name="licensedByCbn" defaultChecked={defaultValues.licensedByCbn}>
          Licensed by the Central Bank of Nigeria (CBN)
        </Check>
        <Check name="licensedByNcc" defaultChecked={defaultValues.licensedByNcc}>
          Licensed by the Nigerian Communications Commission (NCC)
        </Check>
        <Check
          name="registeredWithSec"
          defaultChecked={defaultValues.registeredWithSec}
        >
          Registered with the Securities and Exchange Commission (SEC)
        </Check>
        <Check name="hasDpo" defaultChecked={defaultValues.hasDpo}>
          We have a designated Data Protection Officer (DPO)
        </Check>
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="self-start h-10"
        disabled={pending}
      >
        {pending ? "Saving…" : "Finish & open dashboard"}
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
