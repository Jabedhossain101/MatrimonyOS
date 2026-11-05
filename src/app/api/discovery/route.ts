import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { discoveryService } from "@/server/services/discovery.service";
import { discoveryFilterSchema } from "@/lib/validations/discovery";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validatedFilters = discoveryFilterSchema.parse({
      ...searchParams,
      maritalStatus: searchParams.maritalStatus
        ? searchParams.maritalStatus.split(",")
        : undefined,
    });

    const result = await discoveryService.discoverProfiles(
      user.id,
      profile.id,
      validatedFilters
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during discovery.",
      },
      { status: 400 }
    );
  }
}

