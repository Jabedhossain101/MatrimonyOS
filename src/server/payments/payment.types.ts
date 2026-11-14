import type { BillingCycle, PaymentStatus } from "@/generated/prisma";

export const BKASH_API_VERSION = "v1.2.0-beta" as const;
export const BKASH_SUCCESS_STATUS_CODE = "0000" as const;

export type PaymentProviderCode = "BKASH";

export interface BkashConfig {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  baseUrl: string;
  isSandbox: boolean;
  webhookEnabled: boolean;
  agreementEnabled: boolean;
}

// ============================================================================
// Official bKash Tokenized Checkout API (v1.2.0-beta) Wire Types
// ============================================================================

export interface BkashGrantTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface BkashCreatePaymentRequest {
  /**
   * "0011" = Checkout (one-time payment without agreement)
   * "0000" = Agreement creation
   * "0001" = Payment with agreement
   */
  mode: "0011" | "0000" | "0001";
  payerReference: string;
  callbackURL: string;
  amount: string;
  currency: "BDT";
  intent: "sale" | "authorization";
  merchantInvoiceNumber: string;
  agreementID?: string;
  merchantAssociationInfo?: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  bkashURL?: string;
  callbackURL?: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  amount?: string;
  intent?: string;
  currency?: string;
  paymentCreateTime?: string;
  transactionStatus?: "Initiated" | "Completed" | "Cancelled" | "Failed" | string;
  merchantInvoiceNumber?: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: "Completed" | "Initiated" | "Cancelled" | "Failed" | string;
  amount?: string;
  currency?: string;
  intent?: string;
  paymentExecuteTime?: string;
  merchantInvoiceNumber?: string;
  payerReference?: string;
  customerMsisdn?: string;
  agreementID?: string;
}

export interface BkashQueryPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  mode?: string;
  paymentCreateTime?: string;
  paymentExecuteTime?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  trxID?: string;
  transactionStatus?: "Completed" | "Initiated" | "Cancelled" | "Failed" | string;
  verificationStatus?: "Complete" | "Incomplete" | string;
  payerReference?: string;
  customerMsisdn?: string;
}

export interface BkashSearchTransactionResponse {
  statusCode: string;
  statusMessage: string;
  trxID?: string;
  initiationTime?: string;
  completedTime?: string;
  transactionType?: string;
  customerMsisdn?: string;
  transactionStatus?: "Completed" | "Initiated" | "Cancelled" | "Failed" | string;
  amount?: string;
  currency?: string;
  organizationShortCode?: string;
  merchantInvoiceNumber?: string;
}

export interface BkashRefundRequest {
  paymentID: string;
  amount: string;
  trxID: string;
  sku: string;
  reason: string;
}

export interface BkashRefundStatusRequest {
  paymentID: string;
  trxID: string;
}

export interface BkashRefundResponse {
  statusCode: string;
  statusMessage: string;
  originalTrxID?: string;
  refundTrxID?: string;
  transactionStatus?: "Completed" | "Pending" | "Failed" | string;
  amount?: string;
  currency?: string;
  charge?: string;
  completedTime?: string;
}

export interface BkashAgreementStatusResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  agreementID?: string;
  payerReference?: string;
  customerMsisdn?: string;
  agreementStatus?: "Completed" | "Cancelled" | "Initiated" | string;
  agreementCreateTime?: string;
  agreementExecuteTime?: string;
}

export interface BkashAgreementCancelResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  agreementID?: string;
  payerReference?: string;
  agreementStatus?: "Cancelled" | string;
  agreementVoidTime?: string;
}

// ============================================================================
// Provider-Neutral Domain Contracts
// ============================================================================

export interface CreatePaymentOrderParams {
  internalTransactionId: string;
  payerReference: string;
  amount: string; // Exact 2-decimal string e.g. "2500.00"
  currency: "BDT";
  callbackUrl: string;
}

export interface CreatePaymentOrderResult {
  provider: PaymentProviderCode;
  providerPaymentId: string;
  checkoutUrl: string;
  transactionStatus: string;
  rawMetadata: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  providerPaymentId: string;
  expectedAmount: string;
  expectedCurrency: "BDT";
  expectedInternalTransactionId: string;
}

export interface VerifiedPaymentResult {
  verified: boolean;
  status: PaymentStatus;
  providerPaymentId: string;
  providerTransactionId: string | null;
  amount: string | null;
  currency: string | null;
  merchantInvoiceNumber: string | null;
  customerMsisdn: string | null;
  failureReason: string | null;
  rawMetadata: Record<string, unknown>;
}

export interface RefundPaymentParams {
  providerPaymentId: string;
  providerTransactionId: string;
  amount: string;
  sku: string;
  reason: string;
}

export interface VerifiedRefundResult {
  completed: boolean;
  providerRefundId: string | null;
  originalTrxId: string | null;
  amount: string | null;
  currency: string | null;
  statusCode: string;
  statusMessage: string;
  failureReason: string | null;
  rawMetadata: Record<string, unknown>;
}

export interface CheckoutSessionResult {
  paymentId: string;
  internalTransactionId: string;
  providerPaymentId: string;
  checkoutUrl: string;
  amount: string;
  currency: string;
  planCode: string;
  billingCycle: BillingCycle;
}

// ============================================================================
// Safe Monetary Utilities (Integer Minor Units / Exact String Representation)
// Never use floating-point arithmetic for monetary comparisons.
// ============================================================================

/**
 * Converts a decimal string or Prisma Decimal representation (e.g. "2500", "2500.5", "2500.00")
 * into integer minor units (poisha, 1 BDT = 100 poisha) using pure string/BigInt parsing.
 */
export function toMinorUnits(value: string | number | { toString(): string }): bigint {
  const str = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Invalid monetary amount format: "${str}"`);
  }
  const [wholePart, fracPart = ""] = str.split(".");
  const paddedFrac = (fracPart + "00").slice(0, 2);
  return BigInt(wholePart) * BigInt(100) + BigInt(paddedFrac);
}

/**
 * Formats integer minor units or decimal string to canonical 2-decimal BDT string (e.g. "2500.00").
 */
export function formatCanonicalAmount(value: string | number | { toString(): string }): string {
  const minor = toMinorUnits(value);
  const whole = minor / BigInt(100);
  const frac = minor % BigInt(100);
  return `${whole.toString()}.${frac.toString().padStart(2, "0")}`;
}

/**
 * Compares two monetary amounts for exact equality in minor units without floating-point errors.
 */
export function amountsMatchExact(
  amountA: string | number | { toString(): string } | undefined | null,
  amountB: string | number | { toString(): string } | undefined | null
): boolean {
  if (amountA === undefined || amountA === null || amountB === undefined || amountB === null) {
    return false;
  }
  try {
    return toMinorUnits(amountA) === toMinorUnits(amountB);
  } catch {
    return false;
  }
}

