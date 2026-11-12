import "server-only";
import { db } from "@/server/db";
import {
  Prisma,
  AccountStatus,
  AppRole,
  OnboardingStatus,
  VerificationStatus,
  ReportStatus,
  SubscriptionStatus,
} from "@/generated/prisma";
import { auditService } from "./audit.service";
import { AuthorizationError, NotFoundError } from "@/server/utils/errors";

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: AppRole;
  status?: AccountStatus;
  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}

export const adminService = {
  /**
   * Fetch platform-wide statistics for the admin overview dashboard.
   * Uses efficient aggregate queries to minimize database roundtrips.
   */
  async getOverviewStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      completedProfiles,
      pendingVerifications,
      pendingReports,
      activeSubscriptions,
      recentUsersCount,
      recentAuditLogs,
      recentReports,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { accountStatus: AccountStatus.ACTIVE } }),
      db.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
      db.matrimonialProfile.count({
        where: { onboardingStatus: OnboardingStatus.COMPLETED },
      }),
      db.profileVerification.count({
        where: { status: VerificationStatus.PENDING },
      }),
      db.userReport.count({
        where: {
          status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
        },
      }),
      db.userSubscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: new Date() },
        },
      }),
      db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      db.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { name: true, email: true },
          },
        },
      }),
      db.userReport.findMany({
        take: 5,
        where: { status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] } },
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { fullName: true, slug: true } },
          reportedProfile: { select: { fullName: true, slug: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      completedProfiles,
      pendingVerifications,
      pendingReports,
      activeSubscriptions,
      newRegistrationsLast7Days: recentUsersCount,
      recentActivity: recentAuditLogs,
      recentReports,
    };
  },

  /**
   * List paginated users with role, profile status, and subscription information.
   */
  async listUsers(options: ListUsersOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (options.status) {
      where.accountStatus = options.status;
    }

    if (options.role) {
      where.roles = {
        some: { role: options.role },
      };
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }

    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          roles: { select: { role: true } },
          matrimonialProfile: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              onboardingStatus: true,
              completionPercentage: true,
              isVerified: true,
              moderationStatus: true,
            },
          },
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            take: 1,
            include: {
              plan: {
                select: { name: true, code: true },
              },
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        accountStatus: u.accountStatus,
        image: u.image,
        createdAt: u.createdAt,
        roles: u.roles.map((r) => r.role),
        profile: u.matrimonialProfile,
        activeSubscription: u.subscriptions[0]
          ? {
              planName: u.subscriptions[0].plan.name,
              planCode: u.subscriptions[0].plan.code,
              status: u.subscriptions[0].status,
              currentPeriodEnd: u.subscriptions[0].currentPeriodEnd,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Get comprehensive details for a single user for the admin review panel.
   */
  async getUserDetails(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        roles: { select: { role: true, createdAt: true } },
        matrimonialProfile: {
          include: {
            photos: true,
            verifications: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            plan: true,
            events: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        auditLogsCreated: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  },

  /**
   * Suspend, reactivate, or deactivate a user account with mandatory security rules.
   */
  async updateUserStatus(params: {
    actorUserId: string;
    actorRoles: AppRole[];
    targetUserId: string;
    status: AccountStatus;
    reason: string;
    context?: RequestContext;
  }) {
    const { actorUserId, actorRoles, targetUserId, status, reason, context } = params;

    // 1. Prevent accidental suspension of oneself
    if (actorUserId === targetUserId && status === AccountStatus.SUSPENDED) {
      throw new AuthorizationError("You cannot suspend your own administrative account");
    }

    // 2. Fetch target user and their roles
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: { roles: true },
    });

    if (!targetUser) {
      throw new NotFoundError("Target user not found");
    }

    const targetRoles = targetUser.roles.map((r) => r.role);

    // 3. Prevent modifying SUPER_ADMIN accounts unless actor is SUPER_ADMIN
    const isTargetSuperAdmin = targetRoles.includes(AppRole.SUPER_ADMIN);
    const isActorSuperAdmin = actorRoles.includes(AppRole.SUPER_ADMIN);

    if (isTargetSuperAdmin && !isActorSuperAdmin) {
      throw new AuthorizationError(
        "Only SUPER_ADMIN can modify the account status of another SUPER_ADMIN"
      );
    }

    const previousStatus = targetUser.accountStatus;

    // 4. Update status in database
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { accountStatus: status },
    });

    // 5. Append-only Audit Log
    await auditService.record({
      actorUserId,
      action: `USER_STATUS_${status}`,
      entityType: "USER",
      entityId: targetUserId,
      reason,
      metadata: {
        previousStatus,
        newStatus: status,
        targetEmail: targetUser.email,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updatedUser;
  },

  /**
   * Assign or revoke an application role with strict privilege-escalation prevention.
   */
  async updateUserRole(params: {
    actorUserId: string;
    actorRoles: AppRole[];
    targetUserId: string;
    role: AppRole;
    action: "ASSIGN" | "REVOKE";
    reason: string;
    context?: RequestContext;
  }) {
    const { actorUserId, actorRoles, targetUserId, role, action, reason, context } = params;

    // 1. Prevent users from modifying their own roles
    if (actorUserId === targetUserId) {
      throw new AuthorizationError("Users cannot alter their own administrative roles");
    }

    // 2. Only SUPER_ADMIN can assign or revoke SUPER_ADMIN, ADMIN, or MODERATOR roles
    const isPrivilegedRole = (
      [AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.MODERATOR] as AppRole[]
    ).includes(role);

    const isActorSuperAdmin = actorRoles.includes(AppRole.SUPER_ADMIN);

    if (isPrivilegedRole && !isActorSuperAdmin) {
      throw new AuthorizationError(
        `Only SUPER_ADMIN can assign or revoke privileged roles (${role})`
      );
    }

    // 3. ADMIN cannot promote themselves or anyone else to SUPER_ADMIN
    if (role === AppRole.SUPER_ADMIN && !isActorSuperAdmin) {
      throw new AuthorizationError("ADMINs cannot grant the SUPER_ADMIN role");
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: { roles: true },
    });

    if (!targetUser) {
      throw new NotFoundError("Target user not found");
    }

    if (action === "ASSIGN") {
      await db.userRole.upsert({
        where: {
          userId_role: {
            userId: targetUserId,
            role,
          },
        },
        create: {
          userId: targetUserId,
          role,
        },
        update: {},
      });
    } else {
      // REVOKE: prevent revoking the last role if they only have one
      if (targetUser.roles.length === 1 && targetUser.roles[0]?.role === role) {
        throw new AuthorizationError(
          "Cannot revoke the user's sole role. Assign an alternate role first."
        );
      }

      await db.userRole.deleteMany({
        where: {
          userId: targetUserId,
          role,
        },
      });
    }

    // 4. Record in Audit Log
    await auditService.record({
      actorUserId,
      action: `ROLE_${action}_${role}`,
      entityType: "USER_ROLE",
      entityId: targetUserId,
      reason,
      metadata: {
        role,
        action,
        targetEmail: targetUser.email,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { success: true, targetUserId, role, action };
  },
};

