import {
  BKASH_SUCCESS_STATUS_CODE,
  formatCanonicalAmount,
  type BkashConfig,
  type BkashRefundRequest,
  type BkashRefundResponse,
  type BkashRefundStatusRequest,
  type RefundPaymentParams,
  type VerifiedRefundResult,
} from "../payment.types";
import { getBkashAuthenticatedHeaders } from "./bkash.auth";
import { executeBkashHttpRequest, getBkashConfig } from "./bkash.client";

function evaluateBkashRefundResponse(
  response: BkashRefundResponse
): VerifiedRefundResult {
  const isSuccess =
    response.statusCode === BKASH_SUCCESS_STATUS_CODE &&
    response.transactionStatus === "Completed" &&
    Boolean(response.refundTrxID);

  return {
    completed: isSuccess,
    providerRefundId: response.refundTrxID ?? null,
    originalTrxId: response.originalTrxID ?? null,
    amount: response.amount ?? null,
    currency: response.currency ?? null,
    statusCode: response.statusCode || "UNKNOWN",
    statusMessage: response.statusMessage || "Unknown refund status",
    failureReason: isSuccess
      ? null
      : response.statusMessage ||
        `bKash refund not completed (code ${response.statusCode || "UNKNOWN"}, status ${response.transactionStatus || "UNKNOWN"}).`,
    rawMetadata: {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      originalTrxID: response.originalTrxID,
      refundTrxID: response.refundTrxID,
      transactionStatus: response.transactionStatus,
      amount: response.amount,
      currency: response.currency,
      charge: response.charge,
      completedTime: response.completedTime,
    },
  };
}

/**
 * Initiates a full or partial refund through the official bKash Refund API (`/tokenized/checkout/payment/refund`).
 * Never marks a refund completed unless bKash returns `statusCode: "0000"`, `transactionStatus: "Completed"`, and `refundTrxID`.
 */
export async function refundBkashTransaction(
  params: RefundPaymentParams,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<VerifiedRefundResult> {
  const config = options?.config ?? getBkashConfig();
  const headers = await getBkashAuthenticatedHeaders(options);
  const canonicalAmount = formatCanonicalAmount(params.amount);

  const requestBody: BkashRefundRequest = {
    paymentID: params.providerPaymentId,
    trxID: params.providerTransactionId,
    amount: canonicalAmount,
    sku: params.sku.slice(0, 255),
    reason: params.reason.slice(0, 255),
  };

  const response = await executeBkashHttpRequest<BkashRefundResponse>({
    path: "/tokenized/checkout/payment/refund",
    headers,
    body: requestBody as unknown as Record<string, unknown>,
    config,
    fetchImpl: options?.fetchImpl,
  });

  return evaluateBkashRefundResponse(response);
}

/**
 * Queries the status of a refund on bKash (`/tokenized/checkout/payment/refund` with `paymentID` and `trxID`).
 */
export async function queryBkashRefundStatus(
  params: {
    providerPaymentId: string;
    providerTransactionId: string;
  },
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<VerifiedRefundResult> {
  const config = options?.config ?? getBkashConfig();
  const headers = await getBkashAuthenticatedHeaders(options);

  const requestBody: BkashRefundStatusRequest = {
    paymentID: params.providerPaymentId,
    trxID: params.providerTransactionId,
  };

  const response = await executeBkashHttpRequest<BkashRefundResponse>({
    path: "/tokenized/checkout/payment/refund",
    headers,
    body: requestBody as unknown as Record<string, unknown>,
    config,
    fetchImpl: options?.fetchImpl,
  });

  return evaluateBkashRefundResponse(response);
}

