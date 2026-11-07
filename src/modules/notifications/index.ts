/**
 * Notifications Module
 * Domain: In-app notification center, preferences, and transactional email dispatch
 */
export const NOTIFICATIONS_MODULE = "notifications";

export * from "@/server/services/notification.service";
export * from "@/server/services/email.service";
export * from "@/lib/validations/notifications";
