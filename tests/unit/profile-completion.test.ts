import { describe, it, expect } from "vitest";
import { calculateProfileCompletion } from "@/server/services/profile-completion.service";
import type { ProfileWithRelations } from "@/server/services/profile-completion.service";

describe("Profile Completion Dynamic Calculator", () => {
  it("returns 0% and NOT_STARTED for an empty profile", () => {
    const emptyProfile: ProfileWithRelations = {
      id: "prof_1",
      userId: "user_1",
      slug: "empty-user",
      onboardingStatus: "NOT_STARTED",
      onboardingStep: 1,
      completionPercentage: 0,
      profileFor: null,
      fullName: null,
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      countryOfResidence: null,
      cityOfResidence: null,
      nationality: null,
      preferredLanguage: null,
      heightCm: null,
      weightKg: null,
      bodyType: null,
      complexion: null,
      religion: null,
      religiousPractice: null,
      communityEthnicity: null,
      disabilityInfo: null,
      aboutMe: null,
      employmentStatus: null,
      profession: null,
      jobTitle: null,
      industry: null,
      employer: null,
      incomeCurrency: "USD",
      annualIncomeRange: null,
      workLocation: null,
      careerDescription: null,
      familyType: null,
      familyValues: null,
      fatherOccupation: null,
      motherOccupation: null,
      brothersCount: 0,
      sistersCount: 0,
      brothersMarriedCount: 0,
      sistersMarriedCount: 0,
      familyLocation: null,
      familyBackground: null,
      dietaryHabits: null,
      smokingHabits: null,
      drinkingHabits: null,
      exerciseHabits: null,
      livingArrangement: null,
      hobbies: [],
      languages: [],
      lifestyleDescription: null,
      isVerified: false,
      verifiedAt: null,
      moderationStatus: "APPROVED" as const,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      educations: [],
      photos: [],
      partnerPreference: null,
    };

    const result = calculateProfileCompletion(emptyProfile);
    expect(result.completionPercentage).toBe(0);
    expect(result.status).toBe("NOT_STARTED");
    expect(result.missingSections).toContain("Basic Information");
  });

  it("calculates exact weights for completed sections", () => {
    const fullProfile: ProfileWithRelations = {
      id: "prof_2",
      userId: "user_2",
      slug: "complete-user",
      onboardingStatus: "IN_PROGRESS",
      onboardingStep: 7,
      completionPercentage: 0,
      // 1. Basic Info (15%)
      profileFor: "SELF",
      fullName: "Farhana Yasmin",
      dateOfBirth: new Date("1996-05-15"),
      gender: "FEMALE",
      maritalStatus: "NEVER_MARRIED",
      countryOfResidence: "United Kingdom",
      cityOfResidence: "Manchester",
      nationality: "British",
      preferredLanguage: "English",
      // 2. Personal Details (15%)
      heightCm: 165,
      weightKg: 58,
      bodyType: "Slim",
      complexion: "Fair",
      religion: "Islam",
      religiousPractice: "Moderately Practicing",
      communityEthnicity: "Bengali",
      disabilityInfo: "None",
      aboutMe: "I am a medical professional who loves traveling and spending time with family.",
      // 3. Education (10%)
      educations: [
        {
          id: "edu_1",
          profileId: "prof_2",
          educationLevel: "Medical Degree",
          degree: "MBBS",
          fieldOfStudy: "Medicine",
          institution: "University of Manchester",
          country: "United Kingdom",
          graduationYear: 2021,
          additionalQualifications: null,
          isHighest: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      // 4. Career (10%)
      employmentStatus: "Employed Full-Time",
      profession: "Physician / Doctor",
      jobTitle: "Registrar",
      industry: "Healthcare",
      employer: "NHS",
      incomeCurrency: "GBP",
      annualIncomeRange: "$75,000 - $100,000",
      workLocation: "Manchester",
      careerDescription: "Specializing in pediatrics",
      // 5. Family (10%)
      familyType: "NUCLEAR",
      familyValues: "Moderate",
      fatherOccupation: "Engineer",
      motherOccupation: "Teacher",
      brothersCount: 1,
      sistersCount: 0,
      brothersMarriedCount: 0,
      sistersMarriedCount: 0,
      familyLocation: "Manchester",
      familyBackground: "Educated family",
      // 6. Lifestyle (10%)
      dietaryHabits: "Strictly Halal",
      smokingHabits: "Non-Smoker",
      drinkingHabits: "Non-Drinker",
      exerciseHabits: "Gym twice a week",
      livingArrangement: "With family",
      hobbies: ["Reading", "Cooking"],
      languages: ["English", "Bengali"],
      lifestyleDescription: "Active lifestyle",
      isVerified: false,
      verifiedAt: null,
      moderationStatus: "APPROVED" as const,
      rejectionReason: null,
      // 7. Partner Preferences (20%)
      partnerPreference: {
        id: "pref_1",
        profileId: "prof_2",
        minAge: 26,
        maxAge: 32,
        minHeightCm: 172,
        maxHeightCm: 190,
        maritalStatus: ["NEVER_MARRIED"],
        educationLevels: ["Master's Degree"],
        professions: ["Doctor", "Engineer"],
        countries: ["United Kingdom"],
        cities: [],
        nationalities: ["British"],
        religions: ["Islam"],
        familyTypes: ["NUCLEAR"],
        lifestyles: [],
        additionalExpectations: "Looking for an educated, family-oriented partner.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // 8. Photos (10%)
      photos: [
        {
          id: "photo_1",
          profileId: "prof_2",
          cloudinaryPublicId: "photo_cuid_1",
          secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          isPrimary: true,
          orderIndex: 0,
          moderationStatus: "APPROVED",
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateProfileCompletion(fullProfile);
    expect(result.sections.basicInfo).toBe(15);
    expect(result.sections.personalDetails).toBe(15);
    expect(result.sections.education).toBe(10);
    expect(result.sections.career).toBe(10);
    expect(result.sections.family).toBe(10);
    expect(result.sections.lifestyle).toBe(10);
    expect(result.sections.partnerPreferences).toBe(20);
    expect(result.sections.photos).toBe(10);
    expect(result.completionPercentage).toBe(100);
    expect(result.status).toBe("COMPLETED");
  });
});

