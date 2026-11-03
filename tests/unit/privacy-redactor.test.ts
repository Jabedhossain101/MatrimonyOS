import { describe, it, expect } from "vitest";
import {
  redactProfileForViewer,
  type CompleteProfile,
} from "@/server/utils/privacy";

describe("Privacy & Visibility Redaction Engine", () => {
  const mockProfile: CompleteProfile = {
    id: "profile_123",
    userId: "user_owner_456",
    slug: "tariq-ahmed-123456",
    onboardingStatus: "COMPLETED",
    onboardingStep: 7,
    completionPercentage: 100,
    profileFor: "SELF",
    fullName: "Tariq Ahmed",
    dateOfBirth: new Date("1995-08-20"),
    gender: "MALE",
    maritalStatus: "NEVER_MARRIED",
    countryOfResidence: "United Kingdom",
    cityOfResidence: "London",
    nationality: "British",
    preferredLanguage: "English",
    heightCm: 180,
    weightKg: 75,
    bodyType: "Athletic",
    complexion: "Fair",
    religion: "Islam",
    religiousPractice: "Moderately Practicing",
    communityEthnicity: "Bengali",
    disabilityInfo: null,
    aboutMe: "Working in cloud security, active hiker and reader.",
    employmentStatus: "Employed Full-Time",
    profession: "Software Engineer / Tech",
    jobTitle: "Principal Security Architect",
    industry: "Cybersecurity",
    employer: "Confidential Enterprise Tech Ltd",
    incomeCurrency: "GBP",
    annualIncomeRange: "$150,000 - $200,000",
    workLocation: "London",
    careerDescription: "Lead architect for enterprise infrastructure",
    familyType: "NUCLEAR",
    familyValues: "Moderate",
    fatherOccupation: "Senior Consultant",
    motherOccupation: "Educator",
    brothersCount: 1,
    sistersCount: 1,
    brothersMarriedCount: 0,
    sistersMarriedCount: 0,
    familyLocation: "London",
    familyBackground: "Respectful London-based family",
    dietaryHabits: "Strictly Halal",
    smokingHabits: "Non-Smoker",
    drinkingHabits: "Non-Drinker",
    exerciseHabits: "Gym 4 times a week",
    livingArrangement: "Independent Flat",
    hobbies: ["Hiking", "Reading"],
    languages: ["English", "Bengali"],
    lifestyleDescription: "Balanced lifestyle",
    createdAt: new Date(),
    updatedAt: new Date(),
    educations: [
      {
        id: "edu_1",
        profileId: "profile_123",
        educationLevel: "Master's Degree",
        degree: "MSc Advanced Computing",
        fieldOfStudy: "Computer Science",
        institution: "Imperial College London",
        country: "United Kingdom",
        graduationYear: 2018,
        additionalQualifications: null,
        isHighest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    photos: [
      {
        id: "photo_1",
        profileId: "profile_123",
        cloudinaryPublicId: "photo_public_1",
        secureUrl: "https://res.cloudinary.com/demo/image/upload/portrait.jpg",
        isPrimary: true,
        orderIndex: 0,
        moderationStatus: "APPROVED",
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    partnerPreference: {
      id: "pref_1",
      profileId: "profile_123",
      minAge: 23,
      maxAge: 29,
      minHeightCm: 158,
      maxHeightCm: 175,
      maritalStatus: ["NEVER_MARRIED"],
      educationLevels: ["Bachelor's Degree"],
      professions: [],
      countries: ["United Kingdom"],
      cities: [],
      nationalities: ["British"],
      religions: ["Islam"],
      familyTypes: [],
      lifestyles: [],
      additionalExpectations: "Looking for an educated, humble partner.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    privacySettings: {
      id: "privacy_1",
      profileId: "profile_123",
      profileVisibility: "MEMBERS_ONLY",
      photoVisibility: "MEMBERS_ONLY",
      showDateOfBirth: false, // Hide exact date of birth (display age only)
      showContactInfo: false,
      showIncome: false, // Hide income range from public
      showEmployer: false, // Hide employer company name
      showFamilyDetails: true,
      showLocation: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      name: "Tariq Ahmed",
      email: "tariq.private@example.com",
    },
  };

  it("returns unredacted profile with isOwner=true for the profile owner", () => {
    const ownerView = redactProfileForViewer(
      mockProfile,
      "user_owner_456",
      true
    );

    expect(ownerView).toBeDefined();
    expect(ownerView?.isOwner).toBe(true);
    expect(ownerView?.employer).toBe("Confidential Enterprise Tech Ltd");
    expect(ownerView?.annualIncomeRange).toBe("$150,000 - $200,000");
    expect(ownerView?.dateOfBirth).toBe("1995-08-20");
    expect(ownerView?.weightKg).toBe(75);
    expect(ownerView?.photos.length).toBe(1);
  });

  it("redacts sensitive employer, income, and exact dob for verified other members", () => {
    const otherMemberView = redactProfileForViewer(
      mockProfile,
      "different_member_789",
      true
    );

    expect(otherMemberView).toBeDefined();
    expect(otherMemberView?.isOwner).toBe(false);
    expect(otherMemberView?.viewerCanAccess).toBe(true);

    // Age is visible, but exact birthdate is redacted
    expect(otherMemberView?.age).toBeDefined();
    expect(otherMemberView?.dateOfBirth).toBeNull();

    // Sensitive financial and employer data is redacted
    expect(otherMemberView?.employer).toBeNull();
    expect(otherMemberView?.annualIncomeRange).toBeNull();

    // Weight is redacted
    expect(otherMemberView?.weightKg).toBeNull();

    // Email and phone are never present in the public profile interface
    expect((otherMemberView as unknown as Record<string, unknown>).email).toBeUndefined();
    expect((otherMemberView as unknown as Record<string, unknown>).phone).toBeUndefined();
  });

  it("blocks unauthenticated guest from viewing MEMBERS_ONLY profile with viewerCanAccess=false", () => {
    const guestView = redactProfileForViewer(mockProfile, null, false);

    expect(guestView).toBeDefined();
    expect(guestView?.viewerCanAccess).toBe(false);
    expect(guestView?.photos.length).toBe(0);
    expect(guestView?.aboutMe).toContain("visible to verified MatrimonyOS members only");
  });

  it("returns null (404/Not Found) for PRIVATE profile when viewer is not owner", () => {
    const privateProfile = {
      ...mockProfile,
      privacySettings: {
        ...mockProfile.privacySettings!,
        profileVisibility: "PRIVATE" as const,
      },
    };

    const guestView = redactProfileForViewer(privateProfile, null, false);
    expect(guestView).toBeNull();

    const otherMemberView = redactProfileForViewer(
      privateProfile,
      "other_user",
      true
    );
    expect(otherMemberView).toBeNull();
  });
});

