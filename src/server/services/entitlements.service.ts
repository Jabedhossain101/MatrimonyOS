import "server-only";
import { db } from "@/server/db";
import { AppRole } from "@/lib/permissions";
import { SubscriptionStatus } from "@/generated/prisma";

export interface InterestQuota {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  canSend: boolean;
}

const DAILY_LIMITS: Record<AppRole, number> = {
  [AppRole.MEMBER]: 10,
  [AppRole.PREMIUM_MEMBER]: 50,
  [AppRole.FAMILY_MANAGER]: 25,
  [AppRole.MODERATOR]: 100,
  [AppRole.ADMIN]: 100,
  [AppRole.SUPER_ADMIN]: 200,
};

export const entitlementsService = {
  /**
   * Determine maximum daily interest allowance based on active DB subscription or user roles.
   */
  async resolveDailyInterestLimit(userId: string | undefined, roles: AppRole[]): Promise<number> {
    if (userId) {
      try {
        const activeSub = await db.userSubscription.findFirst({
          where: {
            userId,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gte: new Date() },
          },
          include: {
            plan: {
              include: { entitlements: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (activeSub) {
          const limitEntitlement = activeSub.plan.entitlements.find(
            (e) => e.key === "DAILY_INTEREST_LIMIT"
          );
          if (limitEntitlement) {
            const parsed = parseInt(limitEntitlement.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.error("[EntitlementsService] Failed to query subscription entitlements:", err);
      }
    }

    // Role-based fallback
    return this.getDailyInterestLimit(roles);
  },

  /**
   * Determine maximum daily interest allowance based on user roles.
   */
  getDailyInterestLimit(roles: AppRole[]): number {
    let maxLimit = DAILY_LIMITS[AppRole.MEMBER];

    for (const r of roles) {
      const limit = DAILY_LIMITS[r] ?? 10;
      if (limit > maxLimit) {
        maxLimit = limit;
      }
    }

    return maxLimit;
  },

  /**
   * Check remaining interest quota for today (UTC day boundary).
   */
  async getInterestQuota(
    profileId: string,
    roles: AppRole[],
    userId?: string
  ): Promise<InterestQuota> {
    const dailyLimit = await this.resolveDailyInterestLimit(userId, roles);

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const usedToday = await db.matrimonialInterest.count({
      where: {
        senderProfileId: profileId,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const remainingToday = Math.max(0, dailyLimit - usedToday);

    return {
      dailyLimit,
      usedToday,
      remainingToday,
      canSend: remainingToday > 0,
    };
  },
};

