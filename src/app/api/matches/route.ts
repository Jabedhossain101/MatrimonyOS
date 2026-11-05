import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { interestService } from "@/server/services/interest.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 12;

    const result = await interestService.getMutualMatches(
      user.id,
      profile.id,
      { page, limit }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to retrieve mutual matches.",
      },
      { status: 400 }
    );
  }
}

