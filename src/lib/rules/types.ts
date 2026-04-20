import { z } from "zod";

export const entityTypes = [
  "fintech",
  "platform",
  "telco",
  "digital_service_provider",
  "vasp",
] as const;
export type EntityType = (typeof entityTypes)[number];

export const BusinessProfileSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(entityTypes),
  processesPersonalData: z.boolean().default(true),
  userCountNG: z.number().int().nonnegative().default(0),
  handlesPayments: z.boolean().default(false),
  offersDigitalAssets: z.boolean().default(false),
  isLicensedByCBN: z.boolean().default(false),
  isLicensedByNCC: z.boolean().default(false),
  isLicensedBySEC: z.boolean().default(false),
});
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

const TriggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("if_processes_personal_data") }),
  z.object({ type: z.literal("if_handles_payments") }),
  z.object({ type: z.literal("if_offers_digital_assets") }),
  z.object({ type: z.literal("if_cbn_licensed") }),
  z.object({ type: z.literal("if_ncc_licensed") }),
  z.object({ type: z.literal("if_sec_licensed") }),
  z.object({
    type: z.literal("if_users_over"),
    threshold: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("if_entity_in"),
    entities: z.array(z.enum(entityTypes)).min(1),
  }),
]);
export type Trigger = z.infer<typeof TriggerSchema>;

const DueRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("once") }),
  z.object({
    type: z.literal("annual"),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  z.object({
    type: z.literal("quarterly"),
    dayOfMonth: z.number().int().min(1).max(31).default(15),
  }),
  z.object({
    type: z.literal("monthly"),
    dayOfMonth: z.number().int().min(1).max(31),
  }),
  z.object({
    type: z.literal("within_days_of_event"),
    days: z.number().int().positive(),
    event: z.string(),
  }),
]);
export type DueRule = z.infer<typeof DueRuleSchema>;

export const ObligationSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  clauseRef: z.string().min(1),
  sourceUrl: z.string().url(),
  trigger: TriggerSchema,
  dueRule: DueRuleSchema,
  penaltyKobo: z.number().int().nonnegative().nullable().default(null),
  verifyStatus: z.enum(["unverified", "counsel_reviewed"]).default("unverified"),
});
export type Obligation = z.infer<typeof ObligationSchema>;

export const FrameworkSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  statute: z.string().min(1),
  sourceUrl: z.string().url(),
  appliesTo: z.array(z.enum(entityTypes)).min(1),
  obligations: z.array(ObligationSchema),
});
export type Framework = z.infer<typeof FrameworkSchema>;

export type ObligationStatus = "met" | "upcoming" | "overdue" | "not_applicable";

export interface ComputedObligation {
  framework: { code: string; name: string };
  obligation: Obligation;
  status: ObligationStatus;
  dueDate: string | null;
  reason: string;
}
