import Link from "next/link";
import { BellRing, Shield, MessageSquare, LayoutDashboard, User, FileText, Globe2, Sparkles, type LucideIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const links: readonly NavLink[] = [
  { label: "Obligations", href: "/dashboard", icon: LayoutDashboard },
  { label: "Policies", href: "/dashboard/policies", icon: FileText },
  { label: "Changes", href: "/dashboard/changes", icon: BellRing },
  { label: "Trust", href: "/dashboard/trust", icon: Globe2 },
  { label: "Ask", href: "/dashboard/ask", icon: MessageSquare },
  { label: "Comply Agent", href: "/dashboard/comply-agent", icon: Sparkles, badge: "Soon" },
  { label: "Profile", href: "/dashboard/profile", icon: User },
] as const;

export function DashboardNav({ current }: { current: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <span className="font-bold tracking-tight">ComplyNG</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = current === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{l.label}</span>
                {l.badge && (
                  <span className="hidden rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline">
                    {l.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <ThemeToggle />
          <UserButton />
        </div>
      </nav>
    </header>
  );
}
