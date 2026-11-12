"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { adminService, type RequestContext } from "@/server/services/admin.service";
import { moderationService } from "@/server/services/moderation.service";
import { subscriptionService } from "@/server/services/subscription.service";
import { platformSettingsService } from "@/server/services/platform-settings.service";
import {
  userStatusUpdateSchema,
  userRoleUpdateSchema,
  profileModerationSchema,
  photoModerationSchema,
  verificationReviewSchema,
  reportResolutionSchema,
  reportAssignSchema,
  planUpsertSchema,
  manualSubscriptionAdjustmentSchema,
  platformSettingUpdateSchema,
} from "@/lib/validations/admin";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

async function getRequestContext(): Promise<RequestContext> {
  try {
    const reqHeaders = await headers();
    return {
      ipAddress:
        reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        reqHeaders.get("x-real-ip"),
      userAgent: reqHeaders.get("user-agent"),
    };
  } catch {
    return {};
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

// ==========================================
// USER & ROLE MANAGEMENT ACTIONS
// ==========================================

export async function updateUserStatusAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // Only ADMIN and SUPER_ADMIN
    if (!hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])) {
      return { success: false, error: "Unauthorized: Administrator privileges required" };
    }

    const parsed = userStatusUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await adminService.updateUserStatus({
      actorUserId: user.id,
      actorRoles: user.roles,
      targetUserId: parsed.data.userId,
      status: parsed.data.status,
      reason: parsed.data.reason,
      context,
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, message: `User status updated to ${parsed.data.status}` };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update user status") };
  }
}

export async function updateUserRoleAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // Role assignment requires ADMIN or SUPER_ADMIN (SUPER_ADMIN only for privileged roles)
    if (!hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])) {
      return { success: false, error: "Unauthorized: Administrator privileges required" };
    }

    const parsed = userRoleUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await adminService.updateUserRole({
      actorUserId: user.id,
      actorRoles: user.roles,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
      action: parsed.data.action,
      reason: parsed.data.reason,
      context,
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      message: `Role ${parsed.data.role} ${parsed.data.action === "ASSIGN" ? "granted" : "revoked"} successfully`,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update user role") };
  }
}

// ==========================================
// PROFILE & CONTENT MODERATION ACTIONS
// ==========================================

export async function moderateProfileAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // MODERATOR, ADMIN, SUPER_ADMIN
    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return { success: false, error: "Unauthorized: Moderation privileges required" };
    }

    const parsed = profileModerationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await moderationService.moderateProfile({
      actorUserId: user.id,
      profileId: parsed.data.profileId,
      action: parsed.data.action,
      reason: parsed.data.reason,
      context,
    });

    revalidatePath("/admin/profiles");
    return {
      success: true,
      message: `Profile marked as ${parsed.data.action === "APPROVE" ? "Approved" : "Rejected"}`,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to moderate profile") };
  }
}

export async function moderatePhotoAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return { success: false, error: "Unauthorized: Moderation privileges required" };
    }

    const parsed = photoModerationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await moderationService.moderatePhoto({
      actorUserId: user.id,
      photoId: parsed.data.photoId,
      action: parsed.data.action,
      reason: parsed.data.reason,
      context,
    });

    revalidatePath("/admin/profiles");
    return {
      success: true,
      message: `Photo marked as ${parsed.data.action === "APPROVE" ? "Approved" : "Rejected"}`,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to moderate photo") };
  }
}

export async function reviewVerificationAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return { success: false, error: "Unauthorized: Verification privileges required" };
    }

    const parsed = verificationReviewSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await moderationService.reviewVerificationRequest({
      actorUserId: user.id,
      verificationId: parsed.data.verificationId,
      action: parsed.data.action,
      rejectionReason: parsed.data.rejectionReason,
      notes: parsed.data.notes,
      context,
    });

    revalidatePath("/admin/verifications");
    revalidatePath("/admin/profiles");
    revalidatePath("/admin");
    return {
      success: true,
      message: `Verification ${parsed.data.action === "APPROVE" ? "Approved" : "Rejected"}`,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to process verification") };
  }
}

// ==========================================
// REPORT ACTIONS
// ==========================================

export async function assignReportAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return { success: false, error: "Unauthorized: Moderation privileges required" };
    }

    const parsed = reportAssignSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await moderationService.assignReport({
      actorUserId: user.id,
      reportId: parsed.data.reportId,
      assignedToUserId: parsed.data.assignedToUserId,
      context,
    });

    revalidatePath("/admin/reports");
    return { success: true, message: "Report assigned successfully" };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to assign report") };
  }
}

export async function resolveReportAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return { success: false, error: "Unauthorized: Moderation privileges required" };
    }

    const parsed = reportResolutionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    await moderationService.resolveReport({
      actorUserId: user.id,
      reportId: parsed.data.reportId,
      status: parsed.data.status,
      resolutionNotes: parsed.data.resolutionNotes,
      suspendUser: parsed.data.suspendUser,
      suspensionReason: parsed.data.suspensionReason,
      context,
    });

    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    return { success: true, message: `Report marked as ${parsed.data.status}` };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to resolve report") };
  }
}

// ==========================================
// SUBSCRIPTION & PLAN ACTIONS
// ==========================================

export async function upsertPlanAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // MODERATOR is NOT allowed to manage plans
    if (!hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])) {
      return { success: false, error: "Unauthorized: Administrator privileges required" };
    }

    const parsed = planUpsertSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    const plan = await subscriptionService.upsertPlan({
      actorUserId: user.id,
      input: parsed.data,
      context,
    });

    revalidatePath("/admin/plans");
    return {
      success: true,
      message: `Subscription plan ${plan.name} saved successfully`,
      data: plan,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save subscription plan") };
  }
}

export async function manualAdjustSubscriptionAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // MODERATOR is NOT allowed to manage subscriptions
    if (!hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])) {
      return { success: false, error: "Unauthorized: Administrator privileges required" };
    }

    const parsed = manualSubscriptionAdjustmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    const sub = await subscriptionService.manualAdjustSubscription({
      actorUserId: user.id,
      input: parsed.data,
      context,
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return {
      success: true,
      message: "Subscription adjusted successfully",
      data: sub,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to adjust subscription") };
  }
}

// ==========================================
// PLATFORM SETTINGS ACTIONS
// ==========================================

export async function updatePlatformSettingAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // ONLY SUPER_ADMIN can configure platform settings
    if (!hasAnyRole(user.roles, [AppRole.SUPER_ADMIN])) {
      return {
        success: false,
        error: "Unauthorized: Only SUPER_ADMIN can modify platform settings",
      };
    }

    const parsed = platformSettingUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const context = await getRequestContext();

    const setting = await platformSettingsService.updateSetting({
      actorUserId: user.id,
      key: parsed.data.key,
      value: parsed.data.value,
      description: parsed.data.description,
      reason: parsed.data.reason,
      context,
    });

    revalidatePath("/admin/settings");
    return {
      success: true,
      message: `Setting ${setting.key} updated successfully`,
      data: setting,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update platform setting") };
  }
}

