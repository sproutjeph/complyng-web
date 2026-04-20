import Link from "next/link";
import { Shield, MessageSquare, LayoutDashboard, User, FileText, Globe2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { label: "Obligations", href: "/dashboard", icon: LayoutDashboard },
  { label: "Policies", href: "/dashboard/policies", icon: FileText },
  { label: "Trust", href: "/dashboard/trust", icon: Globe2 },
  { label: "Ask", href: "/dashboard/ask", icon: MessageSquare },
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
