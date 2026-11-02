import { describe, it, expect } from "vitest";
import {
  AppRole,
  PERMISSIONS,
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAllPermissions,
} from "@/lib/permissions";

describe("Role-Based Access Control (RBAC)", () => {
  describe("Role checking utilities", () => {
    const userRoles = [AppRole.MEMBER, AppRole.FAMILY_MANAGER];

    it("correctly identifies existing roles with hasRole", () => {
      expect(hasRole(userRoles, AppRole.MEMBER)).toBe(true);
      expect(hasRole(userRoles, AppRole.FAMILY_MANAGER)).toBe(true);
      expect(hasRole(userRoles, AppRole.ADMIN)).toBe(false);
    });

    it("correctly checks hasAnyRole against role sets", () => {
      expect(hasAnyRole(userRoles, [AppRole.ADMIN, AppRole.MEMBER])).toBe(true);
      expect(hasAnyRole(userRoles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])).toBe(
        false
      );
    });
  });

  describe("Permission matrices across roles", () => {
    it("assigns standard member permissions to MEMBER", () => {
      const memberRoles = [AppRole.MEMBER];

      expect(hasPermission(memberRoles, PERMISSIONS.PROFILE_READ)).toBe(true);
      expect(hasPermission(memberRoles, PERMISSIONS.PROFILE_CREATE)).toBe(true);
      expect(hasPermission(memberRoles, PERMISSIONS.PROFILE_EDIT)).toBe(true);
      expect(hasPermission(memberRoles, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(
        true
      );

      // Blocked permissions
      expect(hasPermission(memberRoles, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
      expect(hasPermission(memberRoles, PERMISSIONS.USER_SUSPEND)).toBe(false);
      expect(hasPermission(memberRoles, PERMISSIONS.PLATFORM_CONFIGURE)).toBe(
        false
      );
    });

    it("grants moderation rights to MODERATOR", () => {
      const moderatorRoles = [AppRole.MODERATOR];

      expect(hasPermission(moderatorRoles, PERMISSIONS.PROFILE_READ)).toBe(
        true
      );
      expect(hasPermission(moderatorRoles, PERMISSIONS.PROFILE_VERIFY)).toBe(
        true
      );
      expect(hasPermission(moderatorRoles, PERMISSIONS.USER_SUSPEND)).toBe(
        true
      );
      expect(hasPermission(moderatorRoles, PERMISSIONS.REPORT_READ)).toBe(true);
      expect(hasPermission(moderatorRoles, PERMISSIONS.REPORT_RESOLVE)).toBe(
        true
      );
      expect(hasPermission(moderatorRoles, PERMISSIONS.ADMIN_ACCESS)).toBe(
        true
      );

      // Blocked from super-admin configs
      expect(
        hasPermission(moderatorRoles, PERMISSIONS.PLATFORM_CONFIGURE)
      ).toBe(false);
    });

    it("grants admin and user management capabilities to ADMIN", () => {
      const adminRoles = [AppRole.ADMIN];

      expect(hasPermission(adminRoles, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.ADMIN_MANAGE)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.USER_MANAGE)).toBe(true);
      expect(hasPermission(adminRoles, PERMISSIONS.SUBSCRIPTION_MANAGE)).toBe(
        true
      );
      expect(hasPermission(adminRoles, PERMISSIONS.REPORT_RESOLVE)).toBe(true);
    });

    it("grants complete permissions to SUPER_ADMIN unconditionally", () => {
      const superAdminRoles = [AppRole.SUPER_ADMIN];

      // Check all defined permissions
      for (const permission of Object.values(PERMISSIONS)) {
        expect(hasPermission(superAdminRoles, permission)).toBe(true);
      }
    });

    it("combines permissions additively for multi-role users", () => {
      // User has both MEMBER and MODERATOR roles
      const multiRoles = [AppRole.MEMBER, AppRole.MODERATOR];

      // Inherits MEMBER permission
      expect(hasPermission(multiRoles, PERMISSIONS.PROFILE_CREATE)).toBe(true);
      // Inherits MODERATOR permission
      expect(hasPermission(multiRoles, PERMISSIONS.USER_SUSPEND)).toBe(true);

      expect(
        hasAllPermissions(multiRoles, [
          PERMISSIONS.PROFILE_CREATE,
          PERMISSIONS.USER_SUSPEND,
        ])
      ).toBe(true);
    });
  });
});
