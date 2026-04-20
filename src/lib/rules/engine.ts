import type {
  BusinessProfile,
  ComputedObligation,
  DueRule,
  Framework,
  Obligation,
  Trigger,
} from "./types";

export interface ComputeOptions {
  now?: Date;
  completedCodes?: ReadonlySet<string>;
}

export function computeObligations(
  profile: BusinessProfile,
  frameworks: readonly Framework[],
  opts: ComputeOptions = {},
): ComputedObligation[] {
  const now = opts.now ?? new Date();
  const completed = opts.completedCodes ?? new Set<string>();
  const out: ComputedObligation[] = [];

  for (const f of frameworks) {
    if (!f.appliesTo.includes(profile.entityType)) continue;
    for (const ob of f.obligations) {
      const match = triggerMatches(ob.trigger, profile);
      if (!match.applies) continue;
      const dueDate = nextDueDate(ob.dueRule, now);
      const status = statusFor(ob, dueDate, now, completed);
      out.push({
        framework: { code: f.code, name: f.name },
        obligation: ob,
        status,
        dueDate: dueDate ? toISODate(dueDate) : null,
        reason: match.reason,
      });
    }
  }

  return out.sort((a, b) => {
    const order = { overdue: 0, upcoming: 1, met: 2, not_applicable: 3 };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.obligation.code.localeCompare(b.obligation.code);
  });
}

function triggerMatches(
  t: Trigger,
  p: BusinessProfile,
): { applies: boolean; reason: string } {
  switch (t.type) {
    case "always":
      return { applies: true, reason: "Applies to all registered entities." };
    case "if_processes_personal_data":
      return {
        applies: p.processesPersonalData,
        reason: "Processes personal data of Nigerian residents.",
      };
    case "if_handles_payments":
      return {
        applies: p.handlesPayments,
        reason: "Handles payment flows.",
      };
    case "if_offers_digital_assets":
      return {
        applies: p.offersDigitalAssets,
        reason: "Offers or custodies digital assets.",
      };
    case "if_cbn_licensed":
      return {
        applies: p.isLicensedByCBN,
        reason: "Licensed or regulated by CBN.",
      };
    case "if_ncc_licensed":
      return {
        applies: p.isLicensedByNCC,
        reason: "Licensed or regulated by NCC.",
      };
    case "if_sec_licensed":
      return {
        applies: p.isLicensedBySEC,
        reason: "Registered with SEC as a VASP or digital asset issuer.",
      };
    case "if_users_over":
      return {
        applies: p.userCountNG >= t.threshold,
        reason: `More than ${t.threshold.toLocaleString()} Nigerian users.`,
      };
    case "if_entity_in":
      return {
        applies: t.entities.includes(p.entityType),
        reason: `Applies to ${t.entities.join(", ")} entities.`,
      };
  }
}

function nextDueDate(rule: DueRule, now: Date): Date | null {
  switch (rule.type) {
    case "once":
      return null;
    case "annual": {
      const y = now.getUTCFullYear();
      const candidate = new Date(Date.UTC(y, rule.month - 1, rule.day));
      if (candidate.getTime() < now.getTime()) {
        candidate.setUTCFullYear(y + 1);
      }
      return candidate;
    }
    case "quarterly": {
      const quarters = [0, 3, 6, 9];
      for (const m of quarters) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), m, rule.dayOfMonth));
        if (d.getTime() >= now.getTime()) return d;
      }
      return new Date(Date.UTC(now.getUTCFullYear() + 1, 0, rule.dayOfMonth));
    }
    case "monthly": {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), rule.dayOfMonth),
      );
      if (d.getTime() < now.getTime()) {
        d.setUTCMonth(d.getUTCMonth() + 1);
      }
      return d;
    }
    case "within_days_of_event":
      return null;
  }
}

function statusFor(
  ob: Obligation,
  dueDate: Date | null,
  now: Date,
  completed: ReadonlySet<string>,
): ComputedObligation["status"] {
  if (completed.has(ob.code)) return "met";
  if (!dueDate) return "upcoming";
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = (dueDate.getTime() - now.getTime()) / msPerDay;
  if (daysUntil < 0) return "overdue";
  return "upcoming";
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function complianceScore(obs: readonly ComputedObligation[]): number {
  const applicable = obs.filter((o) => o.status !== "not_applicable");
  if (applicable.length === 0) return 100;
  const met = applicable.filter((o) => o.status === "met").length;
  return Math.round((met / applicable.length) * 100);
}
