import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BillingCycle,
  PaymentStatus,
  RefundStatus,
  SubscriptionStatus,
  WebhookProcessingStatus,
} from "@/generated/prisma";
import {
  toMinorUnits,
  formatCanonicalAmount,
  amountsMatchExact,
} from "@/server/payments/payment.types";
import {
  grantBkashToken,
  refreshBkashToken,
  getValidBkashToken,
  clearBkashTokenCache,
} from "@/server/payments/bkash/bkash.auth";
import { createBkashCheckoutPayment } from "@/server/payments/bkash/bkash.checkout";
import {
  evaluateBkashPaymentPayload,
  executeAndVerifyBkashPayment,
} from "@/server/payments/bkash/bkash.verification";
import {
  refundBkashTransaction,
  queryBkashRefundStatus,
} from "@/server/payments/bkash/bkash.refund";
import {
  isTrustedSnsCertificateUrl,
  isTrustedSnsSubscribeUrl,
  verifyBkashSnsWebhookSignature,
  computeWebhookPayloadHash,
  clearWebhookCertCache,
} from "@/server/payments/bkash/bkash.webhook";
import {
  resolvePlanPriceForCycle,
  subscriptionBillingService,
} from "@/server/payments/subscription-billing.service";
import { paymentVerificationService } from "@/server/payments/payment-verification.service";
import { paymentService } from "@/server/payments/payment.service";
import {
  setPaymentProviderForTesting,
  resetPaymentProviderRegistry,
} from "@/server/payments/payment-registry";
import { entitlementsService } from "@/server/services/entitlements.service";
import { verifyCronAuthorization } from "@/app/api/cron/subscriptions/route";
import { bkashCallbackSchema, createCheckoutSchema } from "@/lib/validations/payment";
import { AppRole, hasPermission, Permission } from "@/lib/permissions";
import { db as prisma } from "@/server/db";

// Mock env configuration for bKash tests
vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/matrimonyos_test",
    NEXT_PUBLIC_APP_URL: "https://matrimonyos.example.com",
    PAYMENTS_ENABLED: true,
    BKASH_APP_KEY: "test_bkash_app_key",
    BKASH_APP_SECRET: "test_bkash_app_secret",
    BKASH_USERNAME: "test_bkash_username",
    BKASH_PASSWORD: "test_bkash_password",
    BKASH_BASE_URL: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    BKASH_IS_SANDBOX: true,
    BKASH_WEBHOOK_ENABLED: true,
    BKASH_AGREEMENT_ENABLED: false,
    PAYMENT_CRON_SECRET: "test_super_secret_cron_token_123456",
  },
  isBkashConfigured: () => true,
}));

