const stats = [
  { value: "40M+", label: "MSMEs in Nigeria" },
  { value: "6–12", label: "Regulators per Business" },
  { value: "90M+", label: "WhatsApp Users (NG)" },
  { value: "₦0", label: "To Get Started" },
] as const;

export function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Built for Nigerian businesses across every sector
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="font-heading text-3xl font-bold sm:text-4xl">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
