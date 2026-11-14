"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import {
  adminRefundReviewSchema,
  cancelSubscriptionSchema,
  createCheckoutSchema,
  reconcilePaymentSchema,
  refundRequestSchema,
} from "@/lib/validations/payment";
import { paymentService } from "@/server/payments/payment.service";
import { paymentVerificationService } from "@/server/payments/payment-verification.service";
import { subscriptionBillingService } from "@/server/payments/subscription-billing.service";
import { checkRateLimit } from "@/server/utils/rate-limit";
import type { CheckoutSessionResult } from "@/server/payments/payment.types";

export interface PaymentActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

async function getRequestContext() {
  try {
    const reqHeaders = await headers();
    return {
      ipAddress:
        reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        reqHeaders.get("x-real-ip") ||
        null,
      userAgent: reqHeaders.get("user-agent") || null,
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function initiateBkashCheckoutAction(
  input: unknown
): Promise<PaymentActionResult<CheckoutSessionResult>> {
  try {
    const user = await requireAuthenticatedUser();

    const rate = checkRateLimit({
      key: `checkout:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rate.allowed) {
      return {
        success: false,
        error: "Too many checkout requests. Please wait a minute before trying again.",
      };
    }

    const parsed = createCheckoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid checkout parameters.",
      };
    }

    const context = await getRequestContext();

    const session = await paymentService.initiateCheckout({
      userId: user.id,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      idempotencyKey: parsed.data.idempotencyKey,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing/history");

    return {
      success: true,
      message: "bKash checkout session created.",
      data: session,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to initiate bKash checkout."),
    };
  }
}

export async function cancelUserSubscriptionAction(
  input: unknown
): Promise<PaymentActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    const parsed = cancelSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid cancellation input.",
      };
    }

    const isAdmin = hasAnyRole(user.roles, [
      AppRole.ADMIN,
      AppRole.SUPER_ADMIN,
    ]);
    const context = await getRequestContext();

    const updated = await subscriptionBillingService.cancelSubscription({
      actorUserId: user.id,
      isAdmin,
      subscriptionId: parsed.data.subscriptionId,
      reason: parsed.data.reason,
      immediate: parsed.data.immediate,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/subscriptions");

    return {
      success: true,
      message: parsed.data.immediate
        ? "Subscription cancelled immediately."
        : "Subscription scheduled for cancellation at the end of your current billing period.",
      data: updated,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to cancel subscription."),
    };
  }
}

export async function requestPaymentRefundAction(
  input: unknown
): Promise<PaymentActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    const parsed = refundRequestSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid refund request.",
      };
    }

    const isAdmin = hasAnyRole(user.roles, [
      AppRole.ADMIN,
      AppRole.SUPER_ADMIN,
    ]);
    const context = await getRequestContext();

    const refund = await paymentService.requestRefund({
      actorUserId: user.id,
      isAdmin,
      paymentId: parsed.data.paymentId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    revalidatePath("/dashboard/billing/history");
    revalidatePath("/admin/refunds");
    revalidatePath(`/admin/payments/${parsed.data.paymentId}`);

    return {
      success: true,
      message: "Refund request submitted for administrative review.",
      data: refund,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to submit refund request."),
    };
  }
}

export async function reconcilePaymentAction(
  input: unknown
): Promise<PaymentActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    const parsed = reconcilePaymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid payment reconciliation request.",
      };
    }

    const isAdmin = hasAnyRole(user.roles, [
      AppRole.ADMIN,
      AppRole.SUPER_ADMIN,
    ]);
    const context = await getRequestContext();

    const result = await paymentVerificationService.reconcilePaymentById({
      paymentId: parsed.data.paymentId,
      actorUserId: user.id,
      isAdmin,
      reason: parsed.data.reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/billing/history");
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${parsed.data.paymentId}`);

    return {
      success: result.verified,
      message: result.message,
      error: result.verified ? undefined : result.message,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to reconcile payment with bKash."),
    };
  }
}

export async function adminProcessRefundAction(
  input: unknown
): Promise<PaymentActionResult> {
  try {
    const user = await requireAuthenticatedUser();

    // MODERATOR is strictly prohibited from accessing financial / refund administration
    if (!hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])) {
      return {
        success: false,
        error: "Unauthorized: Financial administrator privileges required.",
      };
    }

    const parsed = adminRefundReviewSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid refund review parameters.",
      };
    }

    const context = await getRequestContext();

    const result = await paymentService.processAdminRefundAction({
      adminUserId: user.id,
      refundId: parsed.data.refundId,
      action: parsed.data.action,
      adminNotes: parsed.data.adminNotes,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    revalidatePath("/admin/refunds");
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/billing/history");

    if (parsed.data.action === "REJECT") {
      return {
        success: true,
        message: result.message,
        data: result.refund,
      };
    }

    return {
      success: result.completed,
      message: result.message,
      error: result.completed ? undefined : result.message,
      data: result.refund,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to process administrative refund action."),
    };
  }
}

