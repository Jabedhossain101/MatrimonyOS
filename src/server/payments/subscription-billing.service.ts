import { db } from "@/server/db";
import {
  AppRole,
  BillingCycle,
  NotificationType,
  PaymentStatus,
  Prisma,
  SubscriptionEventType,
  SubscriptionStatus,
} from "@/generated/prisma";
import { auditService } from "@/server/services/audit.service";
import { AuthorizationError, NotFoundError } from "@/server/utils/errors";
import {
  formatCanonicalAmount,
  toMinorUnits,
  type VerifiedPaymentResult,
} from "./payment.types";
import { cancelBkashAgreement } from "./bkash/bkash.checkout";
import { getBkashConfig } from "./bkash/bkash.client";

export function getBillingCycleDurationDays(cycle: BillingCycle): number {
  switch (cycle) {
    case BillingCycle.MONTHLY:
      return 30;
    case BillingCycle.QUARTERLY:
      return 90;
    case BillingCycle.YEARLY:
      return 365;
    case BillingCycle.LIFETIME:
      return 36500;
    default:
      return 30;
  }
}

/**
 * Resolves the authoritative server-side price for a plan and billing cycle.
 * Never trusts client-supplied amounts.
 */
export function resolvePlanPriceForCycle(
  plan: {
    code: string;
    isActive: boolean;
    currency: string;
    priceMonthly: Prisma.Decimal | number | string;
    priceQuarterly: Prisma.Decimal | number | string | null;
    priceYearly: Prisma.Decimal | number | string | null;
  },
  billingCycle: BillingCycle
): { amount: string; currency: "BDT" } {
  if (!plan.isActive) {
    throw new AuthorizationError("Selected subscription plan is not active.");
  }

  if (plan.code === "FREE") {
    throw new AuthorizationError("The Free tier does not require payment checkout.");
  }

  let rawPrice: Prisma.Decimal | number | string | null = null;
  if (billingCycle === BillingCycle.MONTHLY) {
    rawPrice = plan.priceMonthly;
  } else if (billingCycle === BillingCycle.QUARTERLY) {
    rawPrice = plan.priceQuarterly;
  } else if (billingCycle === BillingCycle.YEARLY) {
    rawPrice = plan.priceYearly;
  } else {
    throw new AuthorizationError(`Unsupported billing cycle for checkout: ${billingCycle}`);
  }

  if (rawPrice === null || rawPrice === undefined) {
    throw new AuthorizationError(
      `Plan "${plan.code}" does not offer a ${billingCycle.toLowerCase()} billing option.`
    );
  }

  const minorUnits = toMinorUnits(rawPrice);
  if (minorUnits <= BigInt(0)) {
    throw new AuthorizationError("Paid plan checkout amount must be greater than zero BDT.");
  }

  return {
    amount: formatCanonicalAmount(rawPrice),
    currency: "BDT",
  };
}

function generateInvoiceNumber(paymentId: string, now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `INV-MOS-${yyyy}${mm}${dd}-${suffix}`;
}

