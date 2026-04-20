import { Check } from "lucide-react";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/db/profile";

const STEP_LABELS: Record<OnboardingStep, string> = {
  basics: "Business basics",
  type: "Entity type",
  scale: "Scale & activity",
  licenses: "Licenses",
};

interface Props {
  current: OnboardingStep;
  completed: readonly OnboardingStep[];
  title: string;
  description: string;
  children: React.ReactNode;
}

export function WizardShell({ current, completed, title, description, children }: Props) {
  const currentIdx = ONBOARDING_STEPS.indexOf(current);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Step {currentIdx + 1} of {ONBOARDING_STEPS.length}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <ol className="flex items-center gap-2">
        {ONBOARDING_STEPS.map((step, idx) => {
          const isDone = completed.includes(step);
          const isCurrent = step === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDone
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {isDone && !isCurrent ? <Check className="size-3.5" /> : idx + 1}
              </div>
              <span
                className={`hidden text-xs sm:inline ${
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
              {idx < ONBOARDING_STEPS.length - 1 && (
                <span className="mx-1 h-px flex-1 bg-border" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6">{children}</div>
    </div>
  );
}
