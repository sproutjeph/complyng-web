import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Shield } from "lucide-react";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Frameworks", href: "#solutions" },
  { label: "Demo", href: "/dashboard" },
] as const;

export function AnnouncementBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:text-sm">
      <span>NDPC GAID 2025 took effect 19 Sept 2025.</span>
      <Link
        href="#platform"
        className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-80"
      >
        See how ComplyNG operationalises it
        <ArrowRight data-icon="inline-end" />
      </Link>
    </div>
  );
}

export async function Navbar() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <AnnouncementBanner />
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">ComplyNG</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex items-center gap-0.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isSignedIn ? (
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
              Open dashboard
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Log in
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
                Get Started
                <ArrowRight data-icon="inline-end" />
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
