import "server-only";
import { db } from "@/server/db";
import { ReportReason, ReportStatus } from "@/generated/prisma";

export interface ReportEntityInput {
  reporterProfileId: string;
  reportedProfileId: string;
  reportedMessageId?: string | null;
  reportedConversationId?: string | null;
  reason: ReportReason;
  description?: string | null;
}

export const safetyService = {
  /**
   * Block a profile. Prevents conversations, new messages, and mutual interaction.
   */
  async blockProfile(blockerProfileId: string, targetProfileId: string, reason?: string | null) {
    if (blockerProfileId === targetProfileId) {
      throw new Error("You cannot block yourself.");
    }

    const existingBlock = await db.userBlock.findUnique({
      where: {
        blockerProfileId_blockedProfileId: {
          blockerProfileId,
          blockedProfileId: targetProfileId,
        },
      },
    });

    if (existingBlock) {
      return existingBlock;
    }

    return db.userBlock.create({
      data: {
        blockerProfileId,
        blockedProfileId: targetProfileId,
        reason: reason?.trim() || null,
      },
    });
  },

  /**
   * Unblock a profile.
   */
  async unblockProfile(blockerProfileId: string, targetProfileId: string) {
    const existingBlock = await db.userBlock.findUnique({
      where: {
        blockerProfileId_blockedProfileId: {
          blockerProfileId,
          blockedProfileId: targetProfileId,
        },
      },
    });

    if (!existingBlock) {
      return { success: true };
    }

    await db.userBlock.delete({
      where: {
        id: existingBlock.id,
      },
    });

    return { success: true };
  },

  /**
   * Check if any block exists between two profiles (either direction).
   */
  async isBlocked(profileIdA: string, profileIdB: string): Promise<boolean> {
    const count = await db.userBlock.count({
      where: {
        OR: [
          { blockerProfileId: profileIdA, blockedProfileId: profileIdB },
          { blockerProfileId: profileIdB, blockedProfileId: profileIdA },
        ],
      },
    });

    return count > 0;
  },

  /**
   * Get all profile IDs that have blocked or are blocked by the given profile.
   */
  async getBlockedProfileIds(profileId: string): Promise<string[]> {
    const [blockedByMe, blockedMe] = await Promise.all([
      db.userBlock.findMany({
        where: { blockerProfileId: profileId },
        select: { blockedProfileId: true },
      }),
      db.userBlock.findMany({
        where: { blockedProfileId: profileId },
        select: { blockerProfileId: true },
      }),
    ]);

    const ids = new Set<string>();
    for (const b of blockedByMe) ids.add(b.blockedProfileId);
    for (const b of blockedMe) ids.add(b.blockerProfileId);
    return Array.from(ids);
  },

  /**
   * Submit a safety report against a member or message.
   * Reports are private and accessible strictly by moderation/admin staff.
   */
  async submitReport(input: ReportEntityInput) {
    if (input.reporterProfileId === input.reportedProfileId) {
      throw new Error("You cannot report yourself.");
    }

    // Verify reported profile exists
    const reportedProfile = await db.matrimonialProfile.findUnique({
      where: { id: input.reportedProfileId },
      select: { id: true },
    });

    if (!reportedProfile) {
      throw new Error("Reported member profile not found.");
    }

    return db.userReport.create({
      data: {
        reporterProfileId: input.reporterProfileId,
        reportedProfileId: input.reportedProfileId,
        reportedMessageId: input.reportedMessageId || null,
        reportedConversationId: input.reportedConversationId || null,
        reason: input.reason,
        description: input.description?.trim() || null,
        status: ReportStatus.PENDING,
      },
    });
  },

  /**
   * Get blocked profiles list for a user (for settings/safety screen).
   */
  async getBlockedUsersList(blockerProfileId: string) {
    return db.userBlock.findMany({
      where: { blockerProfileId },
      include: {
        blocked: {
          select: {
            id: true,
            fullName: true,
            slug: true,
            cityOfResidence: true,
            countryOfResidence: true,
            photos: {
              where: { moderationStatus: "APPROVED" },
              orderBy: { isPrimary: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};

