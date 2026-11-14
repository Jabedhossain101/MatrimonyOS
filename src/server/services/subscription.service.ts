import "server-only";
import { db } from "@/server/db";
import {
  Prisma,
  SubscriptionStatus,
  SubscriptionEventType,
  AppRole,
} from "@/generated/prisma";
import { auditService } from "./audit.service";
import { AuthorizationError, NotFoundError } from "@/server/utils/errors";
import type { RequestContext } from "./admin.service";
import type { PlanUpsertInput, ManualSubscriptionAdjustmentInput } from "@/lib/validations/admin";

export const DEFAULT_PLANS = [
  {
    name: "Free Member",
    code: "FREE",
    description: "Essential matrimonial profile and limited discovery to explore genuine matches.",
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    currency: "BDT",
    isActive: true,
    isPopular: false,
    displayOrder: 1,
    features: [
      "Standard Profile & 3 Photos",
      "10 Daily Interests",
      "Basic Search & Filters",
      "Receive & Accept Inbound Interests",
    ],
    entitlements: {
      DAILY_INTEREST_LIMIT: "10",
      DISCOVERY_ALLOWANCE: "50",
      ADVANCED_SEARCH_FILTERS: "false",
      CAN_SEND_ATTACHMENTS: "false",
      CAN_VIEW_CONTACT_DETAILS: "false",
      PROFILE_VISIBILITY: "STANDARD",
      PRIORITY_SUPPORT: "false",
    },
  },
  {
    name: "Premium Concierge",
    code: "PREMIUM",
    description: "Expanded connectivity, verified priority badge, and enhanced discovery tools.",
    priceMonthly: 2500.0,
    priceQuarterly: 6500.0,
    priceYearly: 22000.0,
    currency: "BDT",
    isActive: true,
    isPopular: true,
    displayOrder: 2,
    features: [
      "Verified Priority Profile Badge",
      "50 Daily Interests",
      "Direct Messaging & Photo Attachments",
      "Advanced Search Filters (City, Income, Family)",
      "Read Receipts & Activity Indicators",
    ],
    entitlements: {
      DAILY_INTEREST_LIMIT: "50",
      DISCOVERY_ALLOWANCE: "250",
      ADVANCED_SEARCH_FILTERS: "true",
      CAN_SEND_ATTACHMENTS: "true",
      CAN_VIEW_CONTACT_DETAILS: "true",
      PROFILE_VISIBILITY: "PRIORITY",
      PRIORITY_SUPPORT: "true",
    },
  },
  {
    name: "Elite Global Match",
    code: "ELITE",
    description: "Uncapped discovery, premier matchmaking visibility, and dedicated advisor review.",
    priceMonthly: 6500.0,
    priceQuarterly: 16500.0,
    priceYearly: 55000.0,
    currency: "BDT",
    isActive: true,
    isPopular: false,
    displayOrder: 3,
    features: [
      "All Premium Features Included",
      "100 Daily Interests Allowance",
      "Top-of-List Match Recommendations",
      "Dedicated Human Verification Support",
      "Confidential Private Browsing Mode",
    ],
    entitlements: {
      DAILY_INTEREST_LIMIT: "100",
      DISCOVERY_ALLOWANCE: "1000",
      ADVANCED_SEARCH_FILTERS: "true",
      CAN_SEND_ATTACHMENTS: "true",
      CAN_VIEW_CONTACT_DETAILS: "true",
      PROFILE_VISIBILITY: "CONFIDENTIAL_ELITE",
      PRIORITY_SUPPORT: "true",
      CONFIDENTIAL_BROWSING: "true",
    },
  },
];

