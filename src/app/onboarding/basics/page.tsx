import { requireUserId } from "@/lib/profile";
import { ensureProfileStub } from "@/lib/db/profile";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitBasics } from "./actions";

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
      <form action={submitBasics} className="flex flex-col gap-5">
        <Field label="Business name" required>
          <Input
            name="name"
            defaultValue={row.name && row.name !== "My business" ? row.name : ""}
            placeholder="Acme Pay Ltd"
            required
            maxLength={200}
          />
        </Field>

        <Field label="Website (optional)">
          <Input
            name="website"
            defaultValue={row.website ?? ""}
            placeholder="https://acme.ng"
            type="url"
          />
        </Field>

        <Field label="Primary contact name (optional)">
          <Input
            name="contactName"
            defaultValue={row.contactName ?? ""}
            placeholder="Founder or Head of Compliance"
          />
        </Field>

        <Button type="submit" size="lg" className="self-start h-10">
          Continue
        </Button>
      </form>
    </WizardShell>
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
