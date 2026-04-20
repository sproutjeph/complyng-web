import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AskPanel } from "@/components/dashboard/ask-panel";

export const dynamic = "force-dynamic";

export default function AskPage() {
  return (
    <>
      <DashboardNav current="/dashboard/ask" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Ask the regulations
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Retrieval-augmented answers grounded in NITDA, NDPC, CBN, NCC, and
          SEC source texts. Every claim is cited to a specific clause.
        </p>
        <AskPanel />
      </main>
    </>
  );
}
