import { describe, it, expect } from "vitest";
import {
  AppRole,
  PERMISSIONS,
  hasPermission,
} from "@/lib/permissions";
import {
  userStatusUpdateSchema,
  userRoleUpdateSchema,
  profileModerationSchema,
  verificationReviewSchema,
  planUpsertSchema,
  manualSubscriptionAdjustmentSchema,
} from "@/lib/validations/admin";

describe("Phase 7 — Admin RBAC & Validation Suite", () => {
  describe("Role Boundary Enforcements", () => {
    it("strictly blocks MEMBER, PREMIUM_MEMBER, and FAMILY_MANAGER from ADMIN_ACCESS", () => {
      const nonAdminRoles: AppRole[] = [
        AppRole.MEMBER,
        AppRole.PREMIUM_MEMBER,
        AppRole.FAMILY_MANAGER,
      ];

      for (const role of nonAdminRoles) {
        expect(hasPermission([role], PERMISSIONS.ADMIN_ACCESS)).toBe(false);
        expect(hasPermission([role], PERMISSIONS.USER_SUSPEND)).toBe(false);
        expect(hasPermission([role], PERMISSIONS.REPORT_RESOLVE)).toBe(false);
        expect(hasPermission([role], PERMISSIONS.SUBSCRIPTION_MANAGE)).toBe(false);
        expect(hasPermission([role], PERMISSIONS.PLATFORM_CONFIGURE)).toBe(false);
      }
    });

    it("restricts MODERATOR to editorial, safety, and verification queues only", () => {
      const moderatorRoles = [AppRole.MODERATOR];

      // Permitted capabilities
      expect(hasPermission(moderatorRoles, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.REPORT_READ)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.REPORT_RESOLVE)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.PROFILE_READ)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.PROFILE_VERIFY)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.VERIFICATION_REVIEW)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.USER_READ)).toBe(true);

      // Strictly denied administrative capabilities
      expect(hasPermission(moderatorRoles, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(false);
      expect(hasPermission(moderatorRoles, PERMISSIONS.SUBSCRIPTION_MANAGE)).toBe(false);
      expect(hasPermission(moderatorRoles, PERMISSIONS.PLAN_MANAGE)).toBe(false);
      expect(hasPermission(moderatorRoles, PERMISSIONS.AUDIT_LOG_VIEW)).toBe(false);
      expect(hasPermission(moderatorRoles, PERMISSIONS.ROLE_ASSIGN)).toBe(false);
      expect(hasPermission(moderatorRoles, PERMISSIONS.PLATFORM_CONFIGURE)).toBe(false);
    });

    it("permits ADMIN to manage users, reports, verifications, and subscriptions, but denies system config and role grants", () => {
      const adminRoles = [AppRole.ADMIN];

      // Permitted admin capabilities
      expect(hasPermission(adminRoles, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.USER_MANAGE)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.USER_SUSPEND)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.SUBSCRIPTION_MANAGE)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.PLAN_MANAGE)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.AUDIT_LOG_VIEW)).toBe(true);

      // Strictly denied to standard ADMIN
      expect(hasPermission(adminRoles, PERMISSIONS.ROLE_ASSIGN)).toBe(false);
      expect(hasPermission(adminRoles, PERMISSIONS.PLATFORM_CONFIGURE)).toBe(false);
    });

    it("grants full system administration and platform configuration exclusively to SUPER_ADMIN", () => {
      const superAdminRoles = [AppRole.SUPER_ADMIN];

      expect(hasPermission(superAdminRoles, PERMISSIONS.ROLE_ASSIGN)).toBe(true);
      expect(hasPermission(superAdminRoles, PERMISSIONS.PLATFORM_CONFIGURE)).toBe(true);
      expect(hasPermission(superAdminRoles, PERMISSIONS.ADMIN_MANAGE)).toBe(true);

      for (const permission of Object.values(PERMISSIONS)) {
        expect(hasPermission(superAdminRoles, permission)).toBe(true);
      }
    });
  });

  describe("Administrative Input Validations", () => {
    describe("userStatusUpdateSchema", () => {
      it("accepts valid status update with reason >= 5 chars", () => {
        const parsed = userStatusUpdateSchema.parse({
          userId: "usr_123",
          status: "SUSPENDED",
          reason: "Repeated spam and guideline violation",
        });
        expect(parsed.status).toBe("SUSPENDED");
      });

      it("rejects status update with reason < 5 chars", () => {
        const res = userStatusUpdateSchema.safeParse({
          userId: "usr_123",
          status: "SUSPENDED",
          reason: "spam",
        });
        expect(res.success).toBe(false);
      });
    });

    describe("userRoleUpdateSchema", () => {
      it("validates role assignment and revocation with audit reason", () => {
        const parsed = userRoleUpdateSchema.parse({
          userId: "usr_123",
          role: AppRole.PREMIUM_MEMBER,
          action: "ASSIGN",
          reason: "Promotional lifetime VIP membership upgrade",
        });
        expect(parsed.role).toBe(AppRole.PREMIUM_MEMBER);
      });

      it("rejects invalid role strings", () => {
        const res = userRoleUpdateSchema.safeParse({
          userId: "usr_123",
          role: "BOGUS_ROLE",
          action: "ASSIGN",
          reason: "Testing invalid role",
        });
        expect(res.success).toBe(false);
      });
    });

    describe("profileModerationSchema", () => {
      it("allows approval without reason", () => {
        const parsed = profileModerationSchema.parse({
          profileId: "prof_123",
          action: "APPROVE",
        });
        expect(parsed.action).toBe("APPROVE");
      });

      it("requires a reason when rejecting a profile", () => {
        const res = profileModerationSchema.safeParse({
          profileId: "prof_123",
          action: "REJECT",
          reason: "",
        });
        expect(res.success).toBe(false);
      });

      it("accepts rejection when reason is at least 5 chars", () => {
        const parsed = profileModerationSchema.parse({
          profileId: "prof_123",
          action: "REJECT",
          reason: "Inappropriate language in about me section",
        });
        expect(parsed.action).toBe("REJECT");
      });
    });

    describe("verificationReviewSchema", () => {
      it("requires rejection reason when rejecting verification", () => {
        const res = verificationReviewSchema.safeParse({
          verificationId: "ver_123",
          action: "REJECT",
          rejectionReason: "bad",
        });
        expect(res.success).toBe(false);
      });

      it("accepts approval without rejection reason", () => {
        const parsed = verificationReviewSchema.parse({
          verificationId: "ver_123",
          action: "APPROVE",
          notes: "Official passport matched profile date of birth",
        });
        expect(parsed.action).toBe("APPROVE");
      });
    });

    describe("planUpsertSchema", () => {
      it("validates plan definition and entitlements map", () => {
        const parsed = planUpsertSchema.parse({
          name: "Elite Global",
          code: "ELITE",
          priceMonthly: 79.99,
          currency: "USD",
          isActive: true,
          isPopular: true,
          displayOrder: 3,
          features: ["Unlimited Messaging", "Top Tier Discovery"],
          entitlements: {
            DAILY_INTEREST_LIMIT: "100",
            DISCOVERY_ALLOWANCE: "1000",
          },
        });
        expect(parsed.code).toBe("ELITE");
        expect(parsed.entitlements["DAILY_INTEREST_LIMIT"]).toBe("100");
      });
    });

    describe("manualSubscriptionAdjustmentSchema", () => {
      it("requires mandatory audit reason of at least 5 characters", () => {
        const res = manualSubscriptionAdjustmentSchema.safeParse({
          userId: "usr_123",
          planId: "plan_123",
          durationDays: 30,
          reason: "test",
        });
        expect(res.success).toBe(false);
      });

      it("accepts valid override parameters", () => {
        const parsed = manualSubscriptionAdjustmentSchema.parse({
          userId: "usr_123",
          planId: "plan_123",
          durationDays: 60,
          reason: "Customer support compensation for platform maintenance",
        });
        expect(parsed.durationDays).toBe(60);
      });
    });
  });
});

