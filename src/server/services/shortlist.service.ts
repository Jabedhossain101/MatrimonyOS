import "server-only";
import { db } from "@/server/db";
import { redactProfileForViewer, type RedactedPublicProfile } from "@/server/utils/privacy";

export interface ShortlistedProfileItem {
  shortlistId: string;
  shortlistedAt: Date;
  profile: RedactedPublicProfile;
}

export const shortlistService = {
  /**
   * Toggle shortlist status for a target profile.
   * Returns true if newly added, false if removed.
   */
  async toggleShortlist(
    userId: string,
    currentProfileId: string,
    targetProfileId: string
  ): Promise<{ isShortlisted: boolean; targetProfileId: string }> {
    if (currentProfileId === targetProfileId) {
      throw new Error("You cannot add your own profile to your shortlist.");
    }

    // Verify target profile exists and is not private or deleted
    const target = await db.matrimonialProfile.findUnique({
      where: { id: targetProfileId },
      include: {
        user: { select: { accountStatus: true } },
        privacySettings: true,
      },
    });

    if (!target || target.user.accountStatus !== "ACTIVE") {
      throw new Error("Target profile is unavailable or inactive.");
    }

    if (target.privacySettings?.profileVisibility === "PRIVATE") {
      throw new Error("This profile is private and cannot be shortlisted.");
    }

    const existing = await db.profileShortlist.findUnique({
      where: {
        profileId_targetProfileId: {
          profileId: currentProfileId,
          targetProfileId,
        },
      },
    });

    if (existing) {
      await db.profileShortlist.delete({
        where: { id: existing.id },
      });
      return { isShortlisted: false, targetProfileId };
    }

    await db.profileShortlist.create({
      data: {
        userId,
        profileId: currentProfileId,
        targetProfileId,
      },
    });

    return { isShortlisted: true, targetProfileId };
  },

  /**
   * Get an array of target profile IDs shortlisted by this profile.
   */
  async getShortlistedProfileIds(profileId: string): Promise<Set<string>> {
    const list = await db.profileShortlist.findMany({
      where: { profileId },
      select: { targetProfileId: true },
    });

    return new Set(list.map((s) => s.targetProfileId));
  },

  /**
   * List paginated shortlisted profiles for member.
   */
  async getMemberShortlist(
    currentUserId: string,
    currentProfileId: string,
    options: { page?: number; limit?: number; query?: string } = {}
  ): Promise<{
    items: ShortlistedProfileItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    const whereClause: {
      profileId: string;
      targetProfile?: {
        user?: { accountStatus: "ACTIVE" };
        privacySettings?: { profileVisibility: { not: "PRIVATE" } };
        fullName?: { contains: string; mode: "insensitive" };
      };
    } = {
      profileId: currentProfileId,
      targetProfile: {
        user: { accountStatus: "ACTIVE" },
        privacySettings: { profileVisibility: { not: "PRIVATE" } },
      },
    };

    if (options.query && options.query.trim()) {
      whereClause.targetProfile = {
        ...whereClause.targetProfile,
        fullName: { contains: options.query.trim(), mode: "insensitive" },
      };
    }

    const [total, records] = await Promise.all([
      db.profileShortlist.count({ where: whereClause }),
      db.profileShortlist.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          targetProfile: {
            include: {
              educations: { orderBy: { graduationYear: "desc" } },
              photos: { orderBy: { orderIndex: "asc" } },
              partnerPreference: true,
              privacySettings: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
    ]);

    const items: ShortlistedProfileItem[] = [];

    for (const record of records) {
      const redacted = redactProfileForViewer(
        record.targetProfile,
        currentUserId,
        true
      );
      if (redacted && redacted.viewerCanAccess) {
        items.push({
          shortlistId: record.id,
          shortlistedAt: record.createdAt,
          profile: redacted,
        });
      }
    }

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
};
