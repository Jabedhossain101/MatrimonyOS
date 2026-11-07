import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { db } from "@/server/db";
import { cloudinaryService } from "@/server/services/cloudinary.service";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/lib/validations/profile";

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

    // Verify conversation exists and user is participant
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (
      conversation.participant1Id !== profile.id &&
      conversation.participant2Id !== profile.id
    ) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Allowed formats: JPG, PNG, WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds maximum allowed size of 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await cloudinaryService.uploadMessageAttachmentBuffer(
      buffer,
      file.type,
      conversationId
    );

    return NextResponse.json({
      success: true,
      attachment: {
        cloudinaryPublicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to upload attachment.",
      },
      { status: 400 }
    );
  }
}

