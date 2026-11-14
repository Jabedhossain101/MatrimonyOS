import { isBkashConfigured } from "@/lib/env";
import type { IPaymentProvider } from "./payment-provider.interface";
import type {
  BkashConfig,
  CreatePaymentOrderParams,
  CreatePaymentOrderResult,
  PaymentProviderCode,
  RefundPaymentParams,
  VerifiedPaymentResult,
  VerifiedRefundResult,
  VerifyPaymentParams,
} from "./payment.types";
import { createBkashCheckoutPayment } from "./bkash/bkash.checkout";
import {
  queryBkashRefundStatus,
  refundBkashTransaction,
} from "./bkash/bkash.refund";
import {
  executeAndVerifyBkashPayment,
  queryAndVerifyBkashPayment,
  searchBkashTransaction,
} from "./bkash/bkash.verification";

export class BkashPaymentProvider implements IPaymentProvider {
  public readonly code: PaymentProviderCode = "BKASH";
  private readonly configOverride?: Partial<BkashConfig>;
  private readonly fetchOverride?: typeof fetch;

  constructor(options?: {
    config?: Partial<BkashConfig>;
    fetchImpl?: typeof fetch;
  }) {
    this.configOverride = options?.config;
    this.fetchOverride = options?.fetchImpl;
  }

  public isConfigured(): boolean {
    if (this.configOverride) {
      return Boolean(
        this.configOverride.appKey &&
          this.configOverride.appSecret &&
          this.configOverride.username &&
          this.configOverride.password &&
          this.configOverride.baseUrl
      );
    }
    return isBkashConfigured();
  }

  public async createPayment(
    params: CreatePaymentOrderParams
  ): Promise<CreatePaymentOrderResult> {
    return createBkashCheckoutPayment(params, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
  }

  public async executeAndVerifyPayment(
    params: VerifyPaymentParams
  ): Promise<VerifiedPaymentResult> {
    return executeAndVerifyBkashPayment(params, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
  }

  public async queryPaymentAndVerify(
    params: VerifyPaymentParams
  ): Promise<VerifiedPaymentResult> {
    return queryAndVerifyBkashPayment(params, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
  }

  public async searchTransaction(
    trxId: string
  ): Promise<Record<string, unknown>> {
    const res = await searchBkashTransaction(trxId, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
    return res as unknown as Record<string, unknown>;
  }

  public async refundTransaction(
    params: RefundPaymentParams
  ): Promise<VerifiedRefundResult> {
    return refundBkashTransaction(params, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
  }

  public async queryRefundStatus(params: {
    providerPaymentId: string;
    providerTransactionId: string;
  }): Promise<VerifiedRefundResult> {
    return queryBkashRefundStatus(params, {
      config: this.configOverride as BkashConfig | undefined,
      fetchImpl: this.fetchOverride,
    });
  }
}

const defaultBkashProvider = new BkashPaymentProvider();

const providerRegistry = new Map<PaymentProviderCode, IPaymentProvider>([
  ["BKASH", defaultBkashProvider],
]);

export function getPaymentProvider(
  code: PaymentProviderCode = "BKASH"
): IPaymentProvider {
  const provider = providerRegistry.get(code);
  if (!provider) {
    throw new Error(`Unsupported payment provider: ${code}`);
  }
  return provider;
}

export function setPaymentProviderForTesting(
  code: PaymentProviderCode,
  provider: IPaymentProvider
): void {
  providerRegistry.set(code, provider);
}

export function resetPaymentProviderRegistry(): void {
  providerRegistry.set("BKASH", defaultBkashProvider);
}

