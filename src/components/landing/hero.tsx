import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,var(--color-muted),transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
        <div className="flex flex-col gap-8">
          <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Automate compliance, manage risk, and build trust
            <span className="text-muted-foreground"> with AI</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Every Nigerian business answers to 6+ regulators — and none of them
            talk to each other. ComplyNG is the AI layer that does. From CAC to
            FIRS, PENCOM to NAFDAC, one platform handles it all.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="email"
              placeholder="Enter your work email"
              className="h-10 sm:w-72"
            />
            <Button size="lg" className="h-10">
              Get Started
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-1" />
              Free for 1 business
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-1" />
              No credit card required
            </span>
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
