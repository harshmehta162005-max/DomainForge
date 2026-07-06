import { z } from "zod"

export const UserSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketing_emails: z.boolean().default(false),
  weekly_digest: z.boolean().default(true),
  security_alerts: z.boolean().default(true),
  notif_available: z.boolean().default(true),
  notif_expiry: z.boolean().default(true),
  notif_price: z.boolean().default(false),
  default_tlds: z.string().default(".com,.io,.ai"),
  auto_check: z.boolean().default(false),
  check_interval: z.string().default("6h"),
  plan: z.string().default("free"),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>
