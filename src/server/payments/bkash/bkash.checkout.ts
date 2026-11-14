import {
  BKASH_SUCCESS_STATUS_CODE,
  formatCanonicalAmount,
  type BkashAgreementCancelResponse,
  type BkashAgreementStatusResponse,
  type BkashConfig,
  type BkashCreatePaymentRequest,
  type BkashCreatePaymentResponse,
  type CreatePaymentOrderParams,
  type CreatePaymentOrderResult,
} from "../payment.types";
import { getBkashAuthenticatedHeaders } from "./bkash.auth";
import {
  BkashProviderError,
  executeBkashHttpRequest,
  getBkashConfig,
} from "./bkash.client";

/**
 * Calls the official bKash Create Payment endpoint (`/tokenized/checkout/create`)
 * using `mode: "0011"` (Checkout without recurring agreement).
 */
export async function createBkashCheckoutPayment(
  params: CreatePaymentOrderParams,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<CreatePaymentOrderResult> {
  const config = options?.config ?? getBkashConfig();
  const canonicalAmount = formatCanonicalAmount(params.amount);

  if (params.currency !== "BDT") {
    throw new BkashProviderError(
      "bKash checkout only supports BDT currency.",
      "INVALID_CURRENCY",
      400
    );
  }

  const headers = await getBkashAuthenticatedHeaders(options);

  const requestBody: BkashCreatePaymentRequest = {
    mode: "0011",
    payerReference: params.payerReference,
    callbackURL: params.callbackUrl,
    amount: canonicalAmount,
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: params.internalTransactionId,
  };

  const response = await executeBkashHttpRequest<BkashCreatePaymentResponse>({
    path: "/tokenized/checkout/create",
    headers,
    body: requestBody as unknown as Record<string, unknown>,
    config,
    fetchImpl: options?.fetchImpl,
  });

  if (
    response.statusCode !== BKASH_SUCCESS_STATUS_CODE ||
    !response.paymentID ||
    !response.bkashURL
  ) {
    throw new BkashProviderError(
      response.statusMessage || "bKash failed to initialize payment checkout.",
      response.statusCode || "CREATE_PAYMENT_FAILED",
      400
    );
  }

  return {
    provider: "BKASH",
    providerPaymentId: response.paymentID,
    checkoutUrl: response.bkashURL,
    transactionStatus: response.transactionStatus || "Initiated",
    rawMetadata: {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      paymentCreateTime: response.paymentCreateTime,
      transactionStatus: response.transactionStatus,
      merchantInvoiceNumber: response.merchantInvoiceNumber,
      amount: response.amount,
      currency: response.currency,
    },
  };
}

/**
 * Queries the status of a Tokenized Checkout agreement if enabled on the merchant account.
 */
export async function queryBkashAgreementStatus(
  agreementId: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<BkashAgreementStatusResponse> {
  const config = options?.config ?? getBkashConfig();
  if (!config.agreementEnabled) {
    throw new BkashProviderError(
      "bKash Tokenized Agreement operations are not enabled for this merchant account.",
      "AGREEMENT_NOT_ENABLED",
      400
    );
  }

  const headers = await getBkashAuthenticatedHeaders(options);
  return executeBkashHttpRequest<BkashAgreementStatusResponse>({
    path: "/tokenized/checkout/agreement/status",
    headers,
    body: { agreementID: agreementId },
    config,
    fetchImpl: options?.fetchImpl,
  });
}

/**
 * Cancels an active Tokenized Checkout agreement if enabled on the merchant account.
 */
export async function cancelBkashAgreement(
  agreementId: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<BkashAgreementCancelResponse> {
  const config = options?.config ?? getBkashConfig();
  if (!config.agreementEnabled) {
    throw new BkashProviderError(
      "bKash Tokenized Agreement operations are not enabled for this merchant account.",
      "AGREEMENT_NOT_ENABLED",
      400
    );
  }

  const headers = await getBkashAuthenticatedHeaders(options);
  return executeBkashHttpRequest<BkashAgreementCancelResponse>({
    path: "/tokenized/checkout/agreement/cancel",
    headers,
    body: { agreementID: agreementId },
    config,
    fetchImpl: options?.fetchImpl,
  });
}

