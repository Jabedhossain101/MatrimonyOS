import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { subscriptionBillingService } from "@/server/payments/subscription-billing.service";

export const instant = false;

export function verifyCronAuthorization(
  authHeader: string | null,
  customSecretHeader: string | null,
  expectedSecret: string | undefined = env.PAYMENT_CRON_SECRET
): boolean {
  if (!expectedSecret || expectedSecret.trim().length < 16) {
    return false;
  }

  let candidate = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    candidate = authHeader.slice(7).trim();
  } else if (customSecretHeader) {
    candidate = customSecretHeader.trim();
  }

  if (!candidate) return false;

  const expectedBuf = Buffer.from(expectedSecret, "utf8");
  const candidateBuf = Buffer.from(candidate, "utf8");

  if (expectedBuf.length !== candidateBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, candidateBuf);
}

async function handleSubscriptionCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-cron-secret");

  if (!verifyCronAuthorization(authHeader, secretHeader)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing PAYMENT_CRON_SECRET." },
      { status: 401 }
    );
  }

  try {
    const summary =
      await subscriptionBillingService.processSubscriptionLifecycleCron();
    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Subscription lifecycle cron failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSubscriptionCron(request);
}

export async function POST(request: NextRequest) {
  return handleSubscriptionCron(request);
}

