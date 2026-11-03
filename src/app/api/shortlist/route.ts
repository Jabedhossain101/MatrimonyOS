import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { shortlistService } from "@/server/services/shortlist.service";
import { toggleShortlistSchema } from "@/lib/validations/discovery";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 12;
    const query = req.nextUrl.searchParams.get("query") || undefined;

    const result = await shortlistService.getMemberShortlist(
      user.id,
      profile.id,
      { page, limit, query }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to retrieve shortlisted profiles.",
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
    const valid = toggleShortlistSchema.parse(body);

    const result = await shortlistService.toggleShortlist(
      user.id,
      profile.id,
      valid.targetProfileId
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to toggle shortlist.",
      },
      { status: 400 }
    );
  }
}
