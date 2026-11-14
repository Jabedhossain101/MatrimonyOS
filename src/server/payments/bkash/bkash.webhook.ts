import crypto from "node:crypto";
import {
  bkashSnsEnvelopeSchema,
  type BkashSnsEnvelope,
} from "@/lib/validations/payment";

const TRUSTED_SNS_HOST_REGEX = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;
const TRUSTED_CERT_PATH_REGEX = /^\/SimpleNotificationService-[a-zA-Z0-9]+\.pem$/;

const certCache = new Map<string, string>();

export function clearWebhookCertCache(): void {
  certCache.clear();
}

/**
 * Validates that an AWS SNS SigningCertURL is strictly hosted on a trusted Amazon SNS HTTPS endpoint.
 * Prevents SSRF attacks against internal networks, metadata services, or arbitrary third-party hosts.
 */
export function isTrustedSnsCertificateUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.port !== "" && parsed.port !== "443") return false;
    if (!TRUSTED_SNS_HOST_REGEX.test(parsed.hostname)) return false;
    if (!TRUSTED_CERT_PATH_REGEX.test(parsed.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that an AWS SNS SubscribeURL is strictly hosted on a trusted Amazon SNS HTTPS endpoint.
 */
export function isTrustedSnsSubscribeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.port !== "" && parsed.port !== "443") return false;
    if (!TRUSTED_SNS_HOST_REGEX.test(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the canonical AWS SNS string-to-sign according to official AWS SNS signature specification.
 */
export function buildSnsStringToSign(envelope: BkashSnsEnvelope): string {
  const lines: string[] = [];

  if (envelope.Type === "Notification") {
    lines.push("Message", envelope.Message);
    lines.push("MessageId", envelope.MessageId);
    if (envelope.Subject !== undefined) {
      lines.push("Subject", envelope.Subject);
    }
    lines.push("Timestamp", envelope.Timestamp);
    lines.push("TopicArn", envelope.TopicArn);
    lines.push("Type", envelope.Type);
  } else {
    lines.push("Message", envelope.Message);
    lines.push("MessageId", envelope.MessageId);
    if (envelope.SubscribeURL !== undefined) {
      lines.push("SubscribeURL", envelope.SubscribeURL);
    }
    lines.push("Timestamp", envelope.Timestamp);
    if (envelope.Token !== undefined) {
      lines.push("Token", envelope.Token);
    }
    lines.push("TopicArn", envelope.TopicArn);
    lines.push("Type", envelope.Type);
  }

  return lines.join("\n") + "\n";
}

/**
 * Computes a deterministic SHA-256 hex digest of the raw webhook payload.
 */
export function computeWebhookPayloadHash(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
}

async function fetchSigningCertificatePem(
  certUrl: string,
  fetchImpl: typeof fetch = globalThis.fetch
): Promise<string> {
  if (!isTrustedSnsCertificateUrl(certUrl)) {
    throw new Error("Untrusted or invalid AWS SNS SigningCertURL blocked (SSRF protection).");
  }

  const cached = certCache.get(certUrl);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetchImpl(certUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "error", // Never follow redirects on signing certificate fetches
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch SNS signing certificate (HTTP ${res.status}).`);
    }

    const pem = await res.text();
    if (
      !pem.includes("-----BEGIN CERTIFICATE-----") &&
      !pem.includes("-----BEGIN PUBLIC KEY-----")
    ) {
      throw new Error("Invalid X.509 PEM certificate content received.");
    }

    certCache.set(certUrl, pem);
    return pem;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifies the cryptographic signature of an incoming bKash AWS SNS webhook message.
 */
export async function verifyBkashSnsWebhookSignature(
  rawPayload: unknown,
  options?: {
    fetchImpl?: typeof fetch;
    maxAgeMs?: number;
  }
): Promise<{
  valid: boolean;
  envelope?: BkashSnsEnvelope;
  reason?: string;
}> {
  const parsed = bkashSnsEnvelopeSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      valid: false,
      reason: `Invalid SNS envelope structure: ${parsed.error.issues[0]?.message || "schema mismatch"}`,
    };
  }

  const envelope = parsed.data;

  if (!isTrustedSnsCertificateUrl(envelope.SigningCertURL)) {
    return {
      valid: false,
      reason: "Untrusted SigningCertURL origin rejected (SSRF protection).",
    };
  }

  // Optional replay timestamp window check (default 15 minutes if enforced)
  const maxAgeMs = options?.maxAgeMs ?? 15 * 60 * 1000;
  const msgTime = Date.parse(envelope.Timestamp);
  if (Number.isNaN(msgTime)) {
    return {
      valid: false,
      reason: "Invalid SNS Timestamp format.",
    };
  }
  if (maxAgeMs > 0 && Math.abs(Date.now() - msgTime) > maxAgeMs) {
    return {
      valid: false,
      reason: "SNS message timestamp outside allowed replay window.",
    };
  }

  try {
    const pem = await fetchSigningCertificatePem(
      envelope.SigningCertURL,
      options?.fetchImpl
    );

    const stringToSign = buildSnsStringToSign(envelope);
    const algorithm =
      envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1";
    const verifier = crypto.createVerify(algorithm);
    verifier.update(stringToSign, "utf8");
    verifier.end();

    const isValid = verifier.verify(pem, envelope.Signature, "base64");
    if (!isValid) {
      return {
        valid: false,
        reason: "Cryptographic SNS signature verification failed.",
      };
    }

    return {
      valid: true,
      envelope,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      reason:
        err instanceof Error
          ? err.message
          : "Webhook certificate verification error.",
    };
  }
}

export interface BkashIpnTransactionNotification {
  dateTime?: string;
  debitMSISDN?: string;
  creditOrganizationName?: string;
  creditShortCode?: string;
  trxID?: string;
  transactionStatus?: string;
  transactionType?: string;
  amount?: string;
  currency?: string;
  transactionReference?: string;
  merchantInvoiceNumber?: string;
  paymentID?: string;
}

export function parseBkashSnsNotificationMessage(
  messageStr: string
): BkashIpnTransactionNotification {
  const parsed = JSON.parse(messageStr) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("SNS Notification Message is not a valid JSON object.");
  }
  return parsed as BkashIpnTransactionNotification;
}

