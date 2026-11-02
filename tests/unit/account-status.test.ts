import { describe, it, expect } from "vitest";
import { AccountStatus } from "@/generated/prisma";
import {
  AccountSuspendedError,
  AccountDeactivatedError,
} from "@/server/utils/errors";

describe("Account Status Lifecycle & Policy Guardrails", () => {
  it("defines all required account lifecycle statuses", () => {
    expect(AccountStatus.PENDING_VERIFICATION).toBe("PENDING_VERIFICATION");
    expect(AccountStatus.ACTIVE).toBe("ACTIVE");
    expect(AccountStatus.SUSPENDED).toBe("SUSPENDED");
    expect(AccountStatus.DEACTIVATED).toBe("DEACTIVATED");
  });

  describe("Lifecycle state transitions", () => {
    it("simulates registration to active state transition on email verification", () => {
      let currentStatus: AccountStatus = AccountStatus.PENDING_VERIFICATION;
      let emailVerified = false;

      // User clicks email verification link
      emailVerified = true;
      if (
        emailVerified &&
        currentStatus === AccountStatus.PENDING_VERIFICATION
      ) {
        currentStatus = AccountStatus.ACTIVE;
      }

      expect(currentStatus).toBe(AccountStatus.ACTIVE);
      expect(emailVerified).toBe(true);
    });

    it("simulates suspension workflow", () => {
      let currentStatus: AccountStatus = AccountStatus.ACTIVE;

      // Trust & Safety flags account for breach
      currentStatus = AccountStatus.SUSPENDED;

      expect(currentStatus).toBe(AccountStatus.SUSPENDED);
    });
  });

  describe("Status policy checks", () => {
    function evaluateAccountAccess(user: {
      accountStatus: AccountStatus;
      emailVerified: boolean;
    }) {
      if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new AccountSuspendedError();
      }
      if (user.accountStatus === AccountStatus.DEACTIVATED) {
        throw new AccountDeactivatedError();
      }
      return {
        canAccessDashboard: true,
        canInitiateMatches:
          user.emailVerified && user.accountStatus === AccountStatus.ACTIVE,
      };
    }

    it("allows active, verified user full platform access", () => {
      const access = evaluateAccountAccess({
        accountStatus: AccountStatus.ACTIVE,
        emailVerified: true,
      });
      expect(access.canAccessDashboard).toBe(true);
      expect(access.canInitiateMatches).toBe(true);
    });

    it("allows pending verification user to view dashboard but gates matchmaking", () => {
      const access = evaluateAccountAccess({
        accountStatus: AccountStatus.PENDING_VERIFICATION,
        emailVerified: false,
      });
      expect(access.canAccessDashboard).toBe(true);
      expect(access.canInitiateMatches).toBe(false);
    });

    it("throws AccountSuspendedError when user is suspended", () => {
      expect(() =>
        evaluateAccountAccess({
          accountStatus: AccountStatus.SUSPENDED,
          emailVerified: true,
        })
      ).toThrow(AccountSuspendedError);
    });

    it("throws AccountDeactivatedError when user is deactivated", () => {
      expect(() =>
        evaluateAccountAccess({
          accountStatus: AccountStatus.DEACTIVATED,
          emailVerified: true,
        })
      ).toThrow(AccountDeactivatedError);
    });
  });
});
