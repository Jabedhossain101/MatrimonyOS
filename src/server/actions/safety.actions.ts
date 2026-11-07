"use server";

import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { safetyService } from "@/server/services/safety.service";
import {
  blockUserSchema,
  unblockUserSchema,
  reportUserSchema,
  type ReportUserInput,
} from "@/lib/validations/messaging";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Block a profile to prevent messaging and interactions.
 */
export async function blockUserAction(
  targetProfileId: string,
  reason?: string
): Promise<ActionResult<{ blocked: boolean }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = blockUserSchema.parse({ targetProfileId, reason });

    await safetyService.blockProfile(profile.id, valid.targetProfileId, valid.reason);

    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard/matches");
    return { success: true, data: { blocked: true } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to block member.",
    };
  }
}

/**
 * Unblock a previously blocked profile.
 */
export async function unblockUserAction(
  targetProfileId: string
): Promise<ActionResult<{ unblocked: boolean }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = unblockUserSchema.parse({ targetProfileId });

    await safetyService.unblockProfile(profile.id, valid.targetProfileId);

    revalidatePath("/dashboard/messages");
    return { success: true, data: { unblocked: true } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unblock member.",
    };
  }
}

/**
 * Submit a private safety report against a member or message.
 */
export async function reportUserAction(
  input: ReportUserInput
): Promise<ActionResult<{ reportId: string }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = reportUserSchema.parse(input);

    const report = await safetyService.submitReport({
      reporterProfileId: profile.id,
      reportedProfileId: valid.reportedProfileId,
      reportedMessageId: valid.reportedMessageId || null,
      reportedConversationId: valid.reportedConversationId || null,
      reason: valid.reason,
      description: valid.description || null,
    });

    return { success: true, data: { reportId: report.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit report.",
    };
  }
}

