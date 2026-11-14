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

export interface ResolvedEntitlements {
  tierCode: string;
  hasActivePaidSubscription: boolean;
  dailyInterestLimit: number;
  discoveryAllowance: number;
  advancedFilters: boolean;
  canSendAttachments: boolean;
  canViewContactDetails: boolean;
  prioritySupport: boolean;
  confidentialBrowsing: boolean;
  profileVisibility: string;
  rawMap: Record<string, string>;
}

const DAILY_LIMITS: Record<AppRole, number> = {
  [AppRole.MEMBER]: 10,
  [AppRole.PREMIUM_MEMBER]: 50,
  [AppRole.FAMILY_MANAGER]: 25,
  [AppRole.MODERATOR]: 100,
  [AppRole.ADMIN]: 100,
  [AppRole.SUPER_ADMIN]: 200,
};

const FREE_DEFAULT_ENTITLEMENTS: ResolvedEntitlements = {
  tierCode: "FREE",
  hasActivePaidSubscription: false,
  dailyInterestLimit: 10,
  discoveryAllowance: 50,
  advancedFilters: false,
  canSendAttachments: false,
  canViewContactDetails: false,
  prioritySupport: false,
  confidentialBrowsing: false,
  profileVisibility: "STANDARD",
  rawMap: {
    DAILY_INTEREST_LIMIT: "10",
    DISCOVERY_ALLOWANCE: "50",
    ADVANCED_SEARCH_FILTERS: "false",
    CAN_SEND_ATTACHMENTS: "false",
    CAN_VIEW_CONTACT_DETAILS: "false",
    PRIORITY_SUPPORT: "false",
    CONFIDENTIAL_BROWSING: "false",
    PROFILE_VISIBILITY: "STANDARD",
  },
};

function readBoolEntitlement(
  map: Record<string, string>,
  keys: string[]
): boolean {
  for (const k of keys) {
    const val = map[k] ?? map[k.toUpperCase()] ?? map[k.toLowerCase()];
    if (val !== undefined) {
      return val.toLowerCase() === "true" || val === "1";
    }
  }
  return false;
}

function readIntEntitlement(
  map: Record<string, string>,
  keys: string[],
  fallback: number
): number {
  for (const k of keys) {
    const val = map[k] ?? map[k.toUpperCase()] ?? map[k.toLowerCase()];
    if (val !== undefined) {
      const parsed = parseInt(val, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  }
  return fallback;
}

export const entitlementsService = {
  /**
   * Resolves the authoritative server-side entitlements for a user based on their
   * active, non-expired UserSubscription in the database.
   *
   * Rules enforced:
   * - FREE users retain FREE plan entitlements.
   * - PREMIUM / ELITE users receive paid entitlements ONLY after a verified active subscription.
   * - Expired or canceled subscriptions immediately lose paid entitlements once `currentPeriodEnd` has passed.
   * - Family Manager permissions never bypass profile privacy or member consent.
   */
  async resolveUserEntitlements(
    userId: string | undefined,
    roles: AppRole[] = [AppRole.MEMBER]
  ): Promise<ResolvedEntitlements> {
    if (userId) {
      try {
        const now = new Date();
        const activeSub = await db.userSubscription.findFirst({
          where: {
            userId,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gte: now },
          },
          include: {
            plan: {
              include: { entitlements: true },
            },
          },
          orderBy: { currentPeriodEnd: "desc" },
        });

        if (activeSub && activeSub.plan) {
          const rawMap: Record<string, string> = {};
          for (const ent of activeSub.plan.entitlements) {
            rawMap[ent.key] = ent.value;
          }

          const isPaid = activeSub.plan.code !== "FREE";
          const dailyInterestLimit = readIntEntitlement(
            rawMap,
            ["DAILY_INTEREST_LIMIT", "daily_interest_limit"],
            isPaid ? 50 : 10
          );
          const discoveryAllowance = readIntEntitlement(
            rawMap,
            ["DISCOVERY_ALLOWANCE", "discovery_allowance"],
            isPaid ? 250 : 50
          );

          return {
            tierCode: activeSub.plan.code,
            hasActivePaidSubscription: isPaid,
            dailyInterestLimit,
            discoveryAllowance,
            advancedFilters: readBoolEntitlement(rawMap, [
              "ADVANCED_SEARCH_FILTERS",
              "advanced_filters",
            ]),
            canSendAttachments: readBoolEntitlement(rawMap, [
              "CAN_SEND_ATTACHMENTS",
              "can_send_attachments",
            ]),
            canViewContactDetails: readBoolEntitlement(rawMap, [
              "CAN_VIEW_CONTACT_DETAILS",
              "can_view_contact_details",
            ]),
            prioritySupport: readBoolEntitlement(rawMap, [
              "PRIORITY_SUPPORT",
              "priority_support",
            ]),
            confidentialBrowsing: readBoolEntitlement(rawMap, [
              "CONFIDENTIAL_BROWSING",
              "confidential_browsing",
            ]),
            profileVisibility:
              rawMap.PROFILE_VISIBILITY ??
              rawMap.profile_visibility ??
              (isPaid ? "PRIORITY" : "STANDARD"),
            rawMap,
          };
        }
      } catch (err) {
        console.error(
          "[EntitlementsService] Error querying user subscription entitlements:",
          err
        );
      }
    }

    // Fallback to role-based limit for daily interest while keeping paid flags false unless admin
    const isAdminOrMod = roles.some((r) =>
      ([AppRole.MODERATOR, AppRole.ADMIN, AppRole.SUPER_ADMIN] as AppRole[]).includes(r)
    );

    return {
      ...FREE_DEFAULT_ENTITLEMENTS,
      dailyInterestLimit: this.getDailyInterestLimit(roles),
      advancedFilters: isAdminOrMod,
      prioritySupport: isAdminOrMod,
    };
  },

  /**
   * Determine maximum daily interest allowance based on active DB subscription or user roles.
   */
  async resolveDailyInterestLimit(
    userId: string | undefined,
    roles: AppRole[]
  ): Promise<number> {
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
            (e) =>
              e.key === "DAILY_INTEREST_LIMIT" ||
              e.key === "daily_interest_limit"
          );
          if (limitEntitlement) {
            const parsed = parseInt(limitEntitlement.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.error(
          "[EntitlementsService] Failed to query subscription entitlements:",
          err
        );
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
