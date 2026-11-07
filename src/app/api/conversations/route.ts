import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { messagingService } from "@/server/services/messaging.service";
import { createConversationSchema } from "@/lib/validations/messaging";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileService.getOrCreateProfile(user.id);
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;

    const result = await messagingService.listConversations(profile.id, {
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load conversations.",
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
    const valid = createConversationSchema.parse(body);

    const conversation = await messagingService.getOrCreateConversation(
      profile.id,
      valid.targetProfileId
    );

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to initiate conversation.",
      },
      { status: 400 }
    );
  }
}
