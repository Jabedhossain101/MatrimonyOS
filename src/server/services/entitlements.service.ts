import "server-only";
import { db } from "@/server/db";
import { AppRole } from "@/lib/permissions";

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
    roles: AppRole[]
  ): Promise<InterestQuota> {
    const dailyLimit = this.getDailyInterestLimit(roles);

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

