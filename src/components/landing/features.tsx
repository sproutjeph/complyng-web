import {
  ShieldCheck,
  Radar,
  Award,
  FileSearch,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Automated Compliance",
    description:
      "Maps your business profile to obligations across CAC, FIRS, PENCOM, NSITF, ITF, and more — no spreadsheets required.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Management",
    description:
      "Proactive risk scoring based on penalty severity, enforcement trends, and approaching deadlines across all agencies.",
  },
  {
    icon: Award,
    title: "Trust Centre & Badge",
    description:
      "Earn a verifiable ComplyNG Trust Badge proving your regulatory standing to customers, partners, and banks.",
  },
  {
    icon: FileSearch,
    title: "Audit Readiness",
    description:
      "Secure document vault with one-click report generation. Always ready for regulatory inspections.",
  },
  {
    icon: Radar,
    title: "Regulatory Monitoring",
    description:
      "AI scrapers monitor agency websites and gazettes daily. Get plain-language alerts when changes affect you.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Co-pilot",
    description:
      "Full compliance experience on WhatsApp — onboard, check deadlines, get alerts. No app download needed.",
  },
];

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function Features() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          The AI Regulatory Compliance Platform
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No matter your size, ComplyNG helps you automate compliance, manage
          risk, and prove trust continuously — all from a single platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
