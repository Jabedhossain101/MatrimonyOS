import type {
  CreatePaymentOrderParams,
  CreatePaymentOrderResult,
  PaymentProviderCode,
  RefundPaymentParams,
  VerifiedPaymentResult,
  VerifiedRefundResult,
  VerifyPaymentParams,
} from "./payment.types";

export interface IPaymentProvider {
  readonly code: PaymentProviderCode;

  /**
   * Check whether the payment provider is enabled and properly configured on the server.
   */
  isConfigured(): boolean;

  /**
   * Create a payment session on the provider and return the checkout redirect URL.
   */
  createPayment(params: CreatePaymentOrderParams): Promise<CreatePaymentOrderResult>;

  /**
   * Execute and verify a payment after customer callback return.
   */
  executeAndVerifyPayment(params: VerifyPaymentParams): Promise<VerifiedPaymentResult>;

  /**
   * Query the current status of a payment directly from the provider without executing a new debit.
   */
  queryPaymentAndVerify(params: VerifyPaymentParams): Promise<VerifiedPaymentResult>;

  /**
   * Search a transaction by provider transaction ID (trxID).
   */
  searchTransaction(trxId: string): Promise<Record<string, unknown>>;

  /**
   * Initiate a full or partial refund through the provider API.
   */
  refundTransaction(params: RefundPaymentParams): Promise<VerifiedRefundResult>;

  /**
   * Query the status of a previously submitted refund on the provider.
   */
  queryRefundStatus(params: {
    providerPaymentId: string;
    providerTransactionId: string;
  }): Promise<VerifiedRefundResult>;
}

