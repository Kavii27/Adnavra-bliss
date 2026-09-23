import { z } from "zod";

export const SETTING_KEYS = [
  "clients",
  "payments",
  "sales",
  "forms",
  "marketing",
  "scheduling",
  "loyalty",
  "branches",
] as const;

export const upsertSettingSchema = z.object({
  businessId: z.string().cuid(),
  key: z.enum(SETTING_KEYS),
  value: z.record(z.string(), z.unknown()),
});

export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
export type SettingKey = (typeof SETTING_KEYS)[number];
