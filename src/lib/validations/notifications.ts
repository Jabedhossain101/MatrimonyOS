import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  inAppInterests: z.boolean().default(true),
  inAppMatches: z.boolean().default(true),
  inAppMessages: z.boolean().default(true),
  emailInterests: z.boolean().default(true),
  emailMatches: z.boolean().default(true),
  emailMessages: z.boolean().default(true),
  emailSystem: z.boolean().default(true),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

