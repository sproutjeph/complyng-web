import { Badge } from "@/components/ui/badge";

interface Framework {
  code: string;
  agency: string;
  obligations: string;
}

const phase1Frameworks: Framework[] = [
  {
    code: "CAC",
    agency: "Corporate Affairs Commission",
    obligations: "Annual returns, status filings, change notifications",
  },
  {
    code: "FIRS",
    agency: "Federal Inland Revenue Service",
    obligations: "CIT, VAT, WHT, PAYE, TCC renewal",
  },
  {
    code: "PENCOM",
    agency: "National Pension Commission",
    obligations: "Registration, monthly remittance, compliance cert",
  },
  {
    code: "NSITF",
    agency: "Nigeria Social Insurance Trust Fund",
    obligations: "ECS registration, monthly contributions",
  },
  {
    code: "ITF",
    agency: "Industrial Training Fund",
    obligations: "1% payroll levy, training returns",
  },
  {
    code: "SRS",
    agency: "State Revenue Services",
    obligations: "State taxes, levies, business premises permits",
  },
];

const phase2Codes = ["NAFDAC", "SON", "CBN", "NITDA", "SEC", "NCC"];

function FrameworkRow({ code, agency, obligations }: Framework) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {code}
        </Badge>
        <span className="text-sm font-semibold">{agency}</span>
      </div>
      <p className="text-sm text-muted-foreground">{obligations}</p>
    </div>
  );
}

export function Frameworks() {
  return (
    <section id="solutions" className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Every Nigerian Framework, One Platform
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ComplyNG supports Nigerian regulatory frameworks the way Vanta
            supports SOC 2 and ISO 27001 — structured, automated, and
            continuously monitored.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {phase1Frameworks.map((fw) => (
            <FrameworkRow key={fw.code} {...fw} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Coming soon:
          </span>
          {phase2Codes.map((code) => (
            <Badge key={code} variant="outline" className="font-mono text-xs">
              {code}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
