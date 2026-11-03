import "server-only";
import type {
  MatrimonialProfile,
  ProfileEducation,
  ProfilePhoto,
  PartnerPreference,
} from "@/generated/prisma";

export interface ProfileWithRelations extends MatrimonialProfile {
  educations?: ProfileEducation[];
  photos?: ProfilePhoto[];
  partnerPreference?: PartnerPreference | null;
}

export interface SectionCompletion {
  basicInfo: number; // Max 15
  personalDetails: number; // Max 15
  education: number; // Max 10
  career: number; // Max 10
  family: number; // Max 10
  lifestyle: number; // Max 10
  partnerPreferences: number; // Max 20
  photos: number; // Max 10
  total: number; // Max 100
}

export interface OnboardingStatusResult {
  completionPercentage: number;
  sections: SectionCompletion;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  missingSections: string[];
}

/**
 * Calculates dynamic profile completion based on weighted criteria:
 * - Basic Information: 15%
 * - Personal Details: 15%
 * - Education: 10%
 * - Career: 10%
 * - Family Information: 10%
 * - Lifestyle: 10%
 * - Partner Preferences: 20%
 * - Profile Photos: 10%
 * Total = 100%
 */
export function calculateProfileCompletion(
  profile: ProfileWithRelations
): OnboardingStatusResult {
  const sections: SectionCompletion = {
    basicInfo: 0,
    personalDetails: 0,
    education: 0,
    career: 0,
    family: 0,
    lifestyle: 0,
    partnerPreferences: 0,
    photos: 0,
    total: 0,
  };

  const missingSections: string[] = [];

  // 1. Basic Information (15%)
  // Mandatory: profileFor, fullName, dateOfBirth, gender, maritalStatus, countryOfResidence, cityOfResidence, nationality
  if (
    profile.profileFor &&
    profile.fullName &&
    profile.fullName.trim().length >= 2 &&
    profile.dateOfBirth &&
    profile.gender &&
    profile.maritalStatus &&
    profile.countryOfResidence &&
    profile.cityOfResidence &&
    profile.nationality
  ) {
    sections.basicInfo = 15;
  } else {
    missingSections.push("Basic Information");
  }

  // 2. Personal Details (15%)
  // Mandatory: heightCm, religion, aboutMe
  const hasHeight = Boolean(profile.heightCm && profile.heightCm >= 120);
  const hasReligion = Boolean(profile.religion && profile.religion.trim().length >= 2);
  const hasAboutMe = Boolean(profile.aboutMe && profile.aboutMe.trim().length >= 10);

  if (hasHeight && hasReligion && hasAboutMe) {
    sections.personalDetails = 15;
  } else if ((hasHeight && hasReligion) || (hasHeight && hasAboutMe)) {
    sections.personalDetails = 10;
    missingSections.push("Personal Details (Incomplete)");
  } else if (hasHeight || hasReligion) {
    sections.personalDetails = 5;
    missingSections.push("Personal Details");
  } else {
    missingSections.push("Personal Details");
  }

  // 3. Education (10%)
  // At least 1 valid education record with degree, institution, country
  const validEducations =
    profile.educations?.filter(
      (e) =>
        e.degree?.trim().length >= 2 &&
        e.institution?.trim().length >= 2 &&
        e.educationLevel?.trim().length >= 2
    ) || [];

  if (validEducations.length > 0) {
    sections.education = 10;
  } else {
    missingSections.push("Education");
  }

  // 4. Career (10%)
  // Mandatory: employmentStatus, profession
  if (
    profile.employmentStatus &&
    profile.employmentStatus.trim().length >= 2 &&
    profile.profession &&
    profile.profession.trim().length >= 2
  ) {
    sections.career = 10;
  } else {
    missingSections.push("Career & Profession");
  }

  // 5. Family (10%)
  // Mandatory: familyType, familyValues
  if (profile.familyType && profile.familyValues && profile.familyValues.trim().length >= 2) {
    sections.family = 10;
  } else {
    missingSections.push("Family Information");
  }

  // 6. Lifestyle (10%)
  // Mandatory: dietaryHabits, smokingHabits, drinkingHabits
  if (profile.dietaryHabits && profile.smokingHabits && profile.drinkingHabits) {
    sections.lifestyle = 10;
  } else {
    missingSections.push("Lifestyle");
  }

  // 7. Partner Preferences (20%)
  // Mandatory: at least one criteria defined (age range, religion, or country)
  const pref = profile.partnerPreference;
  if (
    pref &&
    (Boolean(pref.minAge || pref.maxAge) ||
      (pref.countries && pref.countries.length > 0) ||
      (pref.religions && pref.religions.length > 0) ||
      (pref.maritalStatus && pref.maritalStatus.length > 0))
  ) {
    sections.partnerPreferences = 20;
  } else {
    missingSections.push("Partner Preferences");
  }

  // 8. Profile Photos (10%)
  // At least one photo uploaded
  if (profile.photos && profile.photos.length > 0) {
    sections.photos = 10;
  } else {
    missingSections.push("Profile Photos");
  }

  // Total
  const total =
    sections.basicInfo +
    sections.personalDetails +
    sections.education +
    sections.career +
    sections.family +
    sections.lifestyle +
    sections.partnerPreferences +
    sections.photos;

  sections.total = Math.min(100, Math.max(0, total));

  // Determine Onboarding Status
  let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED";
  if (sections.total === 0) {
    status = "NOT_STARTED";
  } else if (sections.total >= 70 && sections.basicInfo > 0 && sections.partnerPreferences > 0) {
    status = "COMPLETED";
  } else {
    status = "IN_PROGRESS";
  }

  return {
    completionPercentage: sections.total,
    sections,
    status,
    missingSections,
  };
}

