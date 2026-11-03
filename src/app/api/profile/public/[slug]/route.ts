import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";

export const instant = false;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const redacted = await profileService.getProfileBySlug(
      slug,
      user?.id || null
    );

    if (!redacted) {
      return NextResponse.json(
        { error: "Profile not found or is set to private" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile: redacted });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load public profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

