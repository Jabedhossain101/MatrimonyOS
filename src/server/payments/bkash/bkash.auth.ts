import {
  BKASH_SUCCESS_STATUS_CODE,
  type BkashConfig,
  type BkashGrantTokenResponse,
} from "../payment.types";
import {
  BkashProviderError,
  executeBkashHttpRequest,
  getBkashConfig,
} from "./bkash.client";

interface CachedBkashToken {
  idToken: string;
  refreshToken: string;
  expiresAtMs: number;
  refreshExpiresAtMs: number;
}

const TOKEN_SAFETY_BUFFER_MS = 60_000; // Refresh 60 seconds before expiry
const REFRESH_TOKEN_TTL_MS = 27 * 24 * 60 * 60 * 1000; // 27 days (official bKash refresh_token validity is 28 days)

let cachedToken: CachedBkashToken | null = null;
let inflightTokenPromise: Promise<string> | null = null;

/**
 * Clears the in-memory bKash token cache and any in-flight lock.
 */
export function clearBkashTokenCache(): void {
  cachedToken = null;
  inflightTokenPromise = null;
}

/**
 * Calls the official bKash Grant Token endpoint (`/tokenized/checkout/token/grant`).
 */
export async function grantBkashToken(options?: {
  config?: BkashConfig;
  fetchImpl?: typeof fetch;
}): Promise<CachedBkashToken> {
  const config = options?.config ?? getBkashConfig();

  const response = await executeBkashHttpRequest<BkashGrantTokenResponse>({
    path: "/tokenized/checkout/token/grant",
    headers: {
      username: config.username,
      password: config.password,
    },
    body: {
      app_key: config.appKey,
      app_secret: config.appSecret,
    },
    config,
    fetchImpl: options?.fetchImpl,
  });

  if (
    response.statusCode !== BKASH_SUCCESS_STATUS_CODE ||
    !response.id_token
  ) {
    throw new BkashProviderError(
      response.statusMessage || "Failed to obtain bKash grant token.",
      response.statusCode || "TOKEN_GRANT_FAILED",
      401
    );
  }

  const expiresInSeconds =
    typeof response.expires_in === "number" && response.expires_in > 120
      ? response.expires_in
      : 3600;
  const now = Date.now();

  return {
    idToken: response.id_token,
    refreshToken: response.refresh_token || "",
    expiresAtMs: now + expiresInSeconds * 1000 - TOKEN_SAFETY_BUFFER_MS,
    refreshExpiresAtMs: now + REFRESH_TOKEN_TTL_MS,
  };
}

/**
 * Calls the official bKash Refresh Token endpoint (`/tokenized/checkout/token/refresh`).
 */
export async function refreshBkashToken(
  refreshToken: string,
  options?: {
    config?: BkashConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<CachedBkashToken> {
  const config = options?.config ?? getBkashConfig();

  const response = await executeBkashHttpRequest<BkashGrantTokenResponse>({
    path: "/tokenized/checkout/token/refresh",
    headers: {
      username: config.username,
      password: config.password,
    },
    body: {
      app_key: config.appKey,
      app_secret: config.appSecret,
      refresh_token: refreshToken,
    },
    config,
    fetchImpl: options?.fetchImpl,
  });

  if (
    response.statusCode !== BKASH_SUCCESS_STATUS_CODE ||
    !response.id_token
  ) {
    throw new BkashProviderError(
      response.statusMessage || "Failed to refresh bKash token.",
      response.statusCode || "TOKEN_REFRESH_FAILED",
      401
    );
  }

  const expiresInSeconds =
    typeof response.expires_in === "number" && response.expires_in > 120
      ? response.expires_in
      : 3600;
  const now = Date.now();

  return {
    idToken: response.id_token,
    refreshToken: response.refresh_token || refreshToken,
    expiresAtMs: now + expiresInSeconds * 1000 - TOKEN_SAFETY_BUFFER_MS,
    refreshExpiresAtMs: now + REFRESH_TOKEN_TTL_MS,
  };
}

/**
 * Returns a valid bKash `id_token`, refreshing or granting as needed.
 * Uses a single-flight Promise lock to prevent concurrent token-refresh race conditions.
 */
export async function getValidBkashToken(options?: {
  forceRefresh?: boolean;
  config?: BkashConfig;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const now = Date.now();

  if (
    !options?.forceRefresh &&
    cachedToken &&
    cachedToken.expiresAtMs > now
  ) {
    return cachedToken.idToken;
  }

  if (inflightTokenPromise) {
    return inflightTokenPromise;
  }

  inflightTokenPromise = (async () => {
    try {
      const currentTime = Date.now();
      if (
        cachedToken &&
        cachedToken.refreshToken &&
        cachedToken.refreshExpiresAtMs > currentTime
      ) {
        try {
          cachedToken = await refreshBkashToken(
            cachedToken.refreshToken,
            options
          );
          return cachedToken.idToken;
        } catch {
          // If refresh fails (e.g. invalidated on provider), fall back cleanly to grantToken
        }
      }

      cachedToken = await grantBkashToken(options);
      return cachedToken.idToken;
    } finally {
      inflightTokenPromise = null;
    }
  })();

  return inflightTokenPromise;
}

/**
 * Returns the standard authenticated headers (`Authorization` and `X-APP-Key`) required by bKash endpoints.
 */
export async function getBkashAuthenticatedHeaders(options?: {
  forceRefresh?: boolean;
  config?: BkashConfig;
  fetchImpl?: typeof fetch;
}): Promise<Record<string, string>> {
  const config = options?.config ?? getBkashConfig();
  const idToken = await getValidBkashToken(options);
  return {
    Authorization: idToken,
    "X-APP-Key": config.appKey,
  };
}

