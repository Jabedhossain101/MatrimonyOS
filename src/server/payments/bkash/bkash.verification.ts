import { PaymentStatus } from "@/generated/prisma";
import {
  amountsMatchExact,
  BKASH_SUCCESS_STATUS_CODE,
  type BkashConfig,
  type BkashExecutePaymentResponse,
  type BkashQueryPaymentResponse,
  type BkashSearchTransactionResponse,
  type VerifiedPaymentResult,
  type VerifyPaymentParams,
} from "../payment.types";
import { getBkashAuthenticatedHeaders } from "./bkash.auth";
import {
  BkashProviderError,
  executeBkashHttpRequest,
  getBkashConfig,
} from "./bkash.client";

/**
 * Calls the official bKash Execute Payment endpoint (`/tokenized/checkout/execute`).
 */
export async function executeBkashPayment(
  paymentId: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<BkashExecutePaymentResponse> {
  const config = options?.config ?? getBkashConfig();
  const headers = await getBkashAuthenticatedHeaders(options);

  return executeBkashHttpRequest<BkashExecutePaymentResponse>({
    path: "/tokenized/checkout/execute",
    headers,
    body: { paymentID: paymentId },
    config,
    fetchImpl: options?.fetchImpl,
  });
}

/**
 * Calls the official bKash Query Payment endpoint (`/tokenized/checkout/payment/status`).
 */
export async function queryBkashPayment(
  paymentId: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<BkashQueryPaymentResponse> {
  const config = options?.config ?? getBkashConfig();
  const headers = await getBkashAuthenticatedHeaders(options);

  return executeBkashHttpRequest<BkashQueryPaymentResponse>({
    path: "/tokenized/checkout/payment/status",
    headers,
    body: { paymentID: paymentId },
    config,
    fetchImpl: options?.fetchImpl,
  });
}

/**
 * Calls the official bKash Search Transaction endpoint (`/tokenized/checkout/general/searchTransaction`).
 */
export async function searchBkashTransaction(
  trxId: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<BkashSearchTransactionResponse> {
  const config = options?.config ?? getBkashConfig();
  const headers = await getBkashAuthenticatedHeaders(options);

  return executeBkashHttpRequest<BkashSearchTransactionResponse>({
    path: "/tokenized/checkout/general/searchTransaction",
    headers,
    body: { trxID: trxId },
    config,
    fetchImpl: options?.fetchImpl,
  });
}

/**
 * Validates a bKash Execute or Query response against the authoritative internal payment record.
 * Never marks an uncertain, mismatched, or incomplete transaction as verified.
 */
export function evaluateBkashPaymentPayload(
  payload: BkashExecutePaymentResponse | BkashQueryPaymentResponse,
  expected: VerifyPaymentParams
): VerifiedPaymentResult {
  const rawMetadata: Record<string, unknown> = {
    statusCode: payload.statusCode,
    statusMessage: payload.statusMessage,
    paymentID: payload.paymentID,
    trxID: payload.trxID,
    transactionStatus: payload.transactionStatus,
    amount: payload.amount,
    currency: payload.currency,
    merchantInvoiceNumber: payload.merchantInvoiceNumber,
    paymentExecuteTime: payload.paymentExecuteTime,
  };

  if (payload.statusCode !== BKASH_SUCCESS_STATUS_CODE) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason:
        payload.statusMessage ||
        `bKash rejected transaction (code ${payload.statusCode || "UNKNOWN"}).`,
      rawMetadata,
    };
  }

  const txStatus = payload.transactionStatus;

  if (txStatus === "Initiated") {
    return {
      verified: false,
      status: PaymentStatus.PENDING,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: "Payment is still in Initiated state and has not been completed.",
      rawMetadata,
    };
  }

  if (txStatus === "Cancelled") {
    return {
      verified: false,
      status: PaymentStatus.CANCELED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: "Payment was cancelled by the customer or provider.",
      rawMetadata,
    };
  }

  if (txStatus !== "Completed") {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: `Unexpected bKash transactionStatus: "${txStatus || "UNKNOWN"}".`,
      rawMetadata,
    };
  }

  // Strict multi-field verification for Completed transactions
  if (!payload.paymentID || payload.paymentID !== expected.providerPaymentId) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: "Security verification failed: bKash paymentID mismatch.",
      rawMetadata,
    };
  }

  if (!payload.trxID || payload.trxID.trim().length === 0) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: "Security verification failed: missing provider trxID.",
      rawMetadata,
    };
  }

  if (payload.currency !== expected.expectedCurrency) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: `Security verification failed: currency mismatch (expected ${expected.expectedCurrency}, got ${payload.currency || "NONE"}).`,
      rawMetadata,
    };
  }

  if (!amountsMatchExact(payload.amount, expected.expectedAmount)) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason: `Security verification failed: amount mismatch (expected ${expected.expectedAmount}, got ${payload.amount || "NONE"}).`,
      rawMetadata,
    };
  }

  if (
    !payload.merchantInvoiceNumber ||
    payload.merchantInvoiceNumber !== expected.expectedInternalTransactionId
  ) {
    return {
      verified: false,
      status: PaymentStatus.FAILED,
      providerPaymentId: expected.providerPaymentId,
      providerTransactionId: payload.trxID,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      merchantInvoiceNumber: payload.merchantInvoiceNumber ?? null,
      customerMsisdn: payload.customerMsisdn ?? null,
      failureReason:
        "Security verification failed: merchantInvoiceNumber does not match internal transaction reference.",
      rawMetadata,
    };
  }

  return {
    verified: true,
    status: PaymentStatus.SUCCEEDED,
    providerPaymentId: payload.paymentID,
    providerTransactionId: payload.trxID,
    amount: payload.amount ?? expected.expectedAmount,
    currency: payload.currency,
    merchantInvoiceNumber: payload.merchantInvoiceNumber,
    customerMsisdn: payload.customerMsisdn ?? null,
    failureReason: null,
    rawMetadata,
  };
}

