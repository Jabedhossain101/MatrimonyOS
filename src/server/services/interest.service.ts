import "server-only";
import { db } from "@/server/db";
import { InterestStatus, NotificationType, type AppRole } from "@/generated/prisma";
import { entitlementsService } from "./entitlements.service";
import { notificationService } from "./notification.service";
import { redactProfileForViewer, type RedactedPublicProfile } from "@/server/utils/privacy";

export interface InterestItem {
  id: string;
  status: InterestStatus;
  message?: string | null;
  createdAt: Date;
  respondedAt?: Date | null;
  otherProfile: RedactedPublicProfile;
  isSender: boolean;
}

export interface MatchItem {
  id: string;
  matchedAt: Date;
  otherProfile: RedactedPublicProfile;
}

export const interestService = {
  /**
   * Send a matrimonial interest to a target profile.
   */
  async sendInterest(
    currentUserId: string,
    senderProfileId: string,
    recipientProfileId: string,
    message?: string | null,
    userRoles: AppRole[] = []
  ): Promise<{ success: boolean; interestId: string; isMutualMatch: boolean }> {
    if (senderProfileId === recipientProfileId) {
      throw new Error("You cannot send a matrimonial interest to yourself.");
    }

    // 1. Check daily interest quota
    const quota = await entitlementsService.getInterestQuota(
      senderProfileId,
      userRoles
    );
    if (!quota.canSend) {
      throw new Error(
        `Daily interest limit reached (${quota.dailyLimit}/day). Upgrade or try again tomorrow.`
      );
    }

    // 2. Validate recipient profile
    const recipient = await db.matrimonialProfile.findUnique({
      where: { id: recipientProfileId },
      include: {
        user: { select: { accountStatus: true } },
        privacySettings: true,
      },
    });

    if (!recipient || recipient.user.accountStatus !== "ACTIVE") {
      throw new Error("Target profile is currently unavailable.");
    }

    if (recipient.privacySettings?.profileVisibility === "PRIVATE") {
      throw new Error("Cannot send interest to a private profile.");
    }

    // 3. Check existing interest sent in this direction
    const existingSent = await db.matrimonialInterest.findUnique({
      where: {
        senderProfileId_recipientProfileId: {
          senderProfileId,
          recipientProfileId,
        },
      },
    });

    if (existingSent) {
      if (existingSent.status === InterestStatus.PENDING) {
        throw new Error("You already have a pending interest with this member.");
      }
      if (existingSent.status === InterestStatus.ACCEPTED) {
        throw new Error("You are already connected with this member.");
      }
      // If WITHDRAWN or DECLINED, update back to PENDING with fresh timestamp
      const updated = await db.matrimonialInterest.update({
        where: { id: existingSent.id },
        data: {
          status: InterestStatus.PENDING,
          message: message?.trim() || null,
          respondedAt: null,
          createdAt: new Date(),
        },
      });
      return { success: true, interestId: updated.id, isMutualMatch: false };
    }

    // 4. Check if recipient already sent an interest to us (reciprocal interest)!
    const reverseInterest = await db.matrimonialInterest.findUnique({
      where: {
        senderProfileId_recipientProfileId: {
          senderProfileId: recipientProfileId,
          recipientProfileId: senderProfileId,
        },
      },
    });

    // If reverse interest is already PENDING, sending an interest acts as automatic mutual acceptance!
    if (reverseInterest && reverseInterest.status === InterestStatus.PENDING) {
      const matchResult = await db.$transaction(async (tx) => {
        // Accept reverse interest
        await tx.matrimonialInterest.update({
          where: { id: reverseInterest.id },
          data: {
            status: InterestStatus.ACCEPTED,
            respondedAt: new Date(),
          },
        });

        // Create our own interest as accepted
        const myInterest = await tx.matrimonialInterest.create({
          data: {
            senderProfileId,
            recipientProfileId,
            status: InterestStatus.ACCEPTED,
            message: message?.trim() || null,
            respondedAt: new Date(),
          },
        });

        // Create mutual match safely with deterministic ordering
        const [p1, p2] =
          senderProfileId < recipientProfileId
            ? [senderProfileId, recipientProfileId]
            : [recipientProfileId, senderProfileId];

        await tx.mutualMatch.upsert({
          where: {
            profile1Id_profile2Id: {
              profile1Id: p1,
              profile2Id: p2,
            },
          },
          update: {
            interestId: myInterest.id,
            matchedAt: new Date(),
          },
          create: {
            profile1Id: p1,
            profile2Id: p2,
            interestId: myInterest.id,
          },
        });

        return myInterest.id;
      });

      // Dispatch mutual match notifications to both parties
      await Promise.allSettled([
        notificationService.createNotification({
          recipientProfileId,
          senderProfileId,
          type: NotificationType.MUTUAL_MATCH_CREATED,
          title: "New Mutual Match!",
          body: "You and a member have mutually connected. Direct messaging is now unlocked.",
          link: "/dashboard/matches",
          entityId: matchResult,
        }),
        notificationService.createNotification({
          recipientProfileId: senderProfileId,
          senderProfileId: recipientProfileId,
          type: NotificationType.MUTUAL_MATCH_CREATED,
          title: "New Mutual Match!",
          body: "You and a member have mutually connected. Direct messaging is now unlocked.",
          link: "/dashboard/matches",
          entityId: matchResult,
        }),
      ]);

      return { success: true, interestId: matchResult, isMutualMatch: true };
    }

    // 5. Standard create interest
    const interest = await db.matrimonialInterest.create({
      data: {
        senderProfileId,
        recipientProfileId,
        status: InterestStatus.PENDING,
        message: message?.trim() || null,
      },
    });

    // Dispatch interest received notification to recipient
    await notificationService.createNotification({
      recipientProfileId,
      senderProfileId,
      type: NotificationType.INTEREST_RECEIVED,
      title: "New Interest Received",
      body: "A member has expressed matrimonial interest in your profile.",
      link: "/dashboard/interests",
      entityId: interest.id,
    });

    return { success: true, interestId: interest.id, isMutualMatch: false };
  },

  /**
   * Respond to a received interest (ACCEPT or DECLINE).
   */
  async respondToInterest(
    currentProfileId: string,
    interestId: string,
    action: "ACCEPT" | "DECLINE"
  ): Promise<{ success: boolean; isMutualMatch: boolean }> {
    const interest = await db.matrimonialInterest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new Error("Interest record not found.");
    }

    if (interest.recipientProfileId !== currentProfileId) {
      throw new Error("You are not authorized to respond to this interest.");
    }

    if (interest.status !== InterestStatus.PENDING) {
      throw new Error(
        `This interest is already ${interest.status.toLowerCase()}.`
      );
    }

    if (action === "DECLINE") {
      await db.matrimonialInterest.update({
        where: { id: interestId },
        data: {
          status: InterestStatus.DECLINED,
          respondedAt: new Date(),
        },
      });

      await notificationService.createNotification({
        recipientProfileId: interest.senderProfileId,
        senderProfileId: currentProfileId,
        type: NotificationType.INTEREST_DECLINED,
        title: "Interest Update",
        body: "A member has respectfully declined your matrimonial interest.",
        link: "/dashboard/interests",
        entityId: interest.id,
      });

      return { success: true, isMutualMatch: false };
    }

    // Action === "ACCEPT"
    await db.$transaction(async (tx) => {
      await tx.matrimonialInterest.update({
        where: { id: interestId },
        data: {
          status: InterestStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      // Canonical ordering to enforce unique compound key
      const [p1, p2] =
        interest.senderProfileId < interest.recipientProfileId
          ? [interest.senderProfileId, interest.recipientProfileId]
          : [interest.recipientProfileId, interest.senderProfileId];

      await tx.mutualMatch.upsert({
        where: {
          profile1Id_profile2Id: {
            profile1Id: p1,
            profile2Id: p2,
          },
        },
        update: {
          interestId: interest.id,
          matchedAt: new Date(),
        },
        create: {
          profile1Id: p1,
          profile2Id: p2,
          interestId: interest.id,
        },
      });
    });

    // Notify original sender of acceptance & mutual match
    await Promise.allSettled([
      notificationService.createNotification({
        recipientProfileId: interest.senderProfileId,
        senderProfileId: currentProfileId,
        type: NotificationType.INTEREST_ACCEPTED,
        title: "Interest Accepted!",
        body: "Your matrimonial interest was accepted. You now have a mutual connection!",
        link: "/dashboard/matches",
        entityId: interest.id,
      }),
      notificationService.createNotification({
        recipientProfileId: interest.senderProfileId,
        senderProfileId: currentProfileId,
        type: NotificationType.MUTUAL_MATCH_CREATED,
        title: "Mutual Match Confirmed!",
        body: "Direct messaging is now unlocked.",
        link: "/dashboard/matches",
        entityId: interest.id,
      }),
      notificationService.createNotification({
        recipientProfileId: currentProfileId,
        senderProfileId: interest.senderProfileId,
        type: NotificationType.MUTUAL_MATCH_CREATED,
        title: "Mutual Match Confirmed!",
        body: "Direct messaging is now unlocked.",
        link: "/dashboard/matches",
        entityId: interest.id,
      }),
    ]);

    return { success: true, isMutualMatch: true };
  },

  /**
   * Withdraw a pending interest sent by current member.
   */
  async withdrawInterest(
    currentProfileId: string,
    interestId: string
  ): Promise<boolean> {
    const interest = await db.matrimonialInterest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new Error("Interest record not found.");
    }

    if (interest.senderProfileId !== currentProfileId) {
      throw new Error("You are not authorized to withdraw this interest.");
    }

    if (interest.status !== InterestStatus.PENDING) {
      throw new Error("Only pending interests can be withdrawn.");
    }

    await db.matrimonialInterest.update({
      where: { id: interestId },
      data: {
        status: InterestStatus.WITHDRAWN,
      },
    });

    return true;
  },

  /**
   * Retrieve sent and received interests status map for discovery cards.
   * Returns a map of targetProfileId -> { status: InterestStatus, isSender: boolean, interestId: string }
   */
  async getInterestsMap(
    currentProfileId: string
  ): Promise<
    Record<
      string,
      { status: InterestStatus; isSender: boolean; interestId: string }
    >
  > {
    const [sent, received] = await Promise.all([
      db.matrimonialInterest.findMany({
        where: { senderProfileId: currentProfileId },
        select: { id: true, recipientProfileId: true, status: true },
      }),
      db.matrimonialInterest.findMany({
        where: { recipientProfileId: currentProfileId },
        select: { id: true, senderProfileId: true, status: true },
      }),
    ]);

    const map: Record<
      string,
      { status: InterestStatus; isSender: boolean; interestId: string }
    > = {};

    for (const s of sent) {
      map[s.recipientProfileId] = {
        status: s.status,
        isSender: true,
        interestId: s.id,
      };
    }

    for (const r of received) {
      // If we also sent an interest, prefer accepted status or existing
      if (!map[r.senderProfileId] || map[r.senderProfileId].status !== InterestStatus.ACCEPTED) {
        map[r.senderProfileId] = {
          status: r.status,
          isSender: false,
          interestId: r.id,
        };
      }
    }

    return map;
  },

  /**
   * List paginated received interests.
   */
  async getReceivedInterests(
    currentUserId: string,
    currentProfileId: string,
    options: { status?: InterestStatus; page?: number; limit?: number } = {}
  ): Promise<{ items: InterestItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    const where = {
      recipientProfileId: currentProfileId,
      ...(options.status ? { status: options.status } : {}),
    };

    const [total, records] = await Promise.all([
      db.matrimonialInterest.count({ where }),
      db.matrimonialInterest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          senderProfile: {
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

    const items: InterestItem[] = [];

    for (const record of records) {
      const redacted = redactProfileForViewer(
        record.senderProfile,
        currentUserId,
        true
      );
      if (redacted) {
        items.push({
          id: record.id,
          status: record.status,
          message: record.message,
          createdAt: record.createdAt,
          respondedAt: record.respondedAt,
          otherProfile: redacted,
          isSender: false,
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

  /**
   * List paginated sent interests.
   */
  async getSentInterests(
    currentUserId: string,
    currentProfileId: string,
    options: { status?: InterestStatus; page?: number; limit?: number } = {}
  ): Promise<{ items: InterestItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    const where = {
      senderProfileId: currentProfileId,
      ...(options.status ? { status: options.status } : {}),
    };

    const [total, records] = await Promise.all([
      db.matrimonialInterest.count({ where }),
      db.matrimonialInterest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          recipientProfile: {
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

    const items: InterestItem[] = [];

    for (const record of records) {
      const redacted = redactProfileForViewer(
        record.recipientProfile,
        currentUserId,
        true
      );
      if (redacted) {
        items.push({
          id: record.id,
          status: record.status,
          message: record.message,
          createdAt: record.createdAt,
          respondedAt: record.respondedAt,
          otherProfile: redacted,
          isSender: true,
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

  /**
   * List paginated mutual matches for the member.
   */
  async getMutualMatches(
    currentUserId: string,
    currentProfileId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ items: MatchItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { profile1Id: currentProfileId },
        { profile2Id: currentProfileId },
      ],
    };

    const [total, records] = await Promise.all([
      db.mutualMatch.count({ where }),
      db.mutualMatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { matchedAt: "desc" },
        include: {
          profile1: {
            include: {
              educations: { orderBy: { graduationYear: "desc" } },
              photos: { orderBy: { orderIndex: "asc" } },
              partnerPreference: true,
              privacySettings: true,
              user: { select: { name: true, email: true } },
            },
          },
          profile2: {
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

    const items: MatchItem[] = [];

    for (const match of records) {
      const otherProfileRaw =
        match.profile1Id === currentProfileId ? match.profile2 : match.profile1;

      const redacted = redactProfileForViewer(
        otherProfileRaw,
        currentUserId,
        true
      );

      if (redacted) {
        items.push({
          id: match.id,
          matchedAt: match.matchedAt,
          otherProfile: redacted,
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

