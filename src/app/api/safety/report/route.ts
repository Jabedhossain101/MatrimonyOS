import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { safetyService } from "@/server/services/safety.service";
import { reportUserSchema } from "@/lib/validations/messaging";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();
    const valid = reportUserSchema.parse(body);

    const report = await safetyService.submitReport({
      reporterProfileId: profile.id,
      reportedProfileId: valid.reportedProfileId,
      reportedMessageId: valid.reportedMessageId || null,
      reportedConversationId: valid.reportedConversationId || null,
      reason: valid.reason,
      description: valid.description || null,
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to submit report.",
      },
      { status: 400 }
    );
  }
}

