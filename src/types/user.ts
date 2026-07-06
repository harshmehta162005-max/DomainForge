import { z } from "zod"

export const UserSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketing_emails: z.boolean().default(false),
  weekly_digest: z.boolean().default(true),
  security_alerts: z.boolean().default(true),
  plan: z.string().default("free"),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>
