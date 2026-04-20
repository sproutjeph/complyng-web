"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "./form-error";
import { submitBasics, type BasicsState } from "@/app/onboarding/basics/actions";

interface Props {
  defaultValues: { name: string; website: string; contactName: string };
}

const initial: BasicsState = { error: null };

export function BasicsForm({ defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(submitBasics, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

      <Field label="Business name" required>
        <Input
          name="name"
          defaultValue={defaultValues.name}
          placeholder="Acme Pay Ltd"
          required
          maxLength={200}
        />
      </Field>

      <Field label="Website (optional)">
        <Input
          name="website"
          defaultValue={defaultValues.website}
          placeholder="https://acme.ng"
          type="url"
        />
      </Field>

      <Field label="Primary contact name (optional)">
        <Input
          name="contactName"
          defaultValue={defaultValues.contactName}
          placeholder="Founder or Head of Compliance"
        />
      </Field>

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
