import "server-only";
import { db } from "@/server/db";
import { MessageStatus, NotificationType } from "@/generated/prisma";
import { safetyService } from "./safety.service";
import { notificationService } from "./notification.service";
import {
  redactProfileForViewer,
  type RedactedPublicProfile,
  type CompleteProfile,
} from "@/server/utils/privacy";
import type { SendMessageInput } from "@/lib/validations/messaging";

export interface ConversationSummary {
  id: string;
  matchId: string | null;
  otherProfile: RedactedPublicProfile;
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  isBlocked: boolean;
  createdAt: Date;
}

export interface DetailedMessage {
  id: string;
  conversationId: string;
  senderProfileId: string;
  content: string | null;
  status: MessageStatus;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  isSender: boolean;
  attachments: {
    id: string;
    cloudinaryPublicId: string;
    secureUrl: string;
    format: string;
    bytes: number;
    width: number | null;
    height: number | null;
  }[];
}

export const messagingService = {
  /**
   * Strictly verify messaging eligibility between two profiles:
   * 1. Cannot message self.
   * 2. Must possess an active MutualMatch from Phase 5.
   * 3. Neither profile has blocked each other.
   * 4. Neither account is suspended or deactivated.
   */
  async verifyMessagingEligibility(viewerProfileId: string, targetProfileId: string) {
    if (viewerProfileId === targetProfileId) {
      throw new Error("You cannot start a conversation with yourself.");
    }

    // Check if blocked
    const isBlocked = await safetyService.isBlocked(viewerProfileId, targetProfileId);
    if (isBlocked) {
      throw new Error("Communication with this member is unavailable due to privacy or block restrictions.");
    }

    // Check both profiles exist & account status
    const [viewerProfile, targetProfile] = await Promise.all([
      db.matrimonialProfile.findUnique({
        where: { id: viewerProfileId },
        include: { user: { select: { accountStatus: true } } },
      }),
      db.matrimonialProfile.findUnique({
        where: { id: targetProfileId },
        include: { user: { select: { accountStatus: true } } },
      }),
    ]);

    if (!viewerProfile || viewerProfile.user.accountStatus !== "ACTIVE") {
      throw new Error("Your account must be active to send messages.");
    }

    if (!targetProfile || targetProfile.user.accountStatus !== "ACTIVE") {
      throw new Error("This member's account is currently inactive.");
    }

    // Canonical ordering for MutualMatch lookup
    const [p1, p2] =
      viewerProfileId < targetProfileId
        ? [viewerProfileId, targetProfileId]
        : [targetProfileId, viewerProfileId];

    const mutualMatch = await db.mutualMatch.findUnique({
      where: {
        profile1Id_profile2Id: {
          profile1Id: p1,
          profile2Id: p2,
        },
      },
    });

    if (!mutualMatch) {
      throw new Error(
        "Private messaging requires an accepted mutual match. Express interest and wait for mutual alignment first."
      );
    }

    return {
      viewerProfile,
      targetProfile,
      mutualMatch,
    };
  },

  /**
   * Get existing conversation or create a new conversation for an eligible mutual match.
   */
  async getOrCreateConversation(viewerProfileId: string, targetProfileId: string) {
    const { mutualMatch } = await this.verifyMessagingEligibility(viewerProfileId, targetProfileId);

    const [p1, p2] =
      viewerProfileId < targetProfileId
        ? [viewerProfileId, targetProfileId]
        : [targetProfileId, viewerProfileId];

    // Find or create conversation
    let conversation = await db.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          matchId: mutualMatch.id,
          participant1Id: p1,
          participant2Id: p2,
        },
      });
    }

    return conversation;
  },

  /**
   * Get conversation details with participant validation and privacy redaction.
   */
  async getConversationById(viewerProfileId: string, conversationId: string) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: {
          include: {
            photos: {
              where: { moderationStatus: "APPROVED" },
              orderBy: { isPrimary: "desc" },
            },
            privacySettings: true,
          },
        },
        participant2: {
          include: {
            photos: {
              where: { moderationStatus: "APPROVED" },
              orderBy: { isPrimary: "desc" },
            },
            privacySettings: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    // Validate membership
    if (
      conversation.participant1Id !== viewerProfileId &&
      conversation.participant2Id !== viewerProfileId
    ) {
      throw new Error("Unauthorized: You are not a participant in this conversation.");
    }

    const isViewerP1 = conversation.participant1Id === viewerProfileId;
    const otherRawProfile = isViewerP1 ? conversation.participant2 : conversation.participant1;
    const otherProfileId = otherRawProfile.id;

    // Check block status
    const isBlocked = await safetyService.isBlocked(viewerProfileId, otherProfileId);

    // Redact profile according to platform rules
    const redactedOtherProfile: RedactedPublicProfile = redactProfileForViewer(
      otherRawProfile as unknown as CompleteProfile,
      null,
      true
    ) ?? {
      id: otherRawProfile.id,
      slug: otherRawProfile.slug,
      fullName: otherRawProfile.fullName || "MatrimonyOS Member",
      age: null,
      gender: otherRawProfile.gender,
      maritalStatus: otherRawProfile.maritalStatus,
      countryOfResidence: otherRawProfile.countryOfResidence,
      cityOfResidence: otherRawProfile.cityOfResidence,
      nationality: otherRawProfile.nationality,
      preferredLanguage: otherRawProfile.preferredLanguage,
      religion: otherRawProfile.religion,
      profession: otherRawProfile.profession,
      employmentStatus: otherRawProfile.employmentStatus,
      dietaryHabits: otherRawProfile.dietaryHabits,
      smokingHabits: otherRawProfile.smokingHabits,
      drinkingHabits: otherRawProfile.drinkingHabits,
      aboutMe: otherRawProfile.aboutMe,
      heightCm: otherRawProfile.heightCm,
      hobbies: otherRawProfile.hobbies || [],
      languages: otherRawProfile.languages || [],
      educations: [],
      photos: (otherRawProfile.photos || []).map((p: { id: string; secureUrl: string; isPrimary: boolean }) => ({
        id: p.id,
        secureUrl: p.secureUrl,
        isPrimary: p.isPrimary,
      })),
      isOwner: false,
      viewerCanAccess: true,
      profileVisibility: "MEMBERS_ONLY" as const,
      photoVisibility: "MEMBERS_ONLY" as const,
      completionPercentage: otherRawProfile.completionPercentage || 0,
      createdAt: otherRawProfile.createdAt,
    };

    return {
      id: conversation.id,
      matchId: conversation.matchId,
      otherProfile: redactedOtherProfile,
      otherProfileId,
      isBlocked,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessageText: conversation.lastMessageText,
    };
  },

  /**
   * List all conversations for the viewing member with unread count and latest message preview.
   */
  async listConversations(
    viewerProfileId: string,
    options: { search?: string; page?: number; limit?: number } = {}
  ): Promise<{
    conversations: ConversationSummary[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause = {
      OR: [
        { participant1Id: viewerProfileId, participant1Archived: false },
        { participant2Id: viewerProfileId, participant2Archived: false },
      ],
    };

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where: whereClause,
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        skip,
        take: limit,
        include: {
          participant1: {
            include: {
              photos: {
                where: { moderationStatus: "APPROVED" },
                orderBy: { isPrimary: "desc" },
              },
              privacySettings: true,
            },
          },
          participant2: {
            include: {
              photos: {
                where: { moderationStatus: "APPROVED" },
                orderBy: { isPrimary: "desc" },
              },
              privacySettings: true,
            },
          },
        },
      }),
      db.conversation.count({ where: whereClause }),
    ]);

    // Compute unread counts and redact profiles
    const summaries: ConversationSummary[] = await Promise.all(
      conversations.map(async (conv) => {
        const isViewerP1 = conv.participant1Id === viewerProfileId;
        const otherRaw = isViewerP1 ? conv.participant2 : conv.participant1;

        const [unreadCount, isBlocked] = await Promise.all([
          db.message.count({
            where: {
              conversationId: conv.id,
              senderProfileId: { not: viewerProfileId },
              status: { not: MessageStatus.READ },
              isDeletedByRecipient: false,
            },
          }),
          safetyService.isBlocked(viewerProfileId, otherRaw.id),
        ]);

        const otherProfile: RedactedPublicProfile = redactProfileForViewer(
          otherRaw as unknown as CompleteProfile,
          null,
          true
        ) ?? {
          id: otherRaw.id,
          slug: otherRaw.slug,
          fullName: otherRaw.fullName || "MatrimonyOS Member",
          age: null,
          gender: otherRaw.gender,
          maritalStatus: otherRaw.maritalStatus,
          countryOfResidence: otherRaw.countryOfResidence,
          cityOfResidence: otherRaw.cityOfResidence,
          nationality: otherRaw.nationality,
          preferredLanguage: otherRaw.preferredLanguage,
          religion: otherRaw.religion,
          profession: otherRaw.profession,
          employmentStatus: otherRaw.employmentStatus,
          dietaryHabits: otherRaw.dietaryHabits,
          smokingHabits: otherRaw.smokingHabits,
          drinkingHabits: otherRaw.drinkingHabits,
          aboutMe: otherRaw.aboutMe,
          heightCm: otherRaw.heightCm,
          hobbies: otherRaw.hobbies || [],
          languages: otherRaw.languages || [],
          educations: [],
          photos: (otherRaw.photos || []).map((p: { id: string; secureUrl: string; isPrimary: boolean }) => ({
            id: p.id,
            secureUrl: p.secureUrl,
            isPrimary: p.isPrimary,
          })),
          isOwner: false,
          viewerCanAccess: true,
          profileVisibility: "MEMBERS_ONLY" as const,
          photoVisibility: "MEMBERS_ONLY" as const,
          completionPercentage: otherRaw.completionPercentage || 0,
          createdAt: otherRaw.createdAt,
        };

        return {
          id: conv.id,
          matchId: conv.matchId,
          otherProfile,
          lastMessageText: conv.lastMessageText,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          isBlocked,
          createdAt: conv.createdAt,
        };
      })
    );

    // Apply search filter if provided
    let filtered = summaries;
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filtered = summaries.filter(
        (s) =>
          s.otherProfile.fullName.toLowerCase().includes(q) ||
          s.otherProfile.profession?.toLowerCase().includes(q) ||
          s.otherProfile.cityOfResidence?.toLowerCase().includes(q)
      );
    }

    return {
      conversations: filtered,
      total,
      page,
      limit,
    };
  },

  /**
   * Send a private message in a conversation.
   */
  async sendMessage(viewerProfileId: string, input: SendMessageInput) {
    const conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
    });

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    if (
      conversation.participant1Id !== viewerProfileId &&
      conversation.participant2Id !== viewerProfileId
    ) {
      throw new Error("Unauthorized: You cannot post in this conversation.");
    }

    const recipientProfileId =
      conversation.participant1Id === viewerProfileId
        ? conversation.participant2Id
        : conversation.participant1Id;

    // Check if blocked
    const isBlocked = await safetyService.isBlocked(viewerProfileId, recipientProfileId);
    if (isBlocked) {
      throw new Error("You cannot send messages to this member due to privacy or block restrictions.");
    }

    const messageContent = input.content?.trim() || null;
    const previewText = messageContent || (input.attachment ? "Sent an image" : "");

    // Create message and update conversation transactionally
    const createdMessage = await db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderProfileId: viewerProfileId,
          content: messageContent,
          status: MessageStatus.SENT,
          deliveredAt: new Date(),
        },
      });

      if (input.attachment) {
        await tx.messageAttachment.create({
          data: {
            messageId: msg.id,
            cloudinaryPublicId: input.attachment.cloudinaryPublicId,
            secureUrl: input.attachment.secureUrl,
            format: input.attachment.format,
            bytes: input.attachment.bytes,
            width: input.attachment.width || null,
            height: input.attachment.height || null,
          },
        });
      }

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: previewText,
          // Un-archive if previously archived
          participant1Archived: false,
          participant2Archived: false,
        },
      });

      return msg;
    });

    // Send in-app & email notification to recipient
    await notificationService.createNotification({
      recipientProfileId,
      senderProfileId: viewerProfileId,
      type: NotificationType.NEW_MESSAGE,
      title: "New Private Message",
      body: previewText.length > 50 ? `${previewText.slice(0, 47)}...` : previewText,
      link: `/dashboard/messages/${conversation.id}`,
      entityId: conversation.id,
    });

    return createdMessage;
  },

  /**
   * List messages in a conversation.
   * Supports `afterTimestamp` for efficient lightweight polling.
   */
  async listMessages(
    viewerProfileId: string,
    conversationId: string,
    options: {
      cursor?: string;
      limit?: number;
      afterTimestamp?: Date | string;
    } = {}
  ): Promise<{
    messages: DetailedMessage[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    if (
      conversation.participant1Id !== viewerProfileId &&
      conversation.participant2Id !== viewerProfileId
    ) {
      throw new Error("Unauthorized: You are not a participant in this conversation.");
    }

    const limit = Math.min(100, Math.max(1, options.limit || 30));

    // Where clause respecting per-user soft delete
    const isViewerSenderCondition = {
      OR: [
        { senderProfileId: viewerProfileId, isDeletedBySender: false },
        { senderProfileId: { not: viewerProfileId }, isDeletedByRecipient: false },
      ],
    };

    // If polling for new messages after a timestamp
    if (options.afterTimestamp) {
      const sinceDate = new Date(options.afterTimestamp);
      const rawMessages = await db.message.findMany({
        where: {
          conversationId,
          createdAt: { gt: sinceDate },
          ...isViewerSenderCondition,
        },
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      });

      const messages: DetailedMessage[] = rawMessages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderProfileId: m.senderProfileId,
        content: m.content,
        status: m.status,
        deliveredAt: m.deliveredAt,
        readAt: m.readAt,
        createdAt: m.createdAt,
        isSender: m.senderProfileId === viewerProfileId,
        attachments: m.attachments.map((a) => ({
          id: a.id,
          cloudinaryPublicId: a.cloudinaryPublicId,
          secureUrl: a.secureUrl,
          format: a.format,
          bytes: a.bytes,
          width: a.width,
          height: a.height,
        })),
      }));

      return { messages, hasMore: false };
    }

    // Standard history loading (newest first for cursor, reversed for rendering)
    const rawMessages = await db.message.findMany({
      where: {
        conversationId,
        ...isViewerSenderCondition,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: { attachments: true },
    });

    const hasMore = rawMessages.length > limit;
    const sliced = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor = hasMore && sliced.length > 0 ? sliced[sliced.length - 1].id : undefined;

    // Reverse to chronological order (oldest to newest)
    const chronological = [...sliced].reverse();

    const messages: DetailedMessage[] = chronological.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderProfileId: m.senderProfileId,
      content: m.content,
      status: m.status,
      deliveredAt: m.deliveredAt,
      readAt: m.readAt,
      createdAt: m.createdAt,
      isSender: m.senderProfileId === viewerProfileId,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        cloudinaryPublicId: a.cloudinaryPublicId,
        secureUrl: a.secureUrl,
        format: a.format,
        bytes: a.bytes,
        width: a.width,
        height: a.height,
      })),
    }));

    return {
      messages,
      hasMore,
      nextCursor,
    };
  },

  /**
   * Mark all unread messages in a conversation as READ for the viewing recipient.
   * Strictly idempotent and only updates other member's messages.
   */
  async markMessagesAsRead(viewerProfileId: string, conversationId: string) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    if (
      conversation.participant1Id !== viewerProfileId &&
      conversation.participant2Id !== viewerProfileId
    ) {
      throw new Error("Unauthorized.");
    }

    const result = await db.message.updateMany({
      where: {
        conversationId,
        senderProfileId: { not: viewerProfileId },
        status: { not: MessageStatus.READ },
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    return { markedCount: result.count };
  },

  /**
   * Soft-delete a message for the requesting user.
   */
  async deleteMessage(viewerProfileId: string, messageId: string) {
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new Error("Message not found.");
    }

    const { conversation } = message;
    if (
      conversation.participant1Id !== viewerProfileId &&
      conversation.participant2Id !== viewerProfileId
    ) {
      throw new Error("Unauthorized.");
    }

    const isSender = message.senderProfileId === viewerProfileId;

    if (isSender) {
      await db.message.update({
        where: { id: messageId },
        data: { isDeletedBySender: true },
      });
    } else {
      await db.message.update({
        where: { id: messageId },
        data: { isDeletedByRecipient: true },
      });
    }

    return { success: true };
  },

  /**
   * Get total unread message count across all conversations for header badge.
   */
  async getUnreadMessagesTotalCount(viewerProfileId: string): Promise<number> {
    return db.message.count({
      where: {
        conversation: {
          OR: [
            { participant1Id: viewerProfileId },
            { participant2Id: viewerProfileId },
          ],
        },
        senderProfileId: { not: viewerProfileId },
        status: { not: MessageStatus.READ },
        isDeletedByRecipient: false,
      },
    });
  },
};

