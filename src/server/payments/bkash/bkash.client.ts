import { env } from "@/lib/env";
import type { BkashConfig } from "../payment.types";

export class BkashProviderError extends Error {
  public readonly statusCode: string;
  public readonly httpStatus: number;

  constructor(message: string, statusCode = "UNKNOWN", httpStatus = 502) {
    super(message);
    this.name = "BkashProviderError";
    this.statusCode = statusCode;
    this.httpStatus = httpStatus;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export function getBkashConfig(overrides?: Partial<BkashConfig>): BkashConfig {
  return {
    appKey: overrides?.appKey ?? env.BKASH_APP_KEY ?? "",
    appSecret: overrides?.appSecret ?? env.BKASH_APP_SECRET ?? "",
    username: overrides?.username ?? env.BKASH_USERNAME ?? "",
    password: overrides?.password ?? env.BKASH_PASSWORD ?? "",
    baseUrl: (
      overrides?.baseUrl ??
      env.BKASH_BASE_URL ??
      "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    ).replace(/\/+$/, ""),
    isSandbox: overrides?.isSandbox ?? env.BKASH_IS_SANDBOX ?? true,
    webhookEnabled: overrides?.webhookEnabled ?? env.BKASH_WEBHOOK_ENABLED ?? false,
    agreementEnabled: overrides?.agreementEnabled ?? env.BKASH_AGREEMENT_ENABLED ?? false,
  };
}

export function assertBkashConfigured(config: BkashConfig): void {
  if (
    !config.appKey ||
    !config.appSecret ||
    !config.username ||
    !config.password ||
    !config.baseUrl
  ) {
    throw new BkashProviderError(
      "bKash merchant credentials are not configured on the server.",
      "BKASH_NOT_CONFIGURED",
      503
    );
  }
}

export interface BkashRequestOptions {
  path: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  timeoutMs?: number;
  config?: BkashConfig;
  fetchImpl?: typeof fetch;
}

/**
 * Low-level HTTP transport for official bKash Tokenized Checkout API calls.
 * Applies strict timeout, JSON validation, and never logs sensitive headers or secrets.
 */
export async function executeBkashHttpRequest<TResponse>(
  options: BkashRequestOptions
): Promise<TResponse> {
  const config = options.config ?? getBkashConfig();
  assertBkashConfigured(config);

  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const normalizedPath = options.path.startsWith("/")
    ? options.path
    : `/${options.path}`;
  const url = `${config.baseUrl}${normalizedPath}`;

  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      body: JSON.stringify(options.body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 429) {
      throw new BkashProviderError(
        "bKash gateway rate limit exceeded. Please retry momentarily.",
        "RATE_LIMITED",
        429
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new BkashProviderError(
        "bKash gateway authentication rejected by provider.",
        "AUTH_REJECTED",
        response.status
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new BkashProviderError(
        `bKash gateway returned non-JSON response (HTTP ${response.status}).`,
        "INVALID_PROVIDER_RESPONSE",
        502
      );
    }

    if (!response.ok) {
      const errObj = data as Record<string, unknown> | null;
      const providerMsg =
        (typeof errObj?.statusMessage === "string" && errObj.statusMessage) ||
        (typeof errObj?.message === "string" && errObj.message) ||
        `bKash gateway error (HTTP ${response.status})`;
      const providerCode =
        (typeof errObj?.statusCode === "string" && errObj.statusCode) ||
        `HTTP_${response.status}`;
      throw new BkashProviderError(providerMsg, providerCode, response.status);
    }

    return data as TResponse;
  } catch (error: unknown) {
    if (error instanceof BkashProviderError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new BkashProviderError(
        "bKash gateway request timed out.",
        "PROVIDER_TIMEOUT",
        504
      );
    }
    throw new BkashProviderError(
      "Transient network failure communicating with bKash gateway.",
      "NETWORK_ERROR",
      502
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

