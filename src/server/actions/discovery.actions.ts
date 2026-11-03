"use server";

import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { discoveryService } from "@/server/services/discovery.service";
import { shortlistService } from "@/server/services/shortlist.service";
import { interestService } from "@/server/services/interest.service";
import { entitlementsService } from "@/server/services/entitlements.service";
import {
  discoveryFilterSchema,
  sendInterestSchema,
  respondInterestSchema,
  withdrawInterestSchema,
  toggleShortlistSchema,
  type SendInterestInput,
  type RespondInterestInput,
} from "@/lib/validations/discovery";
import { InterestStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Discover matrimonial profiles with advanced filters and compatibility scoring.
 */
export async function discoverProfilesAction(
  rawFilters: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const validFilters = discoveryFilterSchema.parse(rawFilters || {});

    const result = await discoveryService.discoverProfiles(
      user.id,
      profile.id,
      validFilters
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load discovery profiles.",
    };
  }
}

/**
 * Toggle shortlist on a target matrimonial profile.
 */
export async function toggleShortlistAction(
  targetProfileId: string
): Promise<ActionResult<{ isShortlisted: boolean; targetProfileId: string }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = toggleShortlistSchema.parse({ targetProfileId });

    const result = await shortlistService.toggleShortlist(
      user.id,
      profile.id,
      valid.targetProfileId
    );

    revalidatePath("/dashboard/discover");
    revalidatePath("/dashboard/shortlist");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update shortlist.",
    };
  }
}

/**
 * Retrieve current member's shortlisted profiles.
 */
export async function getMemberShortlistAction(
  options: { page?: number; limit?: number; query?: string } = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await shortlistService.getMemberShortlist(
      user.id,
      profile.id,
      options
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load shortlisted profiles.",
    };
  }
}

/**
 * Send a matrimonial interest.
 */
export async function sendInterestAction(
  input: SendInterestInput
): Promise<ActionResult<{ interestId: string; isMutualMatch: boolean }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = sendInterestSchema.parse(input);

    const result = await interestService.sendInterest(
      user.id,
      profile.id,
      valid.recipientProfileId,
      valid.message,
      user.roles
    );

    revalidatePath("/dashboard/discover");
    revalidatePath("/dashboard/interests");
    revalidatePath("/dashboard/matches");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to send matrimonial interest.",
    };
  }
}

/**
 * Accept or decline a received interest.
 */
export async function respondInterestAction(
  input: RespondInterestInput
): Promise<ActionResult<{ isMutualMatch: boolean }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = respondInterestSchema.parse(input);

    const result = await interestService.respondToInterest(
      profile.id,
      valid.interestId,
      valid.action
    );

    revalidatePath("/dashboard/interests");
    revalidatePath("/dashboard/matches");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to respond to interest.",
    };
  }
}

/**
 * Withdraw a pending sent interest.
 */
export async function withdrawInterestAction(
  interestId: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = withdrawInterestSchema.parse({ interestId });

    await interestService.withdrawInterest(profile.id, valid.interestId);

    revalidatePath("/dashboard/interests");
    revalidatePath("/dashboard/discover");

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to withdraw interest.",
    };
  }
}

/**
 * Get received matrimonial interests.
 */
export async function getReceivedInterestsAction(
  options: { status?: InterestStatus; page?: number; limit?: number } = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await interestService.getReceivedInterests(
      user.id,
      profile.id,
      options
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load received interests.",
    };
  }
}

/**
 * Get sent matrimonial interests.
 */
export async function getSentInterestsAction(
  options: { status?: InterestStatus; page?: number; limit?: number } = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await interestService.getSentInterests(
      user.id,
      profile.id,
      options
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load sent interests.",
    };
  }
}

/**
 * Get mutual matches for current member.
 */
export async function getMutualMatchesAction(
  options: { page?: number; limit?: number } = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await interestService.getMutualMatches(
      user.id,
      profile.id,
      options
    );

    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to load mutual matches.",
    };
  }
}

/**
 * Get interest quota information for current member.
 */
export async function getInterestQuotaAction(): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const quota = await entitlementsService.getInterestQuota(
      profile.id,
      user.roles
    );

    return { success: true, data: quota };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to get interest quota.",
    };
  }
}
