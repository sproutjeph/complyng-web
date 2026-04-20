import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,var(--color-muted),transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
        <div className="flex flex-col gap-8">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            GAID 2025 · NDPR · NITDA · CBN · NCC · SEC
          </span>

          <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Turn GAID 2025 into
            <span className="text-muted-foreground"> operational compliance.</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Upload your privacy policy. ComplyNG maps it against NDPC GAID
            2025, flags gaps with dual citations, hashes your evidence, and
            publishes a regulator-verifiable Trust Center backed by a NIST
            OSCAL attestation.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-10"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Start free
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-10"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Open the demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-1" />
              Rules engine + cited AI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-1" />
              Hash-anchored evidence
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-1" />
              Public Trust Center
            </span>
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
