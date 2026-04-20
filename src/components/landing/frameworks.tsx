import { Badge } from "@/components/ui/badge";

interface Framework {
  code: string;
  agency: string;
  obligations: string;
}

const phase1Frameworks: Framework[] = [
  {
    code: "NITDA",
    agency: "National Information Technology Development Agency",
    obligations: "Code of Practice, platform liaison, takedowns, annual reports",
  },
  {
    code: "NDPC",
    agency: "Nigeria Data Protection Commission",
    obligations: "NDPA 2023 & GAID 2025 — DPO, DPIA, 72h breach, rights",
  },
  {
    code: "CBN",
    agency: "Central Bank of Nigeria",
    obligations: "Risk-Based Cybersecurity Framework, AML/CFT, KYC, STRs",
  },
  {
    code: "NCC",
    agency: "Nigerian Communications Commission",
    obligations: "Consumer Code, QoS reporting, SIM/NIN, outage reports",
  },
  {
    code: "SEC",
    agency: "Securities and Exchange Commission",
    obligations: "Digital Assets Rules 2022 — VASP, custody, disclosure",
  },
  {
    code: "CBN AML",
    agency: "CBN AML/CFT/CPF Regulations",
    obligations: "MLRO, sanctions screening, 5-yr retention, annual training",
  },
];

const phase2Codes = ["CAC", "FIRS", "PENCOM", "NSITF", "ITF", "NAFDAC", "SON"];

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
            Every Nigerian framework, one schema
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each regulator is a JSON file conforming to the same Zod schema.
            The rules engine applies the same <span className="font-mono">trigger</span> and
            {" "}
            <span className="font-mono">dueRule</span> predicates uniformly —
            adding a new framework is a data task, not an engineering task.
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
