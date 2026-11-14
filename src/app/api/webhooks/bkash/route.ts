import { NextResponse, type NextRequest } from "next/server";
import { paymentService } from "@/server/payments/payment.service";
import { checkRateLimit } from "@/server/utils/rate-limit";

export const instant = false;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rate = checkRateLimit({
    key: `bkash_webhook:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read webhook request payload." },
      { status: 400 }
    );
  }

  if (!rawBody || rawBody.trim().length === 0) {
    return NextResponse.json(
      { error: "Empty webhook payload." },
      { status: 400 }
    );
  }

  const result = await paymentService.processBkashWebhook({ rawBody });

  return NextResponse.json(
    {
      acknowledged: result.acknowledged,
      duplicate: result.duplicate ?? false,
      message: result.message,
    },
    { status: result.status }
  );
}

