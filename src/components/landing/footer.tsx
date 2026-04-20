import Link from "next/link";
import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Compliance Engine", href: "#" },
      { label: "Regulatory Monitoring", href: "#" },
      { label: "Trust Centre", href: "#" },
      { label: "Audit Readiness", href: "#" },
      { label: "WhatsApp Bot", href: "#" },
      { label: "API", href: "#" },
    ],
  },
  {
    title: "Frameworks",
    links: [
      { label: "CAC", href: "#" },
      { label: "FIRS", href: "#" },
      { label: "PENCOM", href: "#" },
      { label: "NSITF", href: "#" },
      { label: "ITF", href: "#" },
      { label: "View All", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Compliance Guides", href: "#" },
      { label: "API Reference", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
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
              AI-powered regulatory compliance for every Nigerian business.
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
            Made in Nigeria for Nigerian businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}
