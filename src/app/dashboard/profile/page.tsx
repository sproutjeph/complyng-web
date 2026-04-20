import { getProfile } from "@/lib/profile";
import { entityTypes } from "@/lib/rules/types";
import { saveProfile } from "./actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const entityLabels: Record<string, string> = {
  fintech: "Fintech (lending, wallet, neobank)",
  platform: "Platform (social, marketplace, user-generated content)",
  telco: "Telco / ISP",
  digital_service_provider: "Digital service provider",
  vasp: "Virtual Asset Service Provider (crypto exchange/custody)",
};

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <>
      <DashboardNav current="/dashboard/profile" />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Business profile
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Your profile drives the obligations engine. Change any attribute and
          the dashboard recomputes against all five regulators.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveProfile} className="flex flex-col gap-5">
              <Field label="Business name">
                <Input
                  name="name"
                  defaultValue={profile.name}
                  required
                  placeholder="Acme Pay Ltd"
                />
              </Field>

              <Field label="Entity type">
                <select
                  name="entityType"
                  defaultValue={profile.entityType}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {entityTypes.map((t) => (
                    <option key={t} value={t}>
                      {entityLabels[t] ?? t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nigerian users (approximate)">
                <Input
                  name="userCountNG"
                  type="number"
                  min={0}
                  defaultValue={profile.userCountNG}
                />
              </Field>

              <fieldset className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Attributes
                </legend>
                <Checkbox
                  name="processesPersonalData"
                  defaultChecked={profile.processesPersonalData}
                  label="Processes personal data of Nigerian residents"
                />
                <Checkbox
                  name="handlesPayments"
                  defaultChecked={profile.handlesPayments}
                  label="Handles payments, wallets, or remittance"
                />
                <Checkbox
                  name="offersDigitalAssets"
                  defaultChecked={profile.offersDigitalAssets}
                  label="Offers or custodies digital assets"
                />
                <Checkbox
                  name="isLicensedByCBN"
                  defaultChecked={profile.isLicensedByCBN}
                  label="Licensed or regulated by CBN"
                />
                <Checkbox
                  name="isLicensedByNCC"
                  defaultChecked={profile.isLicensedByNCC}
                  label="Licensed or regulated by NCC"
                />
                <Checkbox
                  name="isLicensedBySEC"
                  defaultChecked={profile.isLicensedBySEC}
                  label="Registered with SEC"
                />
              </fieldset>

              <Button type="submit" size="lg" className="self-start h-10">
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-border"
      />
      <span>{label}</span>
    </label>
  );
}
