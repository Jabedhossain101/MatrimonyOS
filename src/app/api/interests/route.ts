import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { interestService } from "@/server/services/interest.service";
import {
  sendInterestSchema,
  respondInterestSchema,
  withdrawInterestSchema,
} from "@/lib/validations/discovery";
import { InterestStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const type = req.nextUrl.searchParams.get("type") || "received";
    const statusParam = req.nextUrl.searchParams.get("status") as InterestStatus | null;
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 12;

    if (type === "sent") {
      const result = await interestService.getSentInterests(user.id, profile.id, {
        status: statusParam || undefined,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    const result = await interestService.getReceivedInterests(user.id, profile.id, {
      status: statusParam || undefined,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to retrieve interests.",
      },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();
    const valid = sendInterestSchema.parse(body);

    const result = await interestService.sendInterest(
      user.id,
      profile.id,
      valid.recipientProfileId,
      valid.message,
      user.roles
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send interest.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();
    const valid = respondInterestSchema.parse(body);

    const result = await interestService.respondToInterest(
      profile.id,
      valid.interestId,
      valid.action
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to respond to interest.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();
    const valid = withdrawInterestSchema.parse(body);

    await interestService.withdrawInterest(profile.id, valid.interestId);

    return NextResponse.json({ success: true, withdrawn: true });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to withdraw interest.",
      },
      { status: 400 }
    );
  }
}
