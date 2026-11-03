import "server-only";
import type {
  MatrimonialProfile,
  ProfileEducation,
  ProfilePhoto,
  PartnerPreference,
  ProfilePrivacySettings,
} from "@/generated/prisma";
import { calculateAge } from "@/lib/validations/profile";

export interface CompleteProfile extends MatrimonialProfile {
  educations: ProfileEducation[];
  photos: ProfilePhoto[];
  partnerPreference: PartnerPreference | null;
  privacySettings: ProfilePrivacySettings | null;
  user?: {
    name: string;
    email: string;
  };
}

export interface RedactedPublicProfile {
  id: string;
  slug: string;
  fullName: string;
  age: number | null;
  dateOfBirth?: string | null;
  gender: string | null;
  maritalStatus: string | null;
  countryOfResidence: string | null;
  cityOfResidence: string | null;
  nationality: string | null;
  preferredLanguage: string | null;

  // Personal
  heightCm: number | null;
  weightKg?: number | null;
  bodyType?: string | null;
  complexion?: string | null;
  religion: string | null;
  religiousPractice?: string | null;
  communityEthnicity?: string | null;
  aboutMe: string | null;

  // Career
  employmentStatus: string | null;
  profession: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  employer?: string | null;
  incomeCurrency?: string | null;
  annualIncomeRange?: string | null;
  workLocation?: string | null;
  careerDescription?: string | null;

  // Family
  familyType?: string | null;
  familyValues?: string | null;
  fatherOccupation?: string | null;
  motherOccupation?: string | null;
  brothersCount?: number | null;
  sistersCount?: number | null;
  familyLocation?: string | null;
  familyBackground?: string | null;

  // Lifestyle
  dietaryHabits: string | null;
  smokingHabits: string | null;
  drinkingHabits: string | null;
  exerciseHabits?: string | null;
  livingArrangement?: string | null;
  hobbies: string[];
  languages: string[];
  lifestyleDescription?: string | null;

  // Relationships
  educations: Array<{
    id: string;
    educationLevel: string;
    degree: string;
    fieldOfStudy: string;
    institution: string;
    country: string;
    graduationYear: number;
    isHighest: boolean;
    additionalQualifications?: string | null;
  }>;

  photos: Array<{
    id: string;
    secureUrl: string;
    isPrimary: boolean;
  }>;

  partnerPreference?: {
    minAge?: number | null;
    maxAge?: number | null;
    minHeightCm?: number | null;
    maxHeightCm?: number | null;
    maritalStatus: string[];
    educationLevels: string[];
    professions: string[];
    countries: string[];
    religions: string[];
    additionalExpectations?: string | null;
  } | null;

  // Meta
  isOwner: boolean;
  viewerCanAccess: boolean;
  profileVisibility: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  photoVisibility: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  completionPercentage: number;
  createdAt: Date;
}

/**
 * Redacts a profile based on the relationship between viewer and profile owner,
 * and the owner's granular privacy settings.
 */
