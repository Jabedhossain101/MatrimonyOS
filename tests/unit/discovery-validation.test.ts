import { describe, it, expect } from "vitest";
import {
  discoveryFilterSchema,
  sendInterestSchema,
  respondInterestSchema,
  withdrawInterestSchema,
  toggleShortlistSchema,
} from "@/lib/validations/discovery";

describe("Discovery & Search Validation Schemas", () => {
  it("should parse default search parameters successfully", () => {
    const parsed = discoveryFilterSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sort).toBe("recommended");
    expect(parsed.hasPhoto).toBeUndefined();
    expect(parsed.isVerified).toBeUndefined();
  });

  it("should validate and coerce valid query params", () => {
    const parsed = discoveryFilterSchema.parse({
      page: "2",
      limit: "24",
      minAge: "25",
      maxAge: "35",
      gender: "FEMALE",
      country: "Bangladesh",
      sort: "newest",
      hasPhoto: "true",
      isVerified: "true",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(24);
    expect(parsed.minAge).toBe(25);
    expect(parsed.maxAge).toBe(35);
    expect(parsed.gender).toBe("FEMALE");
    expect(parsed.country).toBe("Bangladesh");
    expect(parsed.sort).toBe("newest");
    expect(parsed.hasPhoto).toBe(true);
    expect(parsed.isVerified).toBe(true);
  });

  it("should reject invalid age ranges (e.g. minAge > maxAge)", () => {
    const result = discoveryFilterSchema.safeParse({
      minAge: 40,
      maxAge: 30,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain("Minimum age cannot exceed maximum age");
    }
  });

  it("should reject out-of-boundary age limits (< 18 or > 100)", () => {
    const underAge = discoveryFilterSchema.safeParse({ minAge: 16 });
    expect(underAge.success).toBe(false);

    const overAge = discoveryFilterSchema.safeParse({ maxAge: 105 });
    expect(overAge.success).toBe(false);
  });

  it("should validate sendInterestSchema with optional message", () => {
    const valid = sendInterestSchema.safeParse({
      recipientProfileId: "prof_rec_123",
      message: "Assalamu Alaikum, I would like to express serious interest.",
    });
    expect(valid.success).toBe(true);

    const validNoMessage = sendInterestSchema.safeParse({
      recipientProfileId: "prof_rec_123",
    });
    expect(validNoMessage.success).toBe(true);

    const emptyTarget = sendInterestSchema.safeParse({
      recipientProfileId: "",
    });
    expect(emptyTarget.success).toBe(false);
  });

  it("should enforce respondInterestSchema actions (ACCEPT or DECLINE)", () => {
    const validAccept = respondInterestSchema.safeParse({
      interestId: "int_123",
      action: "ACCEPT",
    });
    expect(validAccept.success).toBe(true);

    const validDecline = respondInterestSchema.safeParse({
      interestId: "int_123",
      action: "DECLINE",
    });
    expect(validDecline.success).toBe(true);

    const invalidAction = respondInterestSchema.safeParse({
      interestId: "int_123",
      action: "MAYBE",
    });
    expect(invalidAction.success).toBe(false);
  });

  it("should validate withdrawInterestSchema and toggleShortlistSchema", () => {
    const validWithdraw = withdrawInterestSchema.safeParse({
      interestId: "int_987",
    });
    expect(validWithdraw.success).toBe(true);

    const validToggle = toggleShortlistSchema.safeParse({
      targetProfileId: "prof_target_456",
    });
    expect(validToggle.success).toBe(true);

    const invalidToggle = toggleShortlistSchema.safeParse({});
    expect(invalidToggle.success).toBe(false);
  });
});
