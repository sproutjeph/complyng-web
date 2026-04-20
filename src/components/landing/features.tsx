import {
  ShieldCheck,
  FileSearch,
  FileCheck2,
  FileJson,
  Globe2,
  Sparkles,
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
    title: "Rules Engine",
    description:
      "Deterministic TypeScript engine maps your business profile to obligations across NITDA, NDPC, CBN, NCC, SEC, and CBN AML. Adding a framework is adding a JSON file.",
  },
  {
    icon: FileSearch,
    title: "AI Policy Gap Analysis",
    description:
      "Upload your privacy policy. Claude Sonnet 4.5 compares it clause-by-clause against GAID 2025 and returns structured findings with quotes from your policy and the regulation.",
  },
  {
    icon: FileCheck2,
    title: "Evidence Ledger",
    description:
      "Attach PDFs or verification URLs to any obligation. Every file is sha256-hashed, audit-stamped, and auto-flips the obligation to Compliant — no manual checklists.",
  },
  {
    icon: FileJson,
    title: "OSCAL Attestation Export",
    description:
      "One click produces a NIST OSCAL Assessment-Results JSON with deterministic UUIDs, content hash, and optional HMAC signature. Regulators can ingest it via API.",
  },
  {
    icon: Globe2,
    title: "Public Trust Center",
    description:
      "Publish a hash-anchored page at a public slug. Customers and regulators see posture, evidence metadata, and can download the exact OSCAL the hash was computed from.",
  },
  {
    icon: Sparkles,
    title: "Cited AI Q&A",
    description:
      "Ask a regulatory question and get an answer grounded only in ingested source texts (NDPA, GAID, CBN RBCF, NCC CCP, SEC Digital Assets) with inline clause citations.",
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
          AI explains. The rules engine decides.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          A defensible split: the deterministic engine decides what applies
          and when it is due. The LLM only explains, cites, and surfaces
          gaps — never makes the compliance call itself.
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
