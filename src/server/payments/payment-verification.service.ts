import { db } from "@/server/db";
import { PaymentStatus } from "@/generated/prisma";
import { auditService } from "@/server/services/audit.service";
import { AuthorizationError, NotFoundError } from "@/server/utils/errors";
import { formatCanonicalAmount } from "./payment.types";
import { getPaymentProvider } from "./payment-registry";
import { subscriptionBillingService } from "./subscription-billing.service";

// In-flight verification lock per paymentId to prevent race conditions on concurrent duplicate callbacks
const inflightVerifications = new Map<string, Promise<unknown>>();

export const paymentVerificationService = {
  /**
   * Processes and independently verifies a bKash browser callback.
   * Never trusts the callback query parameters as proof of payment.
   */
  async verifyBkashCallback(params: {
    providerPaymentId: string;
    callbackStatus: string;
    actorUserId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      providerPaymentId,
      callbackStatus,
      actorUserId,
      ipAddress,
      userAgent,
    } = params;

    if (!providerPaymentId || providerPaymentId.trim().length === 0) {
      throw new AuthorizationError("Invalid payment callback: missing paymentID.");
    }

    const payment = await db.payment.findUnique({
      where: { providerPaymentId: providerPaymentId.trim() },
      include: {
        plan: true,
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundError(
        "Unknown payment reference: no matching internal payment record found."
      );
    }

    // Ownership check if an authenticated user is in session during callback
    if (actorUserId && payment.userId !== actorUserId) {
      throw new AuthorizationError(
        "Forbidden: Payment record belongs to a different account."
      );
    }

    // Idempotent duplicate callback handling: if already SUCCEEDED, return immediately
    if (payment.status === PaymentStatus.SUCCEEDED) {
      return {
        verified: true,
        alreadyProcessed: true,
        status: PaymentStatus.SUCCEEDED,
        payment,
        subscription: payment.subscription,
        message: "Payment already verified and subscription active.",
      };
    }

    const normalizedStatus = callbackStatus.trim().toLowerCase();

    // If user cancelled on the bKash screen
    if (normalizedStatus === "cancel" || normalizedStatus === "cancelled") {
      const updated =
        await subscriptionBillingService.recordUnsuccessfulPayment({
          paymentId: payment.id,
          status: PaymentStatus.CANCELED,
          failureReason: "Customer cancelled payment on bKash checkout screen.",
          providerPaymentId: payment.providerPaymentId,
          ipAddress,
          userAgent,
        });

      return {
        verified: false,
        alreadyProcessed: false,
        status: PaymentStatus.CANCELED,
        payment: updated,
        subscription: null,
        message: "Payment was cancelled.",
      };
    }

    // If bKash callback explicitly reports failure
    if (normalizedStatus === "failure" || normalizedStatus === "failed") {
      const updated =
        await subscriptionBillingService.recordUnsuccessfulPayment({
          paymentId: payment.id,
          status: PaymentStatus.FAILED,
          failureReason: "bKash checkout reported payment failure.",
          providerPaymentId: payment.providerPaymentId,
          ipAddress,
          userAgent,
        });

      return {
        verified: false,
        alreadyProcessed: false,
        status: PaymentStatus.FAILED,
        payment: updated,
        subscription: null,
        message: "Payment failed during bKash authorization.",
      };
    }

    if (normalizedStatus !== "success") {
      throw new AuthorizationError(
        `Invalid callback status parameter: "${callbackStatus}".`
      );
    }

    // Deduplicate concurrent callback executions for the same payment ID
    const existingLock = inflightVerifications.get(payment.id);
    if (existingLock) {
      return existingLock as Promise<{
        verified: boolean;
        alreadyProcessed: boolean;
        status: PaymentStatus;
        payment: typeof payment;
        subscription: typeof payment.subscription;
        message: string;
      }>;
    }

    const verificationPromise = (async () => {
      try {
        const provider = getPaymentProvider("BKASH");
        const expectedAmount = formatCanonicalAmount(payment.amount);

        const verification = await provider.executeAndVerifyPayment({
          providerPaymentId: payment.providerPaymentId!,
          expectedAmount,
          expectedCurrency: "BDT",
          expectedInternalTransactionId: payment.internalTransactionId,
        });

        if (verification.verified && verification.status === PaymentStatus.SUCCEEDED) {
          const activation =
            await subscriptionBillingService.activateSubscriptionFromVerifiedPayment(
              {
                paymentId: payment.id,
                verification,
                ipAddress,
                userAgent,
              }
            );

          return {
            verified: true,
            alreadyProcessed: activation.alreadyProcessed,
            status: PaymentStatus.SUCCEEDED,
            payment: activation.payment,
            subscription: activation.subscription,
            message: "Payment verified and subscription activated.",
          };
        }

        // Verification failed or pending
        const updated =
          await subscriptionBillingService.recordUnsuccessfulPayment({
            paymentId: payment.id,
            status: verification.status,
            failureReason:
              verification.failureReason ||
              "Payment verification failed against bKash gateway.",
            providerPaymentId: payment.providerPaymentId,
            rawMetadata: verification.rawMetadata,
            ipAddress,
            userAgent,
          });

        return {
          verified: false,
          alreadyProcessed: false,
          status: updated.status,
          payment: updated,
          subscription: null,
          message:
            verification.failureReason ||
            "Payment could not be verified with bKash.",
        };
      } finally {
        inflightVerifications.delete(payment.id);
      }
    })();

    inflightVerifications.set(payment.id, verificationPromise);
    return verificationPromise;
  },

  /**
   * Server-side payment reconciliation using the provider's Query Payment API.
   * Safely resolves payments where the browser closed mid-checkout or network interrupted callback.
   * Never activates a subscription without verified provider evidence.
   */
  async reconcilePaymentById(params: {
    paymentId: string;
    actorUserId: string;
    isAdmin?: boolean;
    reason?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      paymentId,
      actorUserId,
      isAdmin = false,
      reason,
      ipAddress,
      userAgent,
    } = params;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        plan: true,
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment record not found.");
    }

    if (!isAdmin && payment.userId !== actorUserId) {
      throw new AuthorizationError(
        "Forbidden: You do not have permission to reconcile this payment."
      );
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return {
        verified: true,
        alreadyProcessed: true,
        status: PaymentStatus.SUCCEEDED,
        payment,
        subscription: payment.subscription,
        message: "Payment is already verified and succeeded.",
      };
    }

    if (!payment.providerPaymentId) {
      throw new AuthorizationError(
        "Cannot reconcile payment with provider: no bKash paymentID was assigned."
      );
    }

    const provider = getPaymentProvider("BKASH");
    const expectedAmount = formatCanonicalAmount(payment.amount);

    const verification = await provider.queryPaymentAndVerify({
      providerPaymentId: payment.providerPaymentId,
      expectedAmount,
      expectedCurrency: "BDT",
      expectedInternalTransactionId: payment.internalTransactionId,
    });

    await auditService.record({
      actorUserId,
      action: "PAYMENT_RECONCILIATION_QUERIED",
      entityType: "PAYMENT",
      entityId: payment.id,
      reason: reason || "Server-side payment status reconciliation",
      metadata: {
        providerPaymentId: payment.providerPaymentId,
        verified: verification.verified,
        resolvedStatus: verification.status,
        providerTransactionId: verification.providerTransactionId,
      },
      ipAddress,
      userAgent,
    });

    if (verification.verified && verification.status === PaymentStatus.SUCCEEDED) {
      const activation =
        await subscriptionBillingService.activateSubscriptionFromVerifiedPayment({
          paymentId: payment.id,
          verification,
          ipAddress,
          userAgent,
        });

      return {
        verified: true,
        alreadyProcessed: activation.alreadyProcessed,
        status: PaymentStatus.SUCCEEDED,
        payment: activation.payment,
        subscription: activation.subscription,
        message:
          "Reconciliation confirmed completed bKash payment. Subscription activated.",
      };
    }

    const updated = await subscriptionBillingService.recordUnsuccessfulPayment({
      paymentId: payment.id,
      status: verification.status,
      failureReason:
        verification.failureReason ||
        "Provider query confirmed payment is not completed.",
      providerPaymentId: payment.providerPaymentId,
      rawMetadata: verification.rawMetadata,
      ipAddress,
      userAgent,
    });

    return {
      verified: false,
      alreadyProcessed: false,
      status: updated.status,
      payment: updated,
      subscription: null,
      message:
        verification.failureReason ||
        `Provider status is ${updated.status}. Subscription not activated.`,
    };
  },
};