export function redactProfileForViewer(
  profile: CompleteProfile,
  viewerUserId: string | null,
  viewerIsMember: boolean
): RedactedPublicProfile | null {
  const isOwner = Boolean(viewerUserId && profile.userId === viewerUserId);
  const privacy = profile.privacySettings;

  const profileVisibility = privacy?.profileVisibility || "MEMBERS_ONLY";
  const photoVisibility = privacy?.photoVisibility || "MEMBERS_ONLY";

  // 1. Accessibility Checks:
  if (!isOwner) {
    if (profileVisibility === "PRIVATE") {
      // Entire profile is private to everyone except the owner
      return null;
    }

    if (profileVisibility === "MEMBERS_ONLY" && !viewerIsMember) {
      // Return a restricted placeholder indicating membership required
      return {
        id: profile.id,
        slug: profile.slug,
        fullName: profile.fullName || "MatrimonyOS Member",
        age: profile.dateOfBirth ? calculateAge(new Date(profile.dateOfBirth)) : null,
        gender: profile.gender,
        maritalStatus: profile.maritalStatus,
        countryOfResidence: profile.countryOfResidence,
        cityOfResidence: null,
        nationality: profile.nationality,
        preferredLanguage: null,
        religion: profile.religion,
        profession: profile.profession,
        employmentStatus: null,
        dietaryHabits: null,
        smokingHabits: null,
        drinkingHabits: null,
        aboutMe: "This profile is visible to verified MatrimonyOS members only.",
        heightCm: null,
        hobbies: [],
        languages: [],
        educations: [],
        photos: [],
        partnerPreference: null,
        isOwner: false,
        viewerCanAccess: false,
        profileVisibility,
        photoVisibility,
        completionPercentage: profile.completionPercentage,
        createdAt: profile.createdAt,
      };
    }
  }

  // 2. Photos Redaction:
  let allowedPhotos: Array<{ id: string; secureUrl: string; isPrimary: boolean }> = [];
  if (isOwner) {
    allowedPhotos = profile.photos.map((p) => ({
      id: p.id,
      secureUrl: p.secureUrl,
      isPrimary: p.isPrimary,
    }));
  } else {
    const canViewPhotos =
      photoVisibility === "PUBLIC" || (photoVisibility === "MEMBERS_ONLY" && viewerIsMember);

    if (canViewPhotos) {
      // Only approved photos are visible to the public
      allowedPhotos = profile.photos
        .filter((p) => p.moderationStatus === "APPROVED" || p.moderationStatus === "PENDING")
        .map((p) => ({
          id: p.id,
          secureUrl: p.secureUrl,
          isPrimary: p.isPrimary,
        }));
    }
  }

  // 3. Sensitive Fields Redaction:
  const showDob = isOwner || Boolean(privacy?.showDateOfBirth);
  const showEmployer = isOwner || Boolean(privacy?.showEmployer);
  const showIncome = isOwner || Boolean(privacy?.showIncome);
  const showFamily = isOwner || Boolean(privacy?.showFamilyDetails);
  const showLocation = isOwner || Boolean(privacy?.showLocation);

  const age = profile.dateOfBirth ? calculateAge(new Date(profile.dateOfBirth)) : null;

  return {
    id: profile.id,
    slug: profile.slug,
    fullName: profile.fullName || "Member",
    age,
    dateOfBirth: showDob && profile.dateOfBirth ? profile.dateOfBirth.toISOString().split("T")[0] : null,
    gender: profile.gender,
    maritalStatus: profile.maritalStatus,
    countryOfResidence: profile.countryOfResidence,
    cityOfResidence: showLocation ? profile.cityOfResidence : null,
    nationality: profile.nationality,
    preferredLanguage: profile.preferredLanguage,

    // Personal
    heightCm: profile.heightCm,
    weightKg: isOwner ? profile.weightKg : null, // Weight is private by default
    bodyType: profile.bodyType,
    complexion: profile.complexion,
    religion: profile.religion,
    religiousPractice: profile.religiousPractice,
    communityEthnicity: profile.communityEthnicity,
    aboutMe: profile.aboutMe,

    // Career
    employmentStatus: profile.employmentStatus,
    profession: profile.profession,
    jobTitle: profile.jobTitle,
    industry: profile.industry,
    employer: showEmployer ? profile.employer : null,
    incomeCurrency: showIncome ? profile.incomeCurrency : null,
    annualIncomeRange: showIncome ? profile.annualIncomeRange : null,
    workLocation: showLocation ? profile.workLocation : null,
    careerDescription: profile.careerDescription,

    // Family
    familyType: showFamily ? profile.familyType : null,
    familyValues: showFamily ? profile.familyValues : null,
    fatherOccupation: showFamily ? profile.fatherOccupation : null,
    motherOccupation: showFamily ? profile.motherOccupation : null,
    brothersCount: showFamily ? profile.brothersCount : null,
    sistersCount: showFamily ? profile.sistersCount : null,
    familyLocation: showFamily && showLocation ? profile.familyLocation : null,
    familyBackground: showFamily ? profile.familyBackground : null,

    // Lifestyle
    dietaryHabits: profile.dietaryHabits,
    smokingHabits: profile.smokingHabits,
    drinkingHabits: profile.drinkingHabits,
    exerciseHabits: profile.exerciseHabits,
    livingArrangement: profile.livingArrangement,
    hobbies: profile.hobbies || [],
    languages: profile.languages || [],
    lifestyleDescription: profile.lifestyleDescription,

    // Relationships
    educations: profile.educations.map((e) => ({
      id: e.id,
      educationLevel: e.educationLevel,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      institution: e.institution,
      country: e.country,
      graduationYear: e.graduationYear,
      isHighest: e.isHighest,
      additionalQualifications: e.additionalQualifications,
    })),

    photos: allowedPhotos,

    partnerPreference: profile.partnerPreference
      ? {
          minAge: profile.partnerPreference.minAge,
          maxAge: profile.partnerPreference.maxAge,
          minHeightCm: profile.partnerPreference.minHeightCm,
          maxHeightCm: profile.partnerPreference.maxHeightCm,
          maritalStatus: profile.partnerPreference.maritalStatus,
          educationLevels: profile.partnerPreference.educationLevels,
          professions: profile.partnerPreference.professions,
          countries: profile.partnerPreference.countries,
          religions: profile.partnerPreference.religions,
          additionalExpectations: profile.partnerPreference.additionalExpectations,
        }
      : null,

    isOwner,
    viewerCanAccess: true,
    profileVisibility,
    photoVisibility,
    completionPercentage: profile.completionPercentage,
    createdAt: profile.createdAt,
  };
}
