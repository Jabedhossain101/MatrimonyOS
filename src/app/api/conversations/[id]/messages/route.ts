import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { messagingService } from "@/server/services/messaging.service";
import { sendMessageSchema } from "@/lib/validations/messaging";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const profile = await profileService.getOrCreateProfile(user.id);

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 30;
    const afterTimestamp = req.nextUrl.searchParams.get("afterTimestamp") || undefined;

    const result = await messagingService.listMessages(profile.id, conversationId, {
      cursor,
      limit,
      afterTimestamp,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load messages.",
      },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const profile = await profileService.getOrCreateProfile(user.id);
    const body = await req.json();

    const valid = sendMessageSchema.parse({
      ...body,
      conversationId,
    });

    const message = await messagingService.sendMessage(profile.id, valid);

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to send message.",
      },
      { status: 400 }
    );
  }
}

