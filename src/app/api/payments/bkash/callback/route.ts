import { NextResponse, type NextRequest } from "next/server";
import { bkashCallbackSchema } from "@/lib/validations/payment";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { paymentVerificationService } from "@/server/payments/payment-verification.service";
import { checkRateLimit } from "@/server/utils/rate-limit";

export const instant = false;

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || null;

  const rate = checkRateLimit({
    key: `bkash_callback:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    const failedUrl = new URL("/dashboard/billing/failed", request.url);
    failedUrl.searchParams.set(
      "reason",
      "Rate limit exceeded while verifying payment callback."
    );
    return NextResponse.redirect(failedUrl);
  }

  const { searchParams } = request.nextUrl;
  const rawParams = {
    paymentID: searchParams.get("paymentID") ?? "",
    status: searchParams.get("status") ?? "",
    signature: searchParams.get("signature") ?? undefined,
    apiVersion: searchParams.get("apiVersion") ?? undefined,
  };

  const parsed = bkashCallbackSchema.safeParse(rawParams);
  if (!parsed.success) {
    const failedUrl = new URL("/dashboard/billing/failed", request.url);
    failedUrl.searchParams.set(
      "reason",
      "Invalid or missing bKash callback parameters."
    );
    return NextResponse.redirect(failedUrl);
  }

  try {
    const user = await getCurrentUser();

    const verificationResult =
      await paymentVerificationService.verifyBkashCallback({
        providerPaymentId: parsed.data.paymentID,
        callbackStatus: parsed.data.status,
        actorUserId: user?.id,
        ipAddress: ip,
        userAgent,
      });

    if (verificationResult.verified) {
      const successUrl = new URL("/dashboard/billing/success", request.url);
      successUrl.searchParams.set("paymentId", verificationResult.payment.id);
      return NextResponse.redirect(successUrl);
    }

    const failedUrl = new URL("/dashboard/billing/failed", request.url);
    failedUrl.searchParams.set("paymentId", verificationResult.payment.id);
    failedUrl.searchParams.set("status", verificationResult.status);
    failedUrl.searchParams.set("reason", verificationResult.message);
    return NextResponse.redirect(failedUrl);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Payment verification encountered an unexpected error.";
    const failedUrl = new URL("/dashboard/billing/failed", request.url);
    failedUrl.searchParams.set("reason", message);
    return NextResponse.redirect(failedUrl);
  }
}

