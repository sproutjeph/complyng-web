"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  FileSignature,
  Loader2,
  Send,
  ShieldAlert,
  Timer,
} from "lucide-react";

interface ComplyAgentLandingProps {
  prefillEmail?: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

interface FieldErrors {
  fullName?: string;
  workEmail?: string;
  companyName?: string;
  message?: string;
  form?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ComplyAgentLanding({ prefillEmail }: ComplyAgentLandingProps) {
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState(prefillEmail ?? "");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "Please enter your full name";
    if (!workEmail.trim()) next.workEmail = "Please enter your work email";
    else if (!EMAIL_RE.test(workEmail.trim())) next.workEmail = "Enter a valid email address";
    if (!companyName.trim()) next.companyName = "Please enter your company name";
    if (message.length > 2000) next.message = "Please keep your message under 2000 characters";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setState("submitting");
    try {
      const res = await fetch("/api/comply-agent/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          workEmail: workEmail.trim(),
          companyName: companyName.trim(),
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }
      setState("success");
    } catch (err) {
      setState("error");
      setErrors({
        form: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Comply Agent
          </h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          An autonomous AI agent that watches your database for data breaches,
          drafts the NDPR incident report, and gets it to the regulator before
          the 72-hour deadline &mdash; with your compliance officer in the loop.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <ShieldAlert className="size-5 text-primary" />
            <CardTitle>Continuous breach detection</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Monitors your connected database for breach signals and anomalous
              access patterns, around the clock.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileSignature className="size-5 text-primary" />
            <CardTitle>Automated incident report</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Drafts the regulator-ready incident report the moment a breach is
              confirmed &mdash; grounded in NDPA requirements.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Timer className="size-5 text-primary" />
            <CardTitle>72-hour guardrail</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Routes the draft to your compliance officer for review, with
              countdown tracking against the NDPR deadline.
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Powered by{" "}
        <a
          href="https://openclaw.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          OpenClaw
        </a>
        {" "}and deployed on{" "}
        <a
          href="https://azure.microsoft.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Microsoft Azure
        </a>
        {" "}within your tenancy.
      </p>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        {state === "success" ? (
          <div className="flex flex-col items-start gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-5 text-primary" />
              Thanks &mdash; we&rsquo;ll reach out within 1 business day.
            </div>
            <p className="text-sm text-muted-foreground">
              Our team will email you at <strong>{workEmail.trim()}</strong> to
              scope the setup for <strong>{companyName.trim()}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">Request setup</h2>
              <p className="text-sm text-muted-foreground">
                Comply Agent ships as a managed deployment. Share a few details
                and our team will contact you to scope it.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="fullName"
                label="Full name"
                value={fullName}
                onChange={setFullName}
                placeholder="Ada Lovelace"
                error={errors.fullName}
                disabled={state === "submitting"}
                autoComplete="name"
              />
              <Field
                id="workEmail"
                label="Work email"
                type="email"
                value={workEmail}
                onChange={setWorkEmail}
                placeholder="ada@company.com"
                error={errors.workEmail}
                disabled={state === "submitting"}
                autoComplete="email"
              />
              <div className="sm:col-span-2">
                <Field
                  id="companyName"
                  label="Company name"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Acme Fintech Ltd"
                  error={errors.companyName}
                  disabled={state === "submitting"}
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium">
                Anything we should know? <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={state === "submitting"}
                rows={4}
                maxLength={2000}
                placeholder="Anything specific about your setup &mdash; DB type, data subjects, existing DPO process&hellip;"
                className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-sm text-destructive">{errors.form}</p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                We&rsquo;ll only use this to contact you about Comply Agent.
              </p>
              <Button type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Request setup
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  disabled,
  autoComplete,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
