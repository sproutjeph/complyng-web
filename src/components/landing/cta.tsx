import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function CTA() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Stop guessing. Start complying.
            </h2>
            <p className="text-lg opacity-90">
              Join thousands of Nigerian businesses automating their regulatory
              compliance. Get started for free — or say &quot;Hi&quot; on WhatsApp.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="h-10"
                nativeButton={false}
                render={<Link href="/signup" />}
              >
                Get Started Free
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                nativeButton={false}
                render={<Link href="#whatsapp" />}
              >
                <MessageCircle data-icon="inline-start" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(1_0_0_/_0.08),transparent_60%)]" />
        </div>
      </div>
    </section>
  );
}
