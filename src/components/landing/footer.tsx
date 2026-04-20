import Link from "next/link";
import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Rules Engine", href: "#platform" },
      { label: "Policy Gap Analysis", href: "#platform" },
      { label: "Evidence Ledger", href: "#platform" },
      { label: "OSCAL Export", href: "#platform" },
      { label: "Trust Center", href: "#platform" },
      { label: "Cited AI Q&A", href: "#platform" },
    ],
  },
  {
    title: "Frameworks",
    links: [
      { label: "NDPC GAID 2025", href: "#solutions" },
      { label: "NDPA 2023 / NDPR", href: "#solutions" },
      { label: "NITDA Code 2022", href: "#solutions" },
      { label: "CBN RBCF", href: "#solutions" },
      { label: "NCC Consumer Code", href: "#solutions" },
      { label: "SEC Digital Assets", href: "#solutions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Demo guide", href: "/DEMO.md" },
      { label: "OSCAL spec (NIST)", href: "https://pages.nist.gov/OSCAL/" },
      { label: "NDPC GAID 2025", href: "https://ndpc.gov.ng/" },
      { label: "GitHub", href: "https://github.com/sproutjeph/complyng-web" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "mailto:team@complyng.ng" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <span className="text-base font-bold tracking-tight">
                ComplyNG
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Policy-as-code compliance for Nigerian regulators. OSCAL-native.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-semibold">{section.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ComplyNG. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built in Nigeria. OSCAL-native. Hackathon prototype — not legal advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