export const subscriptionService = {
  /**
   * Seed standard plans if database table is currently unpopulated,
   * and migrate legacy USD default seed plans to BDT for bKash checkout.
   */
  async seedDefaultPlansIfEmpty() {
    const existingPlans = await db.subscriptionPlan.findMany();
    if (existingPlans.length === 0) {
      for (const plan of DEFAULT_PLANS) {
        await db.subscriptionPlan.create({
          data: {
            name: plan.name,
            code: plan.code,
            description: plan.description,
            priceMonthly: plan.priceMonthly,
            priceQuarterly: plan.priceQuarterly,
            priceYearly: plan.priceYearly,
            currency: plan.currency,
            isActive: plan.isActive,
            isPopular: plan.isPopular,
            displayOrder: plan.displayOrder,
            features: plan.features,
            entitlements: {
              create: Object.entries(plan.entitlements).map(([key, value]) => ({
                key,
                value,
              })),
            },
          },
        });
      }
      return;
    }

    // Migrate legacy USD default plans to BDT if present
    for (const existing of existingPlans) {
      if (existing.currency === "USD") {
        const template = DEFAULT_PLANS.find((p) => p.code === existing.code);
        if (template) {
          await db.subscriptionPlan.update({
            where: { id: existing.id },
            data: {
              currency: "BDT",
              priceMonthly: template.priceMonthly,
              priceQuarterly: template.priceQuarterly,
              priceYearly: template.priceYearly,
            },
          });
        }
      }
    }
  },

  /**
   * List all subscription plans with their entitlements.
   */
  async listPlans(options: { includeInactive?: boolean } = {}) {
    await this.seedDefaultPlansIfEmpty();

    const where = options.includeInactive ? {} : { isActive: true };

    return db.subscriptionPlan.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      include: {
        entitlements: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });
  },

  /**
   * Fetch a single plan by its unique code.
   */
  async getPlanByCode(code: string) {
    return db.subscriptionPlan.findUnique({
      where: { code },
      include: { entitlements: true },
    });
  },

  /**
   * Create or update a subscription plan with entitlements and auditing.
   */
  async upsertPlan(params: {
    actorUserId: string;
    input: PlanUpsertInput;
    context?: RequestContext;
  }) {
    const { actorUserId, input, context } = params;

    let plan;

    if (input.id) {
      // Update existing
      plan = await db.subscriptionPlan.findUnique({
        where: { id: input.id },
      });

      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      // If deactivating, check if active subscriptions exist
      if (plan.isActive && !input.isActive) {
        const activeSubCount = await db.userSubscription.count({
          where: {
            planId: input.id,
            status: SubscriptionStatus.ACTIVE,
          },
        });

        if (activeSubCount > 0) {
          throw new AuthorizationError(
            `Cannot deactivate plan: ${activeSubCount} active subscriptions currently rely on this tier.`
          );
        }
      }

      // Update plan and entitlements
      await db.$transaction(async (tx) => {
        await tx.subscriptionPlan.update({
          where: { id: input.id },
          data: {
            name: input.name,
            code: input.code,
            description: input.description ?? null,
            priceMonthly: input.priceMonthly,
            priceQuarterly: input.priceQuarterly ?? null,
            priceYearly: input.priceYearly ?? null,
            currency: input.currency,
            isActive: input.isActive,
            isPopular: input.isPopular,
            displayOrder: input.displayOrder,
            features: input.features,
          },
        });

        // Upsert entitlements
        if (input.entitlements) {
          for (const [key, value] of Object.entries(input.entitlements)) {
            await tx.planEntitlement.upsert({
              where: {
                planId_key: {
                  planId: input.id!,
                  key,
                },
              },
              create: {
                planId: input.id!,
                key,
                value,
              },
              update: {
                value,
              },
            });
          }
        }
      });
    } else {
      // Create new plan
      plan = await db.subscriptionPlan.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description ?? null,
          priceMonthly: input.priceMonthly,
          priceQuarterly: input.priceQuarterly ?? null,
          priceYearly: input.priceYearly ?? null,
          currency: input.currency,
          isActive: input.isActive,
          isPopular: input.isPopular,
          displayOrder: input.displayOrder,
          features: input.features,
          entitlements: {
            create: Object.entries(input.entitlements || {}).map(([key, value]) => ({
              key,
              value,
            })),
          },
        },
      });
    }

    await auditService.record({
      actorUserId,
      action: input.id ? "PLAN_UPDATE" : "PLAN_CREATE",
      entityType: "SUBSCRIPTION_PLAN",
      entityId: input.id || plan.id,
      metadata: { code: input.code, name: input.name },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return plan;
  },

  /**
   * List paginated user subscriptions for administrative review.
   */
  async listSubscriptions(options: {
    page?: number;
    limit?: number;
    status?: SubscriptionStatus;
    planId?: string;
    search?: string;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserSubscriptionWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.planId) {
      where.planId = options.planId;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.user = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      db.userSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              matrimonialProfile: { select: { slug: true, fullName: true } },
            },
          },
          plan: { select: { id: true, name: true, code: true, currency: true, priceMonthly: true } },
          events: {
            take: 3,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      db.userSubscription.count({ where }),
    ]);

    return {
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Retrieve active subscription and resolved entitlements for a specific user.
   */
  async getUserActiveSubscription(userId: string) {
    const sub = await db.userSubscription.findFirst({
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

    if (!sub) {
      // Default to FREE plan
      const freePlan = await this.getPlanByCode("FREE");
      return {
        hasActiveSubscription: false,
        subscription: null,
        plan: freePlan,
        entitlements: (freePlan?.entitlements || []).reduce(
          (acc, e) => ({ ...acc, [e.key]: e.value }),
          {} as Record<string, string>
        ),
      };
    }

    const entitlements = sub.plan.entitlements.reduce(
      (acc, e) => ({ ...acc, [e.key]: e.value }),
      {} as Record<string, string>
    );

    return {
      hasActiveSubscription: true,
      subscription: sub,
      plan: sub.plan,
      entitlements,
    };
  },

  /**
   * Manual administrative subscription grant, extension, or tier override.
   */
  async manualAdjustSubscription(params: {
    actorUserId: string;
    input: ManualSubscriptionAdjustmentInput;
    context?: RequestContext;
  }) {
    const { actorUserId, input, context } = params;

    const [user, plan] = await Promise.all([
      db.user.findUnique({ where: { id: input.userId } }),
      db.subscriptionPlan.findUnique({ where: { id: input.planId } }),
    ]);

    if (!user) throw new NotFoundError("Target user not found");
    if (!plan) throw new NotFoundError("Target plan not found");

    const now = new Date();
    const periodEnd = new Date(now.getTime() + input.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await db.userSubscription.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        status: input.status,
        billingCycle: input.billingCycle,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentProvider: "ADMIN_OVERRIDE",
        notes: input.reason,
        events: {
          create: {
            eventType: SubscriptionEventType.ADMIN_OVERRIDE,
            fromStatus: null,
            toStatus: input.status,
            actorUserId,
            reason: input.reason,
            metadata: {
              durationDays: input.durationDays,
              planCode: plan.code,
            },
          },
        },
      },
      include: { plan: true },
    });

    // If upgraded to paid tier, grant PREMIUM_MEMBER role if missing
    if (["PREMIUM", "ELITE"].includes(plan.code)) {
      await db.userRole.upsert({
        where: {
          userId_role: {
            userId: input.userId,
            role: AppRole.PREMIUM_MEMBER,
          },
        },
        create: {
          userId: input.userId,
          role: AppRole.PREMIUM_MEMBER,
        },
        update: {},
      });
    }

    await auditService.record({
      actorUserId,
      action: "SUBSCRIPTION_ADMIN_OVERRIDE",
      entityType: "USER_SUBSCRIPTION",
      entityId: subscription.id,
      reason: input.reason,
      metadata: {
        targetUserId: input.userId,
        targetEmail: user.email,
        planCode: plan.code,
        durationDays: input.durationDays,
        periodEnd: periodEnd.toISOString(),
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return subscription;
  },
};