export const subscriptionBillingService = {
  /**
   * Atomically marks a verified payment as SUCCEEDED and activates or extends the user's subscription.
   * Strictly idempotent: if the payment was already processed as SUCCEEDED, returns the existing records
   * without double-extending the billing period.
   */
  async activateSubscriptionFromVerifiedPayment(params: {
    paymentId: string;
    verification: VerifiedPaymentResult;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const { paymentId, verification, ipAddress, userAgent } = params;

    if (!verification.verified || verification.status !== PaymentStatus.SUCCEEDED) {
      throw new AuthorizationError(
        "Cannot activate subscription: payment has not passed verification."
      );
    }

    const result = await db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          plan: true,
          subscription: true,
        },
      });

      if (!payment) {
        throw new NotFoundError("Internal payment record not found.");
      }

      // Idempotency guard: if already SUCCEEDED and linked to a subscription, return immediately
      if (payment.status === PaymentStatus.SUCCEEDED && payment.subscriptionId) {
        const existingSub = await tx.userSubscription.findUnique({
          where: { id: payment.subscriptionId },
          include: { plan: { include: { entitlements: true } } },
        });
        return {
          alreadyProcessed: true,
          payment,
          subscription: existingSub,
        };
      }

      const now = new Date();
      const durationDays = getBillingCycleDurationDays(payment.billingCycle);
      const durationMs = durationDays * 24 * 60 * 60 * 1000;

      // Check if user has an existing active subscription
      const currentActiveSub = await tx.userSubscription.findFirst({
        where: {
          userId: payment.userId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: now },
        },
        orderBy: { currentPeriodEnd: "desc" },
      });

      let subscription;
      let eventType: SubscriptionEventType = SubscriptionEventType.CREATED;

      if (currentActiveSub && currentActiveSub.planId === payment.planId) {
        // Manual renewal on the same plan: extend from currentPeriodEnd
        eventType = SubscriptionEventType.RENEWED;
        const baseEnd =
          currentActiveSub.currentPeriodEnd > now
            ? currentActiveSub.currentPeriodEnd
            : now;
        const newPeriodEnd = new Date(baseEnd.getTime() + durationMs);

        subscription = await tx.userSubscription.update({
          where: { id: currentActiveSub.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            billingCycle: payment.billingCycle,
            currentPeriodEnd: newPeriodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            paymentProvider: "BKASH",
            events: {
              create: {
                eventType: SubscriptionEventType.RENEWED,
                fromStatus: currentActiveSub.status,
                toStatus: SubscriptionStatus.ACTIVE,
                actorUserId: payment.userId,
                reason: `Renewed via verified bKash payment (trxID: ${verification.providerTransactionId})`,
                metadata: {
                  paymentId: payment.id,
                  providerPaymentId: verification.providerPaymentId,
                  providerTransactionId: verification.providerTransactionId,
                  amount: verification.amount,
                  currency: verification.currency,
                },
              },
            },
          },
          include: { plan: { include: { entitlements: true } } },
        });
      } else {
        // If user had a different active subscription, mark the old one CANCELED (superseded by plan change)
        if (currentActiveSub) {
          eventType = SubscriptionEventType.PLAN_CHANGED;
          await tx.userSubscription.update({
            where: { id: currentActiveSub.id },
            data: {
              status: SubscriptionStatus.CANCELED,
              canceledAt: now,
              notes: `Superseded by plan change to ${payment.plan.code}`,
              events: {
                create: {
                  eventType: SubscriptionEventType.PLAN_CHANGED,
                  fromStatus: currentActiveSub.status,
                  toStatus: SubscriptionStatus.CANCELED,
                  actorUserId: payment.userId,
                  reason: `Plan changed to ${payment.plan.code}`,
                },
              },
            },
          });
        }

        const newPeriodEnd = new Date(now.getTime() + durationMs);
        subscription = await tx.userSubscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            status: SubscriptionStatus.ACTIVE,
            billingCycle: payment.billingCycle,
            startDate: now,
            currentPeriodStart: now,
            currentPeriodEnd: newPeriodEnd,
            cancelAtPeriodEnd: false,
            paymentProvider: "BKASH",
            notes: `Activated via verified bKash checkout (${verification.providerTransactionId})`,
            events: {
              create: {
                eventType,
                fromStatus: currentActiveSub ? currentActiveSub.status : null,
                toStatus: SubscriptionStatus.ACTIVE,
                actorUserId: payment.userId,
                reason: `Verified bKash payment (${verification.providerTransactionId})`,
                metadata: {
                  paymentId: payment.id,
                  providerPaymentId: verification.providerPaymentId,
                  providerTransactionId: verification.providerTransactionId,
                  amount: verification.amount,
                  currency: verification.currency,
                  planCode: payment.plan.code,
                },
              },
            },
          },
          include: { plan: { include: { entitlements: true } } },
        });
      }

      const invoiceNumber =
        payment.invoiceNumber || generateInvoiceNumber(payment.id, now);

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          subscriptionId: subscription.id,
          providerPaymentId: verification.providerPaymentId,
          providerTransactionId: verification.providerTransactionId,
          customerMsisdn: verification.customerMsisdn,
          invoiceNumber,
          paidAt: now,
          failureReason: null,
          metadata: {
            ...(typeof payment.metadata === "object" && payment.metadata !== null
              ? (payment.metadata as Record<string, unknown>)
              : {}),
            verification: verification.rawMetadata as Prisma.InputJsonValue,
          },
        },
        include: {
          plan: true,
        },
      });

      // Grant PREMIUM_MEMBER role if paid tier
      if (payment.plan.code !== "FREE") {
        await tx.userRole.upsert({
          where: {
            userId_role: {
              userId: payment.userId,
              role: AppRole.PREMIUM_MEMBER,
            },
          },
          create: {
            userId: payment.userId,
            role: AppRole.PREMIUM_MEMBER,
          },
          update: {},
        });
      }

      // Send in-app notification if user has a matrimonial profile
      const profile = await tx.matrimonialProfile.findUnique({
        where: { userId: payment.userId },
        select: { id: true },
      });

      if (profile) {
        await tx.notification.create({
          data: {
            recipientProfileId: profile.id,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: `${payment.plan.name} Membership Activated`,
            body: `Your bKash payment of ${ updatedPayment.amount.toString()} ${updatedPayment.currency} (TrxID: ${verification.providerTransactionId}) has been verified. Your ${payment.plan.name} entitlements are now active until ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
            link: "/dashboard/billing",
            entityId: subscription.id,
          },
        });
      }

      return {
        alreadyProcessed: false,
        payment: updatedPayment,
        subscription,
      };
    });

    if (!result.alreadyProcessed) {
      await auditService.record({
        actorUserId: result.payment.userId,
        action: "PAYMENT_VERIFIED_SUBSCRIPTION_ACTIVATED",
        entityType: "PAYMENT",
        entityId: result.payment.id,
        reason: `Verified bKash payment trxID ${verification.providerTransactionId}`,
        metadata: {
          subscriptionId: result.subscription?.id,
          planCode: result.payment.plan.code,
          amount: result.payment.amount.toString(),
          currency: result.payment.currency,
          providerPaymentId: verification.providerPaymentId,
          providerTransactionId: verification.providerTransactionId,
          invoiceNumber: result.payment.invoiceNumber,
        },
        ipAddress,
        userAgent,
      });
    }

    return result;
  },

  /**
   * Records a failed or cancelled payment without granting any paid subscription or entitlement.
   */
  async recordUnsuccessfulPayment(params: {
    paymentId: string;
    status: PaymentStatus;
    failureReason: string;
    providerPaymentId?: string | null;
    rawMetadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      paymentId,
      status,
      failureReason,
      providerPaymentId,
      rawMetadata,
      ipAddress,
      userAgent,
    } = params;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });

    if (!payment) {
      throw new NotFoundError("Payment record not found.");
    }

    // Never overwrite a previously succeeded payment with a failure
    if (
      payment.status === PaymentStatus.SUCCEEDED ||
      payment.status === PaymentStatus.REFUNDED ||
      payment.status === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      return payment;
    }

    const now = new Date();
    const targetStatus =
      status === PaymentStatus.CANCELED
        ? PaymentStatus.CANCELED
        : status === PaymentStatus.PENDING
        ? PaymentStatus.PENDING
        : PaymentStatus.FAILED;

    const updated = await db.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetStatus,
          providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
          failureReason,
          failedAt: targetStatus === PaymentStatus.FAILED ? now : payment.failedAt,
          canceledAt:
            targetStatus === PaymentStatus.CANCELED ? now : payment.canceledAt,
          metadata: {
            ...(typeof payment.metadata === "object" && payment.metadata !== null
              ? (payment.metadata as Record<string, unknown>)
              : {}),
            ...(rawMetadata
              ? { lastFailureMetadata: rawMetadata as Prisma.InputJsonValue }
              : {}),
          },
        },
        include: { plan: true },
      });

      if (payment.subscriptionId && targetStatus === PaymentStatus.FAILED) {
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: payment.subscriptionId,
            eventType: SubscriptionEventType.PAYMENT_FAILED,
            toStatus: SubscriptionStatus.PAST_DUE,
            actorUserId: payment.userId,
            reason: failureReason,
            metadata: {
              paymentId: payment.id,
              providerPaymentId: p.providerPaymentId,
            },
          },
        });
      }

      return p;
    });

    if (targetStatus !== PaymentStatus.PENDING) {
      await auditService.record({
        actorUserId: payment.userId,
        action:
          targetStatus === PaymentStatus.CANCELED
            ? "PAYMENT_CANCELED"
            : "PAYMENT_FAILED",
        entityType: "PAYMENT",
        entityId: payment.id,
        reason: failureReason,
        metadata: {
          planCode: payment.plan.code,
          amount: payment.amount.toString(),
          currency: payment.currency,
          providerPaymentId: updated.providerPaymentId,
        },
        ipAddress,
        userAgent,
      });
    }

    return updated;
  },

  /**
   * Cancels a user's subscription.
   * By default (`immediate: false`), sets `cancelAtPeriodEnd: true` so the user retains
   * paid entitlements through the end of their already-paid billing period.
   * If `immediate: true`, terminates the subscription immediately and revokes paid entitlements.
   */
  async cancelSubscription(params: {
    actorUserId: string;
    isAdmin?: boolean;
    subscriptionId: string;
    reason: string;
    immediate?: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      actorUserId,
      isAdmin = false,
      subscriptionId,
      reason,
      immediate = false,
      ipAddress,
      userAgent,
    } = params;

    const subscription = await db.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundError("Subscription not found.");
    }

    if (!isAdmin && subscription.userId !== actorUserId) {
      throw new AuthorizationError(
        "Forbidden: You can only cancel your own subscription."
      );
    }

    if (
      subscription.status === SubscriptionStatus.CANCELED ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      return subscription;
    }

    // If a tokenized bKash agreement exists and agreement API is enabled, cancel it on provider
    const bkashConfig = getBkashConfig();
    if (
      subscription.externalSubscriptionId &&
      subscription.paymentProvider === "BKASH" &&
      bkashConfig.agreementEnabled
    ) {
      try {
        await cancelBkashAgreement(subscription.externalSubscriptionId);
      } catch (err) {
        console.error(
          "[SubscriptionBillingService] Provider agreement cancellation notice:",
          err instanceof Error ? err.message : "unknown"
        );
      }
    }

    const now = new Date();
    const newStatus = immediate
      ? SubscriptionStatus.CANCELED
      : subscription.status;

    const updated = await db.$transaction(async (tx) => {
      const sub = await tx.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          cancelAtPeriodEnd: !immediate,
          canceledAt: now,
          notes: reason,
          events: {
            create: {
              eventType: SubscriptionEventType.CANCELED,
              fromStatus: subscription.status,
              toStatus: immediate
                ? SubscriptionStatus.CANCELED
                : `${subscription.status}_CANCEL_AT_PERIOD_END`,
              actorUserId,
              reason,
              metadata: {
                immediate,
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              },
            },
          },
        },
        include: { plan: true },
      });

      if (immediate) {
        // Check if user has any other active paid subscriptions
        const otherActiveCount = await tx.userSubscription.count({
          where: {
            userId: subscription.userId,
            id: { not: subscription.id },
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gte: now },
          },
        });

        if (otherActiveCount === 0) {
          await tx.userRole.deleteMany({
            where: {
              userId: subscription.userId,
              role: AppRole.PREMIUM_MEMBER,
            },
          });
        }
      }

      return sub;
    });

    await auditService.record({
      actorUserId,
      action: immediate
        ? "SUBSCRIPTION_CANCELED_IMMEDIATELY"
        : "SUBSCRIPTION_CANCELED_AT_PERIOD_END",
      entityType: "USER_SUBSCRIPTION",
      entityId: subscription.id,
      reason,
      metadata: {
        userId: subscription.userId,
        planCode: subscription.plan.code,
        immediate,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      },
      ipAddress,
      userAgent,
    });

    return updated;
  },

  /**
   * Idempotent scheduled maintenance job for expiring elapsed subscriptions,
   * revoking expired entitlements, and marking abandoned pending checkouts as EXPIRED.
   */
  async processSubscriptionLifecycleCron() {
    const now = new Date();

    // 1. Find all subscriptions whose period has ended but are still marked ACTIVE, TRIALING, or PAST_DUE
    const expiredCandidates = await db.userSubscription.findMany({
      where: {
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
        currentPeriodEnd: { lt: now },
      },
      include: { plan: true },
    });

    let expiredSubscriptionsCount = 0;

    for (const sub of expiredCandidates) {
      await db.$transaction(async (tx) => {
        await tx.userSubscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
            events: {
              create: {
                eventType: SubscriptionEventType.EXPIRED,
                fromStatus: sub.status,
                toStatus: SubscriptionStatus.EXPIRED,
                reason: "Billing period reached expiration date.",
                metadata: {
                  expiredAt: now.toISOString(),
                  periodEnd: sub.currentPeriodEnd.toISOString(),
                },
              },
            },
          },
        });

        // Check if the user has any other currently active subscription before removing PREMIUM_MEMBER
        const remainingActive = await tx.userSubscription.count({
          where: {
            userId: sub.userId,
            id: { not: sub.id },
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gte: now },
          },
        });

        if (remainingActive === 0) {
          await tx.userRole.deleteMany({
            where: {
              userId: sub.userId,
              role: AppRole.PREMIUM_MEMBER,
            },
          });
        }

        // Notify user profile of expiration and manual renewal availability
        const profile = await tx.matrimonialProfile.findUnique({
          where: { userId: sub.userId },
          select: { id: true },
        });

        if (profile) {
          await tx.notification.create({
            data: {
              recipientProfileId: profile.id,
              type: NotificationType.SYSTEM_ANNOUNCEMENT,
              title: `${sub.plan.name} Membership Expired`,
              body: `Your ${sub.plan.name} subscription period has ended and your account has returned to the Free tier. You can renew anytime via bKash checkout.`,
              link: "/dashboard/billing",
              entityId: sub.id,
            },
          });
        }
      });

      expiredSubscriptionsCount++;
    }

    // 2. Expire abandoned PENDING / INITIATED payments older than 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const expiredPaymentsResult = await db.payment.updateMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.INITIATED] },
        OR: [
          { expiresAt: { lt: now } },
          { expiresAt: null, createdAt: { lt: twoHoursAgo } },
        ],
      },
      data: {
        status: PaymentStatus.EXPIRED,
        failureReason: "Checkout session expired without completion.",
      },
    });

    return {
      processedAt: now.toISOString(),
      expiredSubscriptionsCount,
      expiredPaymentsCount: expiredPaymentsResult.count,
    };
  },
};

