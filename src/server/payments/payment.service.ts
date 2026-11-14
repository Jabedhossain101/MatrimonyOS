import crypto from "node:crypto";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import {
  BillingCycle,
  PaymentStatus,
  Prisma,
  RefundStatus,
  WebhookProcessingStatus,
} from "@/generated/prisma";
import { auditService } from "@/server/services/audit.service";
import { AuthorizationError, NotFoundError } from "@/server/utils/errors";
import {
  formatCanonicalAmount,
  toMinorUnits,
  type CheckoutSessionResult,
} from "./payment.types";
import { getPaymentProvider } from "./payment-registry";
import { paymentVerificationService } from "./payment-verification.service";
import { resolvePlanPriceForCycle } from "./subscription-billing.service";
import {
  computeWebhookPayloadHash,
  isTrustedSnsSubscribeUrl,
  parseBkashSnsNotificationMessage,
  verifyBkashSnsWebhookSignature,
} from "./bkash/bkash.webhook";

function generateInternalTransactionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MOS-${ts}-${rand}`;
}

export const paymentService = {
  /**
   * Initiates a secure server-side bKash checkout session for a subscription plan.
   * Never trusts client-supplied amounts, currencies, or status flags.
   */
  async initiateCheckout(params: {
    userId: string;
    planId: string;
    billingCycle: BillingCycle;
    idempotencyKey: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<CheckoutSessionResult> {
    const {
      userId,
      planId,
      billingCycle,
      idempotencyKey,
      ipAddress,
      userAgent,
    } = params;

    const provider = getPaymentProvider("BKASH");
    if (!env.PAYMENTS_ENABLED || !provider.isConfigured()) {
      throw new AuthorizationError(
        "bKash payment checkout is currently disabled or awaiting merchant credential configuration."
      );
    }

    // 1. Check idempotency key first
    const existingByIdempotency = await db.payment.findUnique({
      where: { idempotencyKey },
      include: { plan: true },
    });

    if (existingByIdempotency) {
      if (existingByIdempotency.userId !== userId) {
        throw new AuthorizationError("Idempotency key collision across accounts.");
      }
      if (
        existingByIdempotency.planId !== planId ||
        existingByIdempotency.billingCycle !== billingCycle
      ) {
        throw new AuthorizationError(
          "Idempotency key cannot be reused with different checkout parameters."
        );
      }

      const meta = (existingByIdempotency.metadata ?? {}) as Record<
        string,
        unknown
      >;
      if (
        existingByIdempotency.providerPaymentId &&
        typeof meta.checkoutUrl === "string" &&
        meta.checkoutUrl.length > 0 &&
        (existingByIdempotency.status === PaymentStatus.INITIATED ||
          existingByIdempotency.status === PaymentStatus.PENDING)
      ) {
        return {
          paymentId: existingByIdempotency.id,
          internalTransactionId: existingByIdempotency.internalTransactionId,
          providerPaymentId: existingByIdempotency.providerPaymentId,
          checkoutUrl: meta.checkoutUrl,
          amount: formatCanonicalAmount(existingByIdempotency.amount),
          currency: existingByIdempotency.currency,
          planCode: existingByIdempotency.plan.code,
          billingCycle: existingByIdempotency.billingCycle,
        };
      }
    }

    // 2. Fetch authoritative plan from database
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError("Selected subscription plan does not exist.");
    }

    const { amount, currency } = resolvePlanPriceForCycle(plan, billingCycle);

    // 3. Create internal pending payment record
    const internalTransactionId = generateInternalTransactionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hour validity

    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
    const callbackUrl = `${baseUrl}/api/payments/bkash/callback`;

    const pendingPayment = await db.payment.create({
      data: {
        userId,
        planId: plan.id,
        billingCycle,
        provider: "BKASH",
        internalTransactionId,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        idempotencyKey,
        paymentMethod: "BKASH_CHECKOUT",
        payerReference: userId,
        expiresAt,
        metadata: {
          planCode: plan.code,
          planName: plan.name,
          billingCycle,
        },
      },
    });

    try {
      // 4. Call official bKash Create Payment API
      const providerOrder = await provider.createPayment({
        internalTransactionId,
        payerReference: userId,
        amount,
        currency,
        callbackUrl,
      });

      const updatedPayment = await db.payment.update({
        where: { id: pendingPayment.id },
        data: {
          providerPaymentId: providerOrder.providerPaymentId,
          status: PaymentStatus.INITIATED,
          metadata: {
            planCode: plan.code,
            planName: plan.name,
            billingCycle,
            checkoutUrl: providerOrder.checkoutUrl,
            providerCreate: providerOrder.rawMetadata as Prisma.InputJsonValue,
          },
        },
      });

      await auditService.record({
        actorUserId: userId,
        action: "PAYMENT_CHECKOUT_INITIATED",
        entityType: "PAYMENT",
        entityId: updatedPayment.id,
        metadata: {
          internalTransactionId,
          providerPaymentId: providerOrder.providerPaymentId,
          planCode: plan.code,
          billingCycle,
          amount,
          currency,
        },
        ipAddress,
        userAgent,
      });

      return {
        paymentId: updatedPayment.id,
        internalTransactionId: updatedPayment.internalTransactionId,
        providerPaymentId: providerOrder.providerPaymentId,
        checkoutUrl: providerOrder.checkoutUrl,
        amount,
        currency,
        planCode: plan.code,
        billingCycle,
      };
    } catch (err: unknown) {
      const reason =
        err instanceof Error
          ? err.message
          : "Failed to initialize bKash checkout.";
      await db.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: reason,
        },
      });
      throw err;
    }
  },

  /**
   * Lists a user's own payment and billing history.
   */
  async listUserPayments(params: {
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where: { userId: params.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              billingCycle: true,
            },
          },
          refunds: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      db.payment.count({ where: { userId: params.userId } }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Retrieves a specific payment / receipt record with strict IDOR ownership protection.
   * Only the owner of the payment or an authorized administrator may access it.
   */
  async getPaymentForViewer(params: {
    paymentId: string;
    viewerUserId: string;
    isAdmin?: boolean;
  }) {
    const payment = await db.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          include: { entitlements: true },
        },
        subscription: true,
        refunds: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment record not found.");
    }

    if (!params.isAdmin && payment.userId !== params.viewerUserId) {
      throw new AuthorizationError(
        "Forbidden: You are not authorized to access another member's billing record."
      );
    }

    return payment;
  },

  /**
   * Lists only verified SUCCEEDED / REFUNDED payments with generated invoice numbers for the user.
   * Failed or pending transactions are never presented as paid receipts.
   */
  async listUserInvoices(userId: string) {
    return db.payment.findMany({
      where: {
        userId,
        status: {
          in: [
            PaymentStatus.SUCCEEDED,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUNDED,
          ],
        },
        paidAt: { not: null },
      },
      orderBy: { paidAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subscription: {
          select: {
            id: true,
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
        refunds: {
          where: { status: RefundStatus.COMPLETED },
        },
      },
    });
  },

  /**
   * Records a refund request for a completed payment.
   */
  async requestRefund(params: {
    actorUserId: string;
    isAdmin?: boolean;
    paymentId: string;
    amount: string;
    reason: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      actorUserId,
      isAdmin = false,
      paymentId,
      amount,
      reason,
      ipAddress,
      userAgent,
    } = params;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });

    if (!payment) {
      throw new NotFoundError("Payment record not found.");
    }

    if (!isAdmin && payment.userId !== actorUserId) {
      throw new AuthorizationError(
        "Forbidden: You can only request a refund for your own payment."
      );
    }

    if (
      payment.status !== PaymentStatus.SUCCEEDED &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new AuthorizationError(
        "Only verified succeeded payments are eligible for refund requests."
      );
    }

    if (!payment.providerPaymentId || !payment.providerTransactionId) {
      throw new AuthorizationError(
        "Payment is missing bKash provider references required for refund."
      );
    }

    const requestedMinor = toMinorUnits(amount);
    const totalPaymentMinor = toMinorUnits(payment.amount);

    const alreadyRefundedOrPendingMinor = payment.refunds
      .filter(
        (r) =>
          r.status === RefundStatus.COMPLETED ||
          r.status === RefundStatus.PROCESSING ||
          r.status === RefundStatus.REQUESTED
      )
      .reduce((acc, r) => acc + toMinorUnits(r.amount), BigInt(0));

    if (requestedMinor + alreadyRefundedOrPendingMinor > totalPaymentMinor) {
      throw new AuthorizationError(
        "Requested refund amount exceeds the remaining refundable balance of this payment."
      );
    }

    const refund = await db.paymentRefund.create({
      data: {
        paymentId: payment.id,
        requestedByUserId: actorUserId,
        originalTrxId: payment.providerTransactionId,
        amount: formatCanonicalAmount(amount),
        currency: payment.currency,
        status: RefundStatus.REQUESTED,
        reason,
      },
    });

    await auditService.record({
      actorUserId,
      action: "PAYMENT_REFUND_REQUESTED",
      entityType: "PAYMENT_REFUND",
      entityId: refund.id,
      reason,
      metadata: {
        paymentId: payment.id,
        amount: formatCanonicalAmount(amount),
        currency: payment.currency,
        originalTrxId: payment.providerTransactionId,
      },
      ipAddress,
      userAgent,
    });

    return refund;
  },

  /**
   * Admin review and provider execution/query of a refund request.
   * Never marks a refund COMPLETED unless verified by bKash response (`statusCode === "0000"`, `transactionStatus === "Completed"`, `refundTrxID`).
   */
  async processAdminRefundAction(params: {
    adminUserId: string;
    refundId: string;
    action: "EXECUTE_PROVIDER_REFUND" | "QUERY_STATUS" | "REJECT";
    adminNotes: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      adminUserId,
      refundId,
      action,
      adminNotes,
      ipAddress,
      userAgent,
    } = params;

    const refund = await db.paymentRefund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          include: { plan: true, refunds: true },
        },
      },
    });

    if (!refund) {
      throw new NotFoundError("Refund record not found.");
    }

    if (refund.status === RefundStatus.COMPLETED) {
      return {
        completed: true,
        refund,
        message: "Refund has already been verified and completed.",
      };
    }

    if (action === "REJECT") {
      const rejected = await db.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.REJECTED,
          reviewedByUserId: adminUserId,
          adminNotes,
        },
      });

      await auditService.record({
        actorUserId: adminUserId,
        action: "PAYMENT_REFUND_REJECTED",
        entityType: "PAYMENT_REFUND",
        entityId: refund.id,
        reason: adminNotes,
        metadata: {
          paymentId: refund.paymentId,
          amount: refund.amount.toString(),
        },
        ipAddress,
        userAgent,
      });

      return {
        completed: false,
        refund: rejected,
        message: "Refund request rejected.",
      };
    }

    const payment = refund.payment;
    if (!payment.providerPaymentId || !payment.providerTransactionId) {
      throw new AuthorizationError(
        "Cannot process provider refund: payment lacks bKash paymentID or trxID."
      );
    }

    const provider = getPaymentProvider("BKASH");
    if (!env.PAYMENTS_ENABLED || !provider.isConfigured()) {
      throw new AuthorizationError(
        "bKash gateway is not configured to execute live/sandbox refund calls."
      );
    }

    const providerResult =
      action === "QUERY_STATUS"
        ? await provider.queryRefundStatus({
            providerPaymentId: payment.providerPaymentId,
            providerTransactionId: payment.providerTransactionId,
          })
        : await provider.refundTransaction({
            providerPaymentId: payment.providerPaymentId,
            providerTransactionId: payment.providerTransactionId,
            amount: formatCanonicalAmount(refund.amount),
            sku: payment.plan.code,
            reason: refund.reason,
          });

    if (providerResult.completed && providerResult.providerRefundId) {
      const now = new Date();
      const updatedRefund = await db.$transaction(async (tx) => {
        const r = await tx.paymentRefund.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.COMPLETED,
            reviewedByUserId: adminUserId,
            providerRefundId: providerResult.providerRefundId,
            adminNotes,
            failureReason: null,
            completedAt: now,
            metadata: providerResult.rawMetadata as Prisma.InputJsonValue,
          },
        });

        // Calculate total completed refunds on this payment
        const allCompletedRefunds = await tx.paymentRefund.findMany({
          where: {
            paymentId: payment.id,
            status: RefundStatus.COMPLETED,
          },
        });

        const totalRefundedMinor = allCompletedRefunds.reduce(
          (acc, item) => acc + toMinorUnits(item.amount),
          BigInt(0)
        );
        const paymentTotalMinor = toMinorUnits(payment.amount);

        const newPaymentStatus =
          totalRefundedMinor >= paymentTotalMinor
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        return r;
      });

      await auditService.record({
        actorUserId: adminUserId,
        action: "PAYMENT_REFUND_VERIFIED_COMPLETED",
        entityType: "PAYMENT_REFUND",
        entityId: refund.id,
        reason: adminNotes,
        metadata: {
          paymentId: payment.id,
          providerRefundId: providerResult.providerRefundId,
          originalTrxId: payment.providerTransactionId,
          amount: refund.amount.toString(),
          currency: refund.currency,
        },
        ipAddress,
        userAgent,
      });

      return {
        completed: true,
        refund: updatedRefund,
        message: `Refund verified and completed by bKash (Refund TrxID: ${providerResult.providerRefundId}).`,
      };
    }

    // Provider did not confirm completion
    const failedRefund = await db.paymentRefund.update({
      where: { id: refund.id },
      data: {
        status: RefundStatus.FAILED,
        reviewedByUserId: adminUserId,
        adminNotes,
        failureReason:
          providerResult.failureReason ||
          "bKash did not confirm refund completion.",
        metadata: providerResult.rawMetadata as Prisma.InputJsonValue,
      },
    });

    await auditService.record({
      actorUserId: adminUserId,
      action: "PAYMENT_REFUND_PROVIDER_FAILED",
      entityType: "PAYMENT_REFUND",
      entityId: refund.id,
      reason: providerResult.failureReason || adminNotes,
      metadata: {
        paymentId: payment.id,
        statusCode: providerResult.statusCode,
        statusMessage: providerResult.statusMessage,
      },
      ipAddress,
      userAgent,
    });

    return {
      completed: false,
      refund: failedRefund,
      message:
        providerResult.failureReason ||
        "Refund was not completed by bKash.",
    };
  },

  /**
   * Processes incoming bKash AWS SNS webhook events with strict cryptographic verification,
   * SSRF protection, replay/duplicate prevention, and server-side payment verification.
   */
  async processBkashWebhook(params: {
    rawBody: string;
    fetchImpl?: typeof fetch;
    maxAgeMs?: number;
  }) {
    if (!env.BKASH_WEBHOOK_ENABLED) {
      return {
        acknowledged: false,
        status: 403,
        message: "bKash webhook notifications are not enabled on this server.",
      };
    }

    const payloadHash = computeWebhookPayloadHash(params.rawBody);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(params.rawBody);
    } catch {
      return {
        acknowledged: false,
        status: 400,
        message: "Malformed JSON webhook body.",
      };
    }

    const verification = await verifyBkashSnsWebhookSignature(parsedJson, {
      fetchImpl: params.fetchImpl,
      maxAgeMs: params.maxAgeMs,
    });

    if (!verification.valid || !verification.envelope) {
      return {
        acknowledged: false,
        status: 401,
        message:
          verification.reason || "Webhook signature verification failed.",
      };
    }

    const envelope = verification.envelope;

    // Deduplication check by providerEventId (SNS MessageId) or payloadHash
    const existingEvent = await db.paymentWebhookEvent.findFirst({
      where: {
        OR: [
          { providerEventId: envelope.MessageId },
          { payloadHash },
        ],
      },
    });

    if (
      existingEvent &&
      (existingEvent.processingStatus === WebhookProcessingStatus.PROCESSED ||
        existingEvent.processingStatus === WebhookProcessingStatus.IGNORED)
    ) {
      return {
        acknowledged: true,
        duplicate: true,
        status: 200,
        message: "Duplicate webhook event already processed.",
      };
    }

    const webhookEvent = existingEvent
      ? existingEvent
      : await db.paymentWebhookEvent.create({
          data: {
            provider: "BKASH",
            providerEventId: envelope.MessageId,
            eventType: envelope.Type,
            processingStatus: WebhookProcessingStatus.RECEIVED,
            payloadHash,
            rawPayload: parsedJson as Prisma.InputJsonValue,
          },
        });

    try {
      if (envelope.Type === "SubscriptionConfirmation") {
        if (
          !envelope.SubscribeURL ||
          !isTrustedSnsSubscribeUrl(envelope.SubscribeURL)
        ) {
          await db.paymentWebhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              processingStatus: WebhookProcessingStatus.FAILED,
              failureReason:
                "Untrusted or missing SubscribeURL in SubscriptionConfirmation.",
            },
          });
          return {
            acknowledged: false,
            status: 400,
            message: "Untrusted SubscribeURL rejected.",
          };
        }

        const fetchFn = params.fetchImpl ?? globalThis.fetch;
        const confirmRes = await fetchFn(envelope.SubscribeURL, {
          method: "GET",
          redirect: "error",
        });

        if (!confirmRes.ok) {
          throw new Error(
            `SNS SubscriptionConfirmation GET failed (HTTP ${confirmRes.status}).`
          );
        }

        await db.paymentWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processingStatus: WebhookProcessingStatus.PROCESSED,
            processedAt: new Date(),
          },
        });

        return {
          acknowledged: true,
          status: 200,
          message: "SNS SubscriptionConfirmation verified and confirmed.",
        };
      }

      if (envelope.Type === "Notification") {
        const notification = parseBkashSnsNotificationMessage(envelope.Message);

        // Locate matching internal payment record
        const matchingPayment = await db.payment.findFirst({
          where: {
            OR: [
              ...(notification.paymentID
                ? [{ providerPaymentId: notification.paymentID }]
                : []),
              ...(notification.merchantInvoiceNumber
                ? [{ internalTransactionId: notification.merchantInvoiceNumber }]
                : []),
              ...(notification.trxID
                ? [{ providerTransactionId: notification.trxID }]
                : []),
            ],
          },
        });

        if (!matchingPayment) {
          await db.paymentWebhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              processingStatus: WebhookProcessingStatus.IGNORED,
              processedAt: new Date(),
              failureReason:
                "No matching internal payment found for SNS notification.",
            },
          });

          return {
            acknowledged: true,
            status: 200,
            message: "Notification recorded (no matching local payment).",
          };
        }

        // Security rule: Do not activate subscriptions based ONLY on webhook payload;
        // perform authoritative server-side verification with bKash Query Payment API.
        await paymentVerificationService.reconcilePaymentById({
          paymentId: matchingPayment.id,
          actorUserId: matchingPayment.userId,
          isAdmin: true,
          reason: `Triggered by verified AWS SNS webhook (${envelope.MessageId})`,
        });

        await db.paymentWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processingStatus: WebhookProcessingStatus.PROCESSED,
            processedAt: new Date(),
          },
        });

        return {
          acknowledged: true,
          status: 200,
          message: "Webhook notification verified and payment reconciled.",
        };
      }

      // UnsubscribeConfirmation or other event
      await db.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processingStatus: WebhookProcessingStatus.IGNORED,
          processedAt: new Date(),
        },
      });

      return {
        acknowledged: true,
        status: 200,
        message: `SNS event ${envelope.Type} acknowledged.`,
      };
    } catch (err: unknown) {
      const reason =
        err instanceof Error ? err.message : "Webhook processing failure.";
      await db.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processingStatus: WebhookProcessingStatus.FAILED,
          failureReason: reason,
        },
      });
      return {
        acknowledged: false,
        status: 500,
        message: reason,
      };
    }
  },

  /**
   * Admin paginated payment listing with summary metrics.
   */
  async listPaymentsForAdmin(options: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { internalTransactionId: { contains: q, mode: "insensitive" } },
        { providerPaymentId: { contains: q, mode: "insensitive" } },
        { providerTransactionId: { contains: q, mode: "insensitive" } },
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [
      payments,
      total,
      succeededCount,
      failedCount,
      pendingCount,
      revenueAgg,
    ] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          refunds: {
            select: {
              id: true,
              status: true,
              amount: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
      db.payment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
      db.payment.count({
        where: {
          status: { in: [PaymentStatus.FAILED, PaymentStatus.CANCELED] },
        },
      }),
      db.payment.count({
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.INITIATED] },
        },
      }),
      db.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amount: true },
      }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        succeededCount,
        failedCount,
        pendingCount,
        totalVerifiedRevenueBdt: formatCanonicalAmount(
          revenueAgg._sum.amount ?? "0.00"
        ),
      },
    };
  },

  /**
   * Lists refund requests for administrative review.
   */
  async listRefundsForAdmin(options: {
    page?: number;
    limit?: number;
    status?: RefundStatus;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentRefundWhereInput = {};
    if (options.status) {
      where.status = options.status;
    }

    const [refunds, total] = await Promise.all([
      db.paymentRefund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          payment: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              plan: { select: { id: true, name: true, code: true } },
            },
          },
          requestedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      db.paymentRefund.count({ where }),
    ]);

    return {
      refunds,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};

