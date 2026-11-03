import { describe, it, expect } from "vitest";
import {
  basicInfoSchema,
  personalDetailsSchema,
  partnerPreferenceSchema,
  privacySettingsSchema,
  calculateAge,
  isValidAdultBirthDate,
} from "@/lib/validations/profile";

describe("Profile Validation Schemas & Age Rules", () => {
  it("calculates age correctly from birth date", () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    expect(calculateAge(twentyYearsAgo)).toBe(20);
  });

  it("enforces minimum age 18 years old", () => {
    const seventeenYearsAgo = new Date();
    seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
    expect(isValidAdultBirthDate(seventeenYearsAgo)).toBe(false);

    const nineteenYearsAgo = new Date();
    nineteenYearsAgo.setFullYear(nineteenYearsAgo.getFullYear() - 19);
    expect(isValidAdultBirthDate(nineteenYearsAgo)).toBe(true);
  });

  it("validates compliant basic information input", () => {
    const validDob = new Date();
    validDob.setFullYear(validDob.getFullYear() - 25);

    const input = {
      profileFor: "SELF" as const,
      fullName: "Tariq Ahmed",
      dateOfBirth: validDob.toISOString().split("T")[0],
      gender: "MALE" as const,
      maritalStatus: "NEVER_MARRIED" as const,
      countryOfResidence: "United Kingdom",
      cityOfResidence: "London",
      nationality: "British",
      preferredLanguage: "English",
    };

    const res = basicInfoSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("rejects underage basic information input", () => {
    const underageDob = new Date();
    underageDob.setFullYear(underageDob.getFullYear() - 16);

    const input = {
      profileFor: "SELF" as const,
      fullName: "Underage Applicant",
      dateOfBirth: underageDob.toISOString().split("T")[0],
      gender: "FEMALE" as const,
      maritalStatus: "NEVER_MARRIED" as const,
      countryOfResidence: "Bangladesh",
      cityOfResidence: "Dhaka",
      nationality: "Bangladeshi",
      preferredLanguage: "Bengali",
    };

    const res = basicInfoSchema.safeParse(input);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.format().dateOfBirth?._errors[0]).toContain(
        "at least 18 years old"
      );
    }
  });

  it("validates personal details height boundaries", () => {
    const valid = {
      heightCm: 175,
      weightKg: 72,
      religion: "Islam",
      aboutMe: "Thoughtful professional seeking compatible partner.",
    };
    expect(personalDetailsSchema.safeParse(valid).success).toBe(true);

    const tooShort = { ...valid, heightCm: 100 };
    expect(personalDetailsSchema.safeParse(tooShort).success).toBe(false);

    const tooTall = { ...valid, heightCm: 260 };
    expect(personalDetailsSchema.safeParse(tooTall).success).toBe(false);
  });

  it("enforces partner preferences minAge <= maxAge", () => {
    const valid = {
      minAge: 24,
      maxAge: 30,
      minHeightCm: 155,
      maxHeightCm: 180,
    };
    expect(partnerPreferenceSchema.safeParse(valid).success).toBe(true);

    const invalidAgeRange = {
      minAge: 35,
      maxAge: 25,
    };
    const res = partnerPreferenceSchema.safeParse(invalidAgeRange);
    expect(res.success).toBe(false);
  });

  it("validates privacy settings schema with default values", () => {
    const defaults = privacySettingsSchema.parse({});
    expect(defaults.profileVisibility).toBe("MEMBERS_ONLY");
    expect(defaults.photoVisibility).toBe("MEMBERS_ONLY");
    expect(defaults.showDateOfBirth).toBe(false);
    expect(defaults.showIncome).toBe(false);
    expect(defaults.showEmployer).toBe(false);
    expect(defaults.showFamilyDetails).toBe(true);
  });
});

