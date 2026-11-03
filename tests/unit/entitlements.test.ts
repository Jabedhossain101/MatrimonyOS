import { describe, it, expect } from "vitest";
import { entitlementsService } from "@/server/services/entitlements.service";
import { AppRole } from "@/lib/permissions";

describe("Entitlements & Daily Quota Engine", () => {
  it("should return standard 10 interests/day limit for regular members", () => {
    const limit = entitlementsService.getDailyInterestLimit([AppRole.MEMBER]);
    expect(limit).toBe(10);
  });

  it("should return 50 interests/day limit for premium members", () => {
    const limit = entitlementsService.getDailyInterestLimit([
      AppRole.MEMBER,
      AppRole.PREMIUM_MEMBER,
    ]);
    expect(limit).toBe(50);
  });

  it("should grant 25 interests/day limit for family managers", () => {
    const limit = entitlementsService.getDailyInterestLimit([AppRole.FAMILY_MANAGER]);
    expect(limit).toBe(25);
  });

  it("should grant elevated limit (100) for administrators and moderators", () => {
    const adminLimit = entitlementsService.getDailyInterestLimit([AppRole.ADMIN]);
    expect(adminLimit).toBe(100);

    const modLimit = entitlementsService.getDailyInterestLimit([AppRole.MODERATOR]);
    expect(modLimit).toBe(100);
  });

  it("should select the highest limit if user possesses multiple roles", () => {
    const multiRoleLimit = entitlementsService.getDailyInterestLimit([
      AppRole.MEMBER,
      AppRole.FAMILY_MANAGER,
      AppRole.PREMIUM_MEMBER,
    ]);
    expect(multiRoleLimit).toBe(50);
  });

  it("should safely default to MEMBER limit (10) when empty role array is passed", () => {
    const fallbackLimit = entitlementsService.getDailyInterestLimit([]);
    expect(fallbackLimit).toBe(10);
  });
});
