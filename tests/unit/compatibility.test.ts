import { describe, it, expect } from "vitest";
import { calculateCompatibilityScore } from "@/server/services/compatibility.service";
import type { MatrimonialProfile, PartnerPreference, ProfileEducation } from "@/generated/prisma";

describe("Rule-Based Compatibility Engine", () => {
  const candidateBirthDate = new Date();
  candidateBirthDate.setFullYear(candidateBirthDate.getFullYear() - 28); // 28 years old

  const mockEducations: ProfileEducation[] = [
    {
      id: "edu_01",
      profileId: "candidate_01",
      educationLevel: "Master's Degree",
      degree: "Master of Science",
      fieldOfStudy: "Computer Science",
      institution: "University College London",
      country: "United Kingdom",
      graduationYear: 2020,
      additionalQualifications: null,
      isHighest: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCandidate: MatrimonialProfile & { educations: ProfileEducation[] } = {
    id: "candidate_01",
    userId: "user_01",
    slug: "farhana-rahman-123456",
    onboardingStatus: "COMPLETED",
    onboardingStep: 7,
    completionPercentage: 100,
    profileFor: "SELF",
    fullName: "Farhana Rahman",
    dateOfBirth: candidateBirthDate,
    gender: "FEMALE",
    maritalStatus: "NEVER_MARRIED",
    countryOfResidence: "United Kingdom",
    cityOfResidence: "London",
    nationality: "British",
    preferredLanguage: "English",
    heightCm: 165,
    weightKg: 58,
    bodyType: "Athletic",
    complexion: "Fair",
    religion: "Islam",
    religiousPractice: "Regular Prayers",
    communityEthnicity: "Bengali",
    disabilityInfo: null,
    aboutMe: "Architect in London",
    employmentStatus: "Full-Time",
    profession: "Software Engineer / Tech",
    jobTitle: "Lead Engineer",
    industry: "Technology",
    employer: "Tech Corp",
    incomeCurrency: "GBP",
    annualIncomeRange: "80000_100000",
    workLocation: "London",
    careerDescription: "Lead cloud engineer",
    familyType: "NUCLEAR",
    familyValues: "Moderate",
    fatherOccupation: "Doctor",
    motherOccupation: "Teacher",
    brothersCount: 1,
    sistersCount: 1,
    brothersMarriedCount: 0,
    sistersMarriedCount: 0,
    familyLocation: "London",
    familyBackground: "Respected noble lineage",
    dietaryHabits: "Halal Only",
    smokingHabits: "Non-Smoker",
    drinkingHabits: "Non-Drinker",
    exerciseHabits: "Regular",
    livingArrangement: "Own Home",
    hobbies: ["Reading", "Travel"],
    languages: ["English", "Bengali"],
    lifestyleDescription: "Active balanced lifestyle",
    createdAt: new Date(),
    updatedAt: new Date(),
    educations: mockEducations,
  };

  const perfectPreferences: PartnerPreference = {
    id: "pref_01",
    profileId: "viewer_prof_01",
    minAge: 25,
    maxAge: 30,
    minHeightCm: 160,
    maxHeightCm: 175,
    maritalStatus: ["NEVER_MARRIED"],
    religions: ["Islam"],
    countries: ["United Kingdom"],
    cities: ["London"],
    nationalities: ["British"],
    educationLevels: ["Master's Degree"],
    professions: ["Software Engineer / Tech"],
    familyTypes: [],
    lifestyles: [],
    additionalExpectations: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should calculate an EXCELLENT match score (85-100%) when all configured preferences match", () => {
    const result = calculateCompatibilityScore(mockCandidate, perfectPreferences);

    expect(result.percentage).toBeGreaterThanOrEqual(85);
    expect(result.matchGrade).toBe("EXCELLENT");
    expect(result.matchingTags).toContain("Age Preference");
    expect(result.matchingTags).toContain("Height Preference");
    expect(result.matchingTags).toContain("Marital Status");
    expect(result.matchingTags).toContain("Location Match");
    expect(result.matchingTags).toContain("Education Criteria");
    expect(result.matchingTags).toContain("Religious Harmony");
    expect(result.matchingTags).toContain("Career Match");
  });

  it("should return baseline score (75%, MODERATE) when viewer has no partner preferences configured", () => {
    const result = calculateCompatibilityScore(mockCandidate, null);

    expect(result.percentage).toBe(75);
    expect(result.matchGrade).toBe("MODERATE");
    expect(result.matchingTags).toContain("Open Preferences");
    expect(result.evaluatedDimensionsCount).toBe(0);
  });

  it("should reduce score and match grade when major dimensions mismatch", () => {
    const mismatchCandidate: MatrimonialProfile & { educations: ProfileEducation[] } = {
      ...mockCandidate,
      countryOfResidence: "Australia",
      cityOfResidence: "Sydney",
      maritalStatus: "DIVORCED",
      religion: "Christianity",
      profession: "Hospitality",
      heightCm: 195, // max 175
      educations: [],
    };

    const result = calculateCompatibilityScore(mismatchCandidate, perfectPreferences);
    expect(result.percentage).toBeLessThan(50);
    expect(result.matchGrade).toBe("FAIR");
    expect(result.matchingTags).not.toContain("Marital Status");
    expect(result.matchingTags).not.toContain("Location Match");
  });

  it("should accurately count evaluated dimensions", () => {
    const result = calculateCompatibilityScore(mockCandidate, perfectPreferences);
    expect(result.evaluatedDimensionsCount).toBeGreaterThan(0);
  });
});
