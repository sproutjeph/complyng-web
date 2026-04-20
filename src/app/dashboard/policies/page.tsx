import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PolicyUpload } from "@/components/dashboard/policy-upload";
import { requireUserId } from "@/lib/profile";
import { listPoliciesByUser } from "@/lib/db/policy";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const userId = await requireUserId();
  const policies = await listPoliciesByUser(userId);

  return (
    <>
      <DashboardNav current="/dashboard/policies" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Policies
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Upload your privacy policy or data-protection playbook. ComplyNG maps it against the GAID 2025 and highlights unmet articles with citations back to both your policy and the regulation.
        </p>

        <PolicyUpload />

        {policies.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-heading text-base font-semibold">
              Uploaded policies
            </h2>
            <ul className="space-y-2">
              {policies.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/policies/${p.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                  >
                    <FileText className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.chunkCount} chunks · {(p.textBytes / 1024).toFixed(1)} KB ·{" "}
                        {new Date(p.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
