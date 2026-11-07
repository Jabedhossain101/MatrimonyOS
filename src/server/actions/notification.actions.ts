"use server";

import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { notificationService } from "@/server/services/notification.service";
import {
  notificationPreferencesSchema,
  markNotificationReadSchema,
  type NotificationPreferencesInput,
} from "@/lib/validations/notifications";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get paginated notifications.
 */
export async function getNotificationsAction(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await notificationService.listNotifications(profile.id, options);
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load notifications.",
    };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = markNotificationReadSchema.parse({ notificationId });

    await notificationService.markAsRead(profile.id, valid.notificationId);

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark notification as read.",
    };
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    await notificationService.markAllAsRead(profile.id);

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark all as read.",
    };
  }
}

/**
 * Dismiss / delete a notification.
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = markNotificationReadSchema.parse({ notificationId });

    await notificationService.deleteNotification(profile.id, valid.notificationId);

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete notification.",
    };
  }
}

/**
 * Get notification preferences.
 */
export async function getNotificationPreferencesAction(): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const preferences = await notificationService.getOrCreatePreferences(profile.id);
    return { success: true, data: preferences };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load preferences.",
    };
  }
}

/**
 * Update notification preferences.
 */
export async function updateNotificationPreferencesAction(
  input: NotificationPreferencesInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = notificationPreferencesSchema.parse(input);

    const updated = await notificationService.updatePreferences(profile.id, valid);

    revalidatePath("/dashboard/settings/notifications");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notification preferences.",
    };
  }
}