/**
 * Executes a payment on bKash and verifies all fields against the expected internal order.
 * Per official bKash documentation, if Execute Payment times out or returns "already completed"
 * (statusCode "2062" or "2068"), falls back to Query Payment to determine the authoritative state.
 */
export async function executeAndVerifyBkashPayment(
  params: VerifyPaymentParams,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<VerifiedPaymentResult> {
  try {
    const execResp = await executeBkashPayment(
      params.providerPaymentId,
      options
    );

    // If bKash reports payment was already executed in a prior request/callback, query its status
    if (execResp.statusCode === "2062" || execResp.statusCode === "2068") {
      const queryResp = await queryBkashPayment(
        params.providerPaymentId,
        options
      );
      return evaluateBkashPaymentPayload(queryResp, params);
    }

    return evaluateBkashPaymentPayload(execResp, params);
  } catch (err: unknown) {
    // Per official bKash Checkout specification: if Execute times out, query payment status before failing
    if (
      err instanceof BkashProviderError &&
      err.statusCode === "PROVIDER_TIMEOUT"
    ) {
      try {
        const queryResp = await queryBkashPayment(
          params.providerPaymentId,
          options
        );
        return evaluateBkashPaymentPayload(queryResp, params);
      } catch {
        return {
          verified: false,
          status: PaymentStatus.PENDING,
          providerPaymentId: params.providerPaymentId,
          providerTransactionId: null,
          amount: null,
          currency: null,
          merchantInvoiceNumber: null,
          customerMsisdn: null,
          failureReason:
            "bKash execute and status query timed out. Payment remains pending reconciliation.",
          rawMetadata: { timeout: true },
        };
      }
    }

    throw err;
  }
}

/**
 * Queries payment status on bKash without re-executing debit and evaluates verification rules.
 */
export async function queryAndVerifyBkashPayment(
  params: VerifyPaymentParams,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<VerifiedPaymentResult> {
  const queryResp = await queryBkashPayment(params.providerPaymentId, options);
  return evaluateBkashPaymentPayload(queryResp, params);
}

