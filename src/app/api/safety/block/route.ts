import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { safetyService } from "@/server/services/safety.service";
import { blockUserSchema, unblockUserSchema } from "@/lib/validations/messaging";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();
    const valid = blockUserSchema.parse(body);

    await safetyService.blockProfile(profile.id, valid.targetProfileId, valid.reason);

    return NextResponse.json({ success: true, blocked: true });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to block member.",
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
    const valid = unblockUserSchema.parse(body);

    await safetyService.unblockProfile(profile.id, valid.targetProfileId);

    return NextResponse.json({ success: true, unblocked: true });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to unblock member.",
      },
      { status: 400 }
    );
  }
}