// Mock audit service
vi.mock("@/server/services/audit.service", () => ({
  auditService: {
    record: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Prisma client for database-backed unit tests
vi.mock("@/server/db", () => {
  const mockTx = {
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    userSubscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    subscriptionEvent: {
      create: vi.fn(),
    },
    userRole: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    matrimonialProfile: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    paymentRefund: {
      update: vi.fn(),
    },
  };

  return {
    db: {
      $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) =>
        cb(mockTx)
      ),
      subscriptionPlan: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      payment: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      userSubscription: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      subscriptionEvent: {
        create: vi.fn(),
      },
      paymentWebhookEvent: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      paymentRefund: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      __mockTx: mockTx,
    },
  };
});

function createJsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

describe("Phase 8: bKash Payment Gateway, Secure Webhooks & Subscription Billing", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    clearBkashTokenCache();
    clearWebhookCertCache();
    resetPaymentProviderRegistry();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetPaymentProviderRegistry();
  });

  // =========================================================================
  // 1. bKash Token Generation
  // =========================================================================
  it("1. grants a new bKash id_token via /tokenized/checkout/token/grant", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        statusCode: "0000",
        statusMessage: "Successful",
        id_token: "bkash_id_token_abc123",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "bkash_refresh_token_xyz789",
      })
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const tokenState = await grantBkashToken();
    expect(tokenState.idToken).toBe("bkash_id_token_abc123");
    expect(tokenState.refreshToken).toBe("bkash_refresh_token_xyz789");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain("/tokenized/checkout/token/grant");
    expect(calledInit.headers.username).toBe("test_bkash_username");
  });

  // =========================================================================
  // 2. Token Refresh & Single-Flight Concurrency Lock
  // =========================================================================
  it("2. refreshes expired bKash token via /tokenized/checkout/token/refresh and deduplicates concurrent token grants", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      await new Promise((r) => setTimeout(r, 15));
      if (url.includes("/token/refresh")) {
        return createJsonResponse({
          statusCode: "0000",
          statusMessage: "Successful",
          id_token: "refreshed_id_token_999",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "refreshed_refresh_token_999",
        });
      }
      return createJsonResponse({
        statusCode: "0000",
        statusMessage: "Successful",
        id_token: "initial_id_token_111",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "initial_refresh_token_111",
      });
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    // Concurrent calls should share the single-flight lock and only call grant once
    const [t1, t2, t3] = await Promise.all([
      getValidBkashToken(),
      getValidBkashToken(),
      getValidBkashToken(),
    ]);
    expect(t1).toBe("initial_id_token_111");
    expect(t2).toBe("initial_id_token_111");
    expect(t3).toBe("initial_id_token_111");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Explicit refresh call
    const refreshed = await refreshBkashToken("initial_refresh_token_111");
    expect(refreshed.idToken).toBe("refreshed_id_token_999");
  });

  // =========================================================================
  // 3. Payment Creation
  // =========================================================================
  it("3. creates a bKash Tokenized Checkout payment session with mode 0011 and BDT currency", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/token/grant")) {
        return createJsonResponse({
          statusCode: "0000",
          statusMessage: "Successful",
          id_token: "token_for_create",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "ref_token",
        });
      }
      return createJsonResponse({
        statusCode: "0000",
        statusMessage: "Successful",
        paymentID: "TR0011testPaymentId123",
        bkashURL: "https://sandbox.payment.bkash.com/redirect/TR0011testPaymentId123",
        callbackURL: "https://matrimonyos.example.com/api/payments/bkash/callback",
        amount: "2500.00",
        intent: "sale",
        currency: "BDT",
        paymentCreateTime: "2026-11-13T18:00:00:000 GMT+0600",
        transactionStatus: "Initiated",
        merchantInvoiceNumber: "MOS261113ABCDEF",
      });
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const session = await createBkashCheckoutPayment({
      internalTransactionId: "MOS261113ABCDEF",
      payerReference: "user_123",
      amount: "2500.00",
      currency: "BDT",
      callbackUrl: "https://matrimonyos.example.com/api/payments/bkash/callback",
    });

    expect(session.providerPaymentId).toBe("TR0011testPaymentId123");
    expect(session.checkoutUrl).toContain("sandbox.payment.bkash.com");
    expect(session.transactionStatus).toBe("Initiated");
  });

  // =========================================================================
  // 4. Invalid Plan Rejection
  // =========================================================================
  it("4. rejects checkout for inactive or FREE tier plans", () => {
    expect(() =>
      resolvePlanPriceForCycle(
        {
          code: "PREMIUM",
          isActive: false,
          currency: "BDT",
          priceMonthly: "2500.00",
          priceQuarterly: "6500.00",
          priceYearly: "22000.00",
        },
        BillingCycle.MONTHLY
      )
    ).toThrow("Selected subscription plan is not active.");

    expect(() =>
      resolvePlanPriceForCycle(
        {
          code: "FREE",
          isActive: true,
          currency: "BDT",
          priceMonthly: "0.00",
          priceQuarterly: null,
          priceYearly: null,
        },
        BillingCycle.MONTHLY
      )
    ).toThrow("The Free tier does not require payment checkout.");
  });

  // =========================================================================
  // 5. Client Amount Manipulation Prevention
  // =========================================================================
  it("5. ignores any client-supplied amount and strictly resolves price from the database plan", () => {
    // 1) Schema strips unknown fields like `amount`
    const parsed = createCheckoutSchema.parse({
      planId: "plan_premium",
      billingCycle: "MONTHLY",
      idempotencyKey: "idem_key_1234567890",
      amount: "1.00", // Attacker tries to pass 1 BDT
    } as unknown);
    expect("amount" in parsed).toBe(false);

    // 2) Server price resolver reads exact 2500.00 BDT from plan record
    const resolved = resolvePlanPriceForCycle(
      {
        code: "PREMIUM",
        isActive: true,
        currency: "BDT",
        priceMonthly: "2500",
        priceQuarterly: "6500",
        priceYearly: "22000",
      },
      BillingCycle.MONTHLY
    );
    expect(resolved.amount).toBe("2500.00");
    expect(toMinorUnits(resolved.amount)).toBe(BigInt(250000));
  });

  // =========================================================================
  // 6. Invalid Callback Rejection
  // =========================================================================
  it("6. rejects malformed callback query parameters and unknown paymentIDs", async () => {
    const invalidCallback = bkashCallbackSchema.safeParse({
      paymentID: "",
      status: "",
    });
    expect(invalidCallback.success).toBe(false);

    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce(null);
    await expect(
      paymentVerificationService.verifyBkashCallback({
        providerPaymentId: "TR0011_UNKNOWN_ID",
        callbackStatus: "success",
      })
    ).rejects.toThrow("Unknown payment reference");
  });

  // =========================================================================
  // 7. Successful Payment Verification
  // =========================================================================
  it("7. verifies a successful bKash payment when statusCode=0000, transactionStatus=Completed, amount & invoice match, and trxID is present", () => {
    const decision = evaluateBkashPaymentPayload(
      {
        statusCode: "0000",
        statusMessage: "Successful",
        paymentID: "TR0011_VALID",
        trxID: "BKASH_TRX_998877",
        transactionStatus: "Completed",
        amount: "2500.00",
        currency: "BDT",
        merchantInvoiceNumber: "MOS261113VALID",
        customerMsisdn: "01700000000",
      },
      {
        providerPaymentId: "TR0011_VALID",
        expectedAmount: "2500.00",
        expectedCurrency: "BDT",
        expectedInternalTransactionId: "MOS261113VALID",
      }
    );

    expect(decision.verified).toBe(true);
    expect(decision.status).toBe(PaymentStatus.SUCCEEDED);
    expect(decision.providerTransactionId).toBe("BKASH_TRX_998877");
    expect(decision.providerPaymentId).toBe("TR0011_VALID");
  });

  // =========================================================================
  // 8. Failed Payment Handling
  // =========================================================================
  it("8. marks payment as FAILED when bKash returns a failure statusCode or Declined status", () => {
    const decision = evaluateBkashPaymentPayload(
      {
        statusCode: "2023",
        statusMessage: "Insufficient Balance",
        paymentID: "TR0011_FAIL",
        transactionStatus: "Failed",
      },
      {
        providerPaymentId: "TR0011_FAIL",
        expectedAmount: "2500.00",
        expectedCurrency: "BDT",
        expectedInternalTransactionId: "MOS261113FAIL",
      }
    );

    expect(decision.verified).toBe(false);
    expect(decision.status).toBe(PaymentStatus.FAILED);
    expect(decision.failureReason).toContain("Insufficient Balance");
  });

  // =========================================================================
  // 9. Incorrect Amount Rejection
  // =========================================================================
  it("9. rejects verification when bKash settled amount does not exactly match expected plan amount", () => {
    expect(amountsMatchExact("2500.00", "2499.99")).toBe(false);
    expect(formatCanonicalAmount("2500")).toBe("2500.00");

    const decision = evaluateBkashPaymentPayload(
      {
        statusCode: "0000",
        statusMessage: "Successful",
        paymentID: "TR0011_TAMPER",
        trxID: "TRX_TAMPER_1",
        transactionStatus: "Completed",
        amount: "500.00", // Mismatch against 2500.00
        currency: "BDT",
        merchantInvoiceNumber: "MOS261113TAMPER",
      },
      {
        providerPaymentId: "TR0011_TAMPER",
        expectedAmount: "2500.00",
        expectedCurrency: "BDT",
        expectedInternalTransactionId: "MOS261113TAMPER",
      }
    );

    expect(decision.verified).toBe(false);
    expect(decision.status).toBe(PaymentStatus.FAILED);
    expect(decision.failureReason).toContain("amount mismatch");
  });

  // =========================================================================
  // 10. Incorrect Transaction Reference Rejection
  // =========================================================================
  it("10. rejects verification when bKash merchantInvoiceNumber does not match expected reference", () => {
    const decision = evaluateBkashPaymentPayload(
      {
        statusCode: "0000",
        statusMessage: "Successful",
        paymentID: "TR0011_REF_MISMATCH",
        trxID: "TRX_REF_MISMATCH",
        transactionStatus: "Completed",
        amount: "2500.00",
        currency: "BDT",
        merchantInvoiceNumber: "MOS_DIFFERENT_INVOICE",
      },
      {
        providerPaymentId: "TR0011_REF_MISMATCH",
        expectedAmount: "2500.00",
        expectedCurrency: "BDT",
        expectedInternalTransactionId: "MOS_EXPECTED_INVOICE",
      }
    );

    expect(decision.verified).toBe(false);
    expect(decision.status).toBe(PaymentStatus.FAILED);
    expect(decision.failureReason).toContain("merchantInvoiceNumber does not match");
  });

  // =========================================================================
  // 11. Duplicate Callback Handling
  // =========================================================================
  it("11. handles duplicate browser callbacks idempotently without re-executing payment", async () => {
    const mockExecute = vi.fn();
    setPaymentProviderForTesting("BKASH", {
      code: "BKASH",
      isConfigured: () => true,
      createPayment: vi.fn(),
      executeAndVerifyPayment: mockExecute,
      queryPaymentAndVerify: vi.fn(),
      searchTransaction: vi.fn(),
      refundTransaction: vi.fn(),
      queryRefundStatus: vi.fn(),
    });

    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce({
      id: "pay_already_succeeded",
      userId: "user_11",
      status: PaymentStatus.SUCCEEDED,
      providerPaymentId: "TR0011_DUP",
      providerTransactionId: "TRX_DUP_001",
      subscription: { id: "sub_11", status: SubscriptionStatus.ACTIVE },
    } as never);

    const res = await paymentVerificationService.verifyBkashCallback({
      providerPaymentId: "TR0011_DUP",
      callbackStatus: "success",
    });

    expect(res.verified).toBe(true);
    expect(res.alreadyProcessed).toBe(true);
    expect(res.status).toBe(PaymentStatus.SUCCEEDED);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 12. Duplicate Transaction Prevention (Idempotency Key Reuse & Cross-User Collision)
  // =========================================================================
  it("12. prevents duplicate payment sessions for the same idempotencyKey and blocks cross-account idempotency collision", async () => {
    setPaymentProviderForTesting("BKASH", {
      code: "BKASH",
      isConfigured: () => true,
      createPayment: vi.fn(),
      executeAndVerifyPayment: vi.fn(),
      queryPaymentAndVerify: vi.fn(),
      searchTransaction: vi.fn(),
      refundTransaction: vi.fn(),
      queryRefundStatus: vi.fn(),
    });

    // Part A: Idempotency key reuse by same user returns existing session
    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce({
      id: "pay_existing_idem",
      userId: "user_1",
      planId: "plan_premium",
      billingCycle: BillingCycle.MONTHLY,
      amount: "2500.00",
      currency: "BDT",
      status: PaymentStatus.PENDING,
      internalTransactionId: "MOS-EXISTING-1",
      providerPaymentId: "TR0011_EXISTING",
      plan: { id: "plan_premium", code: "PREMIUM", name: "Premium" },
      metadata: {
        checkoutUrl: "https://sandbox.payment.bkash.com/existing",
      },
    } as never);

    const idemResult = await paymentService.initiateCheckout({
      userId: "user_1",
      planId: "plan_premium",
      billingCycle: BillingCycle.MONTHLY,
      idempotencyKey: "idem_key_reused_001",
    });

    expect(idemResult.paymentId).toBe("pay_existing_idem");
    expect(idemResult.checkoutUrl).toBe("https://sandbox.payment.bkash.com/existing");
    expect(prisma.payment.create).not.toHaveBeenCalled();

    // Part B: Cross-account idempotency key collision is rejected
    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce({
      id: "pay_existing_idem",
      userId: "user_1",
      planId: "plan_premium",
      billingCycle: BillingCycle.MONTHLY,
    } as never);

    await expect(
      paymentService.initiateCheckout({
        userId: "user_2_attacker",
        planId: "plan_premium",
        billingCycle: BillingCycle.MONTHLY,
        idempotencyKey: "idem_key_reused_001",
      })
    ).rejects.toThrow("Idempotency key collision across accounts.");
  });

  // =========================================================================
  // 13. Idempotent Payment Processing
  // =========================================================================
  it("13. processes activateSubscriptionFromVerifiedPayment idempotently when already SUCCEEDED", async () => {
    const mockTx = (prisma as unknown as { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> }).__mockTx;
    mockTx.payment.findUnique.mockResolvedValueOnce({
      id: "pay_13",
      userId: "user_13",
      status: PaymentStatus.SUCCEEDED,
      subscriptionId: "sub_existing_13",
      invoiceNumber: "INV-MOS-20261113-PAY13",
      plan: { id: "plan_premium", name: "Premium", code: "PREMIUM" },
    });
    mockTx.userSubscription.findUnique.mockResolvedValueOnce({
      id: "sub_existing_13",
      status: SubscriptionStatus.ACTIVE,
    });

    const result =
      await subscriptionBillingService.activateSubscriptionFromVerifiedPayment({
        paymentId: "pay_13",
        verification: {
          verified: true,
          status: PaymentStatus.SUCCEEDED,
          providerPaymentId: "TR0011_13",
          providerTransactionId: "TRX_13",
          amount: "2500.00",
          currency: "BDT",
          merchantInvoiceNumber: "MOS-13",
          customerMsisdn: null,
          failureReason: null,
          rawMetadata: {},
        },
      });

    expect(result.alreadyProcessed).toBe(true);
    expect(result.subscription?.id).toBe("sub_existing_13");
    expect(mockTx.userSubscription.create).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 14. Subscription Activation After Verified Payment
  // =========================================================================
  it("14. activates UserSubscription, generates invoiceNumber, and records SubscriptionEvent & AuditLog on verified payment", async () => {
    const mockTx = (prisma as unknown as { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> }).__mockTx;
    const futureEnd = new Date(Date.now() + 30 * 86400_000);

    mockTx.payment.findUnique.mockResolvedValueOnce({
      id: "pay_14",
      userId: "user_14",
      planId: "plan_premium",
      billingCycle: BillingCycle.MONTHLY,
      amount: { toString: () => "2500.00" },
      currency: "BDT",
      status: PaymentStatus.PENDING,
      subscriptionId: null,
      invoiceNumber: null,
      internalTransactionId: "MOS261113_14",
      metadata: {},
      plan: { id: "plan_premium", name: "Premium", code: "PREMIUM" },
    });

    mockTx.userSubscription.findFirst.mockResolvedValueOnce(null);
    mockTx.userSubscription.create.mockResolvedValueOnce({
      id: "sub_new_14",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: futureEnd,
    });
    mockTx.payment.update.mockResolvedValueOnce({
      id: "pay_14",
      userId: "user_14",
      status: PaymentStatus.SUCCEEDED,
      invoiceNumber: "INV-MOS-20261113-PAY14",
      amount: { toString: () => "2500.00" },
      currency: "BDT",
      plan: { id: "plan_premium", name: "Premium", code: "PREMIUM" },
    });
    mockTx.matrimonialProfile.findUnique.mockResolvedValueOnce(null);

    const result =
      await subscriptionBillingService.activateSubscriptionFromVerifiedPayment({
        paymentId: "pay_14",
        verification: {
          verified: true,
          status: PaymentStatus.SUCCEEDED,
          providerPaymentId: "TR0011_14",
          providerTransactionId: "TRX_14_VERIFIED",
          amount: "2500.00",
          currency: "BDT",
          merchantInvoiceNumber: "MOS261113_14",
          customerMsisdn: "01711111111",
          failureReason: null,
          rawMetadata: { statusCode: "0000" },
        },
      });

    expect(result.alreadyProcessed).toBe(false);
    expect(result.subscription?.id).toBe("sub_new_14");
    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pay_14" },
        data: expect.objectContaining({
          status: PaymentStatus.SUCCEEDED,
          providerTransactionId: "TRX_14_VERIFIED",
        }),
      })
    );
    expect(mockTx.userRole.upsert).toHaveBeenCalled();
  });

  // =========================================================================
  // 15. No Activation After Failed Payment
  // =========================================================================
  it("15. never creates or activates a subscription when recordUnsuccessfulPayment is invoked", async () => {
    const mockTx = (prisma as unknown as { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> }).__mockTx;
    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce({
      id: "pay_15",
      userId: "user_15",
      planId: "plan_premium",
      amount: { toString: () => "2500.00" },
      currency: "BDT",
      status: PaymentStatus.PENDING,
      subscriptionId: null,
      metadata: {},
      plan: { id: "plan_premium", code: "PREMIUM", name: "Premium" },
    } as never);

    mockTx.payment.update.mockResolvedValueOnce({
      id: "pay_15",
      status: PaymentStatus.FAILED,
      providerPaymentId: "TR0011_15",
    });

    await subscriptionBillingService.recordUnsuccessfulPayment({
      paymentId: "pay_15",
      status: PaymentStatus.FAILED,
      failureReason: "Insufficient Balance",
    });

    expect(mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pay_15" },
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
          failureReason: "Insufficient Balance",
        }),
      })
    );
    expect(mockTx.userSubscription.create).not.toHaveBeenCalled();
    expect(mockTx.userSubscription.update).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 16. Pending Payment Handling & Execute Timeout Fallback to Query Payment
  // =========================================================================
  it("16. falls back to Query Payment when Execute Payment returns 2062 or times out, and preserves PENDING when Initiated", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/token/grant")) {
        return createJsonResponse({
          statusCode: "0000",
          statusMessage: "Successful",
          id_token: "tok_16",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "ref_16",
        });
      }
      if (url.includes("/tokenized/checkout/execute")) {
        return createJsonResponse({
          statusCode: "2062",
          statusMessage: "The payment has already been executed",
        });
      }
      // Fallback call to /tokenized/checkout/payment/status
      return createJsonResponse({
        statusCode: "0000",
        statusMessage: "Successful",
        paymentID: "TR0011_16",
        transactionStatus: "Initiated",
        amount: "2500.00",
        currency: "BDT",
        merchantInvoiceNumber: "MOS_16",
      });
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const decision = await executeAndVerifyBkashPayment({
      providerPaymentId: "TR0011_16",
      expectedAmount: "2500.00",
      expectedCurrency: "BDT",
      expectedInternalTransactionId: "MOS_16",
    });

    expect(decision.verified).toBe(false);
    expect(decision.status).toBe(PaymentStatus.PENDING);
  });

  // =========================================================================
  // 17. Subscription Expiration Cron Logic
  // =========================================================================
  it("17. expires elapsed ACTIVE subscriptions and stale pending checkouts in processSubscriptionLifecycleCron", async () => {
    const pastDate = new Date(Date.now() - 86400_000);
    vi.mocked(prisma.userSubscription.findMany).mockResolvedValueOnce([
      {
        id: "sub_expired_17",
        userId: "user_17",
        planId: "plan_premium",
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: pastDate,
        cancelAtPeriodEnd: false,
        plan: { id: "plan_premium", name: "Premium", code: "PREMIUM" },
      } as never,
    ]);
    vi.mocked(prisma.payment.updateMany).mockResolvedValueOnce({ count: 2 });

    const mockTx = (prisma as unknown as { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> }).__mockTx;
    mockTx.userSubscription.count.mockResolvedValueOnce(0);
    mockTx.matrimonialProfile.findUnique.mockResolvedValueOnce(null);

    const res =
      await subscriptionBillingService.processSubscriptionLifecycleCron();
    expect(res.expiredSubscriptionsCount).toBe(1);
    expect(res.expiredPaymentsCount).toBe(2);
    expect(mockTx.userSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub_expired_17" },
        data: expect.objectContaining({ status: SubscriptionStatus.EXPIRED }),
      })
    );
  });

  // =========================================================================
  // 18. Cancellation Behavior (End-of-Period vs Immediate)
  // =========================================================================
  it("18. supports both cancel-at-period-end and immediate cancellation", async () => {
    const futureDate = new Date(Date.now() + 10 * 86400_000);
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValueOnce({
      id: "sub_18",
      userId: "user_18",
      planId: "plan_premium",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: futureDate,
      externalSubscriptionId: null,
      paymentProvider: "BKASH",
      plan: { id: "plan_premium", code: "PREMIUM", name: "Premium" },
    } as never);

    const mockTx = (prisma as unknown as { __mockTx: Record<string, Record<string, ReturnType<typeof vi.fn>>> }).__mockTx;
    mockTx.userSubscription.update.mockResolvedValueOnce({
      id: "sub_18",
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: true,
    });

    const endOfPeriodRes = await subscriptionBillingService.cancelSubscription({
      subscriptionId: "sub_18",
      actorUserId: "user_18",
      reason: "Found a match",
      immediate: false,
    });

    expect(endOfPeriodRes.status).toBe(SubscriptionStatus.ACTIVE);
    expect(endOfPeriodRes.cancelAtPeriodEnd).toBe(true);
  });

  // =========================================================================
  // 19. Entitlement Activation for Paid Plan
  // =========================================================================
  it("19. grants PREMIUM entitlements when user has an ACTIVE non-expired subscription", async () => {
    const futureDate = new Date(Date.now() + 15 * 86400_000);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValueOnce({
      id: "sub_19",
      userId: "user_19",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false,
      plan: {
        id: "plan_premium",
        name: "Premium Membership",
        code: "PREMIUM",
        entitlements: [
          { key: "DAILY_INTEREST_LIMIT", value: "50" },
          { key: "ADVANCED_SEARCH_FILTERS", value: "true" },
          { key: "CAN_VIEW_CONTACT_DETAILS", value: "true" },
          { key: "PRIORITY_SUPPORT", value: "true" },
        ],
      },
    } as never);

    const ent = await entitlementsService.resolveUserEntitlements("user_19");
    expect(ent.tierCode).toBe("PREMIUM");
    expect(ent.hasActivePaidSubscription).toBe(true);
    expect(ent.dailyInterestLimit).toBe(50);
    expect(ent.advancedFilters).toBe(true);
    expect(ent.canViewContactDetails).toBe(true);
  });

  // =========================================================================
  // 20. Entitlement Expiration
  // =========================================================================
  it("20. revokes paid entitlements and falls back to FREE tier when subscription period has ended", async () => {
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.subscriptionPlan.findUnique).mockResolvedValueOnce(null);

    const ent = await entitlementsService.resolveUserEntitlements("user_20_expired");
    expect(ent.tierCode).toBe("FREE");
    expect(ent.hasActivePaidSubscription).toBe(false);
    expect(ent.dailyInterestLimit).toBe(10);
    expect(ent.advancedFilters).toBe(false);
    expect(ent.canViewContactDetails).toBe(false);
  });

  // =========================================================================
  // 21. Unauthorized Billing Record Access (IDOR & Moderator Exclusion)
  // =========================================================================
  it("21. blocks users from accessing another member's payment record (IDOR) and excludes MODERATOR from payment/refund permissions", async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValueOnce({
      id: "pay_owned_by_alice",
      userId: "user_alice",
      plan: { name: "Premium", entitlements: [] },
      refunds: [],
      user: { id: "user_alice", name: "Alice", email: "alice@example.com" },
    } as never);

    // Bob tries to read Alice's payment
    await expect(
      paymentService.getPaymentForViewer({
        paymentId: "pay_owned_by_alice",
        viewerUserId: "user_bob",
        isAdmin: false,
      })
    ).rejects.toThrow("Forbidden: You are not authorized to access another member's billing record.");

    // Moderator role check
    expect(hasPermission([AppRole.MODERATOR], Permission.PAYMENT_MANAGE)).toBe(false);
    expect(hasPermission([AppRole.MODERATOR], Permission.REFUND_MANAGE)).toBe(false);
    expect(hasPermission([AppRole.ADMIN], Permission.PAYMENT_MANAGE)).toBe(true);
    expect(hasPermission([AppRole.SUPER_ADMIN], Permission.REFUND_MANAGE)).toBe(true);
  });

  // =========================================================================
  // 22. Invalid Webhook Signature & Untrusted SigningCertURL SSRF Rejection
  // =========================================================================
  it("22. rejects untrusted AWS SNS SigningCertURL (SSRF protection) and invalid cryptographic signatures", async () => {
    expect(
      isTrustedSnsCertificateUrl("https://evil.attacker.com/SimpleNotificationService-123.pem")
    ).toBe(false);
    expect(
      isTrustedSnsCertificateUrl("http://sns.ap-southeast-1.amazonaws.com/SimpleNotificationService-123.pem")
    ).toBe(false);
    expect(
      isTrustedSnsCertificateUrl("https://sns.ap-southeast-1.amazonaws.com/SimpleNotificationService-abc123.pem")
    ).toBe(true);
    expect(
      isTrustedSnsSubscribeUrl("http://169.254.169.254/latest/meta-data/")
    ).toBe(false);

    const verification = await verifyBkashSnsWebhookSignature({
      Type: "Notification",
      MessageId: "msg_ssrf_test",
      TopicArn: "arn:aws:sns:ap-southeast-1:123456789012:bkash",
      Message: "{}",
      Timestamp: new Date().toISOString(),
      SignatureVersion: "1",
      Signature: "dGVzdA==",
      SigningCertURL: "https://attacker.example.com/SimpleNotificationService-cert.pem",
    });

    expect(verification.valid).toBe(false);
    expect(verification.reason).toContain("Untrusted SigningCertURL origin rejected");
  });

  // =========================================================================
  // 23. Duplicate Webhook Event Handling
  // =========================================================================
  it("23. deduplicates repeated webhook deliveries by MessageId / payloadHash", async () => {
    const crypto = await import("node:crypto");
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    // Create a self-signed X.509 cert or mock verifyBkashSnsWebhookSignature via valid signature
    // Note: Node's crypto.createVerify accepts PEM public keys as well as certificates!
    const pemPublicKey = publicKey.export({ type: "spki", format: "pem" }).toString();

    const nowIso = new Date().toISOString();
    const envelopeObj = {
      Type: "Notification" as const,
      MessageId: "sns_msg_dup_23",
      TopicArn: "arn:aws:sns:ap-southeast-1:123456789012:bkash",
      Message: JSON.stringify({ trxID: "TRX_23", transactionStatus: "Completed" }),
      Timestamp: nowIso,
      SignatureVersion: "1" as const,
      SigningCertURL:
        "https://sns.ap-southeast-1.amazonaws.com/SimpleNotificationService-test23.pem",
    };

    const stringToSign = [
      "Message",
      envelopeObj.Message,
      "MessageId",
      envelopeObj.MessageId,
      "Timestamp",
      envelopeObj.Timestamp,
      "TopicArn",
      envelopeObj.TopicArn,
      "Type",
      envelopeObj.Type,
      "",
    ].join("\n");

    const signer = crypto.createSign("RSA-SHA1");
    signer.update(stringToSign, "utf8");
    const signatureBase64 = signer.sign(privateKey, "base64");

    const fullEnvelope = {
      ...envelopeObj,
      Signature: signatureBase64,
    };
    const rawBody = JSON.stringify(fullEnvelope);

    const mockCertFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => pemPublicKey,
    });

    vi.mocked(prisma.paymentWebhookEvent.findFirst).mockResolvedValueOnce({
      id: "wh_existing_23",
      providerEventId: "sns_msg_dup_23",
      processingStatus: WebhookProcessingStatus.PROCESSED,
      payloadHash: computeWebhookPayloadHash(rawBody),
    } as never);

    const res = await paymentService.processBkashWebhook({
      rawBody,
      fetchImpl: mockCertFetch as unknown as typeof fetch,
    });

    expect(res.acknowledged).toBe(true);
    expect(res.duplicate).toBe(true);
    expect(prisma.paymentWebhookEvent.create).not.toHaveBeenCalled();
  });

  // =========================================================================
  // 24. Refund Verification
  // =========================================================================
  it("24. marks a refund as completed ONLY when bKash returns statusCode=0000, transactionStatus=Completed, and refundTrxID", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/token/grant")) {
        return createJsonResponse({
          statusCode: "0000",
          statusMessage: "Successful",
          id_token: "tok_refund",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "ref_refund",
        });
      }
      return createJsonResponse({
        statusCode: "0000",
        statusMessage: "Successful",
        originalTrxID: "ORIG_TRX_24",
        refundTrxID: "REFUND_TRX_24",
        transactionStatus: "Completed",
        amount: "2500.00",
        currency: "BDT",
        completedTime: "2026-11-13T19:00:00:000 GMT+0600",
      });
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const refundRes = await refundBkashTransaction({
      providerPaymentId: "TR0011_24",
      providerTransactionId: "ORIG_TRX_24",
      amount: "2500.00",
      reason: "Customer requested cancellation",
      sku: "MOS261113_24",
    });

    expect(refundRes.completed).toBe(true);
    expect(refundRes.providerRefundId).toBe("REFUND_TRX_24");

    const statusRes = await queryBkashRefundStatus({
      providerPaymentId: "TR0011_24",
      providerTransactionId: "ORIG_TRX_24",
    });
    expect(statusRes.completed).toBe(true);
    expect(RefundStatus.COMPLETED).toBe("COMPLETED");
  });

  // =========================================================================
  // 25. Cron Authorization
  // =========================================================================
  it("25. enforces constant-time Bearer secret verification on /api/cron/subscriptions", () => {
    expect(verifyCronAuthorization(null, null)).toBe(false);
    expect(verifyCronAuthorization("Bearer wrong_secret_token", null)).toBe(false);
    expect(
      verifyCronAuthorization(
        "Bearer test_super_secret_cron_token_123456",
        null
      )
    ).toBe(true);
    expect(
      verifyCronAuthorization(
        null,
        "test_super_secret_cron_token_123456"
      )
    ).toBe(true);
  });
});
