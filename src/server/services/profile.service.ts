import "server-only";
import { db } from "@/server/db";
import { calculateProfileCompletion } from "./profile-completion.service";
import {
  redactProfileForViewer,
  type CompleteProfile,
  type RedactedPublicProfile,
} from "@/server/utils/privacy";
import {
  basicInfoSchema,
  personalDetailsSchema,
  educationListSchema,
  careerInfoSchema,
  familyInfoSchema,
  lifestyleInfoSchema,
  partnerPreferenceSchema,
  privacySettingsSchema,
  type BasicInfoInput,
  type PersonalDetailsInput,
  type SingleEducationInput,
  type CareerInfoInput,
  type FamilyInfoInput,
  type LifestyleInfoInput,
  type PartnerPreferenceInput,
  type PrivacySettingsInput,
} from "@/lib/validations/profile";
import { cloudinaryService } from "./cloudinary.service";

function generateSafeSlug(name: string, userId: string): string {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = userId.substring(userId.length - 6);
  return `${sanitized || "member"}-${suffix}`;
}

export const profileService = {
  /**
   * Get or initialize a matrimonial profile for an authenticated user.
   */
  async getOrCreateProfile(userId: string): Promise<CompleteProfile> {
    const existing = await db.matrimonialProfile.findUnique({
      where: { userId },
      include: {
        educations: { orderBy: { graduationYear: "desc" } },
        photos: { orderBy: { orderIndex: "asc" } },
        partnerPreference: true,
        privacySettings: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (existing) {
      return existing as CompleteProfile;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      throw new Error("User record not found");
    }

    const slug = generateSafeSlug(user.name, userId);

    // Create profile, default privacy settings, and empty partner preferences in a transaction
    const newProfile = await db.$transaction(async (tx) => {
      const profile = await tx.matrimonialProfile.create({
        data: {
          userId,
          slug,
          fullName: user.name,
          onboardingStatus: "NOT_STARTED",
          onboardingStep: 1,
          completionPercentage: 0,
        },
      });

      await tx.profilePrivacySettings.create({
        data: {
          profileId: profile.id,
          profileVisibility: "MEMBERS_ONLY",
          photoVisibility: "MEMBERS_ONLY",
          showDateOfBirth: false,
          showContactInfo: false,
          showIncome: false,
          showEmployer: false,
          showFamilyDetails: true,
          showLocation: true,
        },
      });

      await tx.partnerPreference.create({
        data: {
          profileId: profile.id,
          minAge: 18,
          maxAge: 40,
        },
      });

      return tx.matrimonialProfile.findUnique({
        where: { id: profile.id },
        include: {
          educations: { orderBy: { graduationYear: "desc" } },
          photos: { orderBy: { orderIndex: "asc" } },
          partnerPreference: true,
          privacySettings: true,
          user: { select: { name: true, email: true } },
        },
      });
    });

    return newProfile as CompleteProfile;
  },

  /**
   * Fetch complete profile by user ID.
   */
  async getProfileByUserId(userId: string): Promise<CompleteProfile | null> {
    const profile = await db.matrimonialProfile.findUnique({
      where: { userId },
      include: {
        educations: { orderBy: { graduationYear: "desc" } },
        photos: { orderBy: { orderIndex: "asc" } },
        partnerPreference: true,
        privacySettings: true,
        user: { select: { name: true, email: true } },
      },
    });

    return profile as CompleteProfile | null;
  },

  /**
   * Fetch profile by safe slug with privacy redaction applied.
   */
  async getProfileBySlug(
    slug: string,
    viewerUserId: string | null
  ): Promise<RedactedPublicProfile | null> {
    const profile = await db.matrimonialProfile.findUnique({
      where: { slug },
      include: {
        educations: { orderBy: { graduationYear: "desc" } },
        photos: { orderBy: { orderIndex: "asc" } },
        partnerPreference: true,
        privacySettings: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!profile) return null;

    const viewerIsMember = Boolean(viewerUserId);
    return redactProfileForViewer(
      profile as CompleteProfile,
      viewerUserId,
      viewerIsMember
    );
  },

  /**
   * Recalculates and persists profile completion and onboarding status.
   */
  async refreshCompletion(profileId: string): Promise<number> {
    const profile = await db.matrimonialProfile.findUnique({
      where: { id: profileId },
      include: {
        educations: true,
        photos: true,
        partnerPreference: true,
      },
    });

    if (!profile) return 0;

    const result = calculateProfileCompletion(profile);

    await db.matrimonialProfile.update({
      where: { id: profileId },
      data: {
        completionPercentage: result.completionPercentage,
        onboardingStatus: result.status,
      },
    });

    return result.completionPercentage;
  },

  /**
   * Step 1: Save Basic Information
   */
  async saveBasicInfo(userId: string, input: BasicInfoInput) {
    const valid = basicInfoSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.matrimonialProfile.update({
      where: { id: profile.id },
      data: {
        profileFor: valid.profileFor,
        fullName: valid.fullName,
        dateOfBirth: new Date(valid.dateOfBirth),
        gender: valid.gender,
        maritalStatus: valid.maritalStatus,
        countryOfResidence: valid.countryOfResidence,
        cityOfResidence: valid.cityOfResidence,
        nationality: valid.nationality,
        preferredLanguage: valid.preferredLanguage,
        onboardingStep: Math.max(profile.onboardingStep, 2),
      },
    });

    await this.refreshCompletion(profile.id);
    return updated;
  },

  /**
   * Step 2: Save Personal Details
   */
  async savePersonalDetails(userId: string, input: PersonalDetailsInput) {
    const valid = personalDetailsSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.matrimonialProfile.update({
      where: { id: profile.id },
      data: {
        heightCm: valid.heightCm,
        weightKg: valid.weightKg,
        bodyType: valid.bodyType,
        complexion: valid.complexion,
        religion: valid.religion,
        religiousPractice: valid.religiousPractice,
        communityEthnicity: valid.communityEthnicity,
        disabilityInfo: valid.disabilityInfo,
        aboutMe: valid.aboutMe,
        onboardingStep: Math.max(profile.onboardingStep, 3),
      },
    });

    await this.refreshCompletion(profile.id);
    return updated;
  },

  /**
   * Step 3: Save Education Records
   */
  async saveEducations(userId: string, input: { educations: SingleEducationInput[] }) {
    const valid = educationListSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    await db.$transaction(async (tx) => {
      // Remove existing educations and replace with new set
      await tx.profileEducation.deleteMany({
        where: { profileId: profile.id },
      });

      for (let i = 0; i < valid.educations.length; i++) {
        const edu = valid.educations[i];
        await tx.profileEducation.create({
          data: {
            profileId: profile.id,
            educationLevel: edu.educationLevel,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            institution: edu.institution,
            country: edu.country,
            graduationYear: edu.graduationYear,
            additionalQualifications: edu.additionalQualifications,
            isHighest: edu.isHighest || i === 0,
          },
        });
      }

      await tx.matrimonialProfile.update({
        where: { id: profile.id },
        data: {
          onboardingStep: Math.max(profile.onboardingStep, 4),
        },
      });
    });

    await this.refreshCompletion(profile.id);
    return this.getProfileByUserId(userId);
  },

  /**
   * Step 4: Save Career Information
   */
  async saveCareerInfo(userId: string, input: CareerInfoInput) {
    const valid = careerInfoSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.matrimonialProfile.update({
      where: { id: profile.id },
      data: {
        employmentStatus: valid.employmentStatus,
        profession: valid.profession,
        jobTitle: valid.jobTitle,
        industry: valid.industry,
        employer: valid.employer,
        incomeCurrency: valid.incomeCurrency,
        annualIncomeRange: valid.annualIncomeRange,
        workLocation: valid.workLocation,
        careerDescription: valid.careerDescription,
        onboardingStep: Math.max(profile.onboardingStep, 5),
      },
    });

    await this.refreshCompletion(profile.id);
    return updated;
  },

  /**
   * Step 5: Save Family Information
   */
  async saveFamilyInfo(userId: string, input: FamilyInfoInput) {
    const valid = familyInfoSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.matrimonialProfile.update({
      where: { id: profile.id },
      data: {
        familyType: valid.familyType,
        familyValues: valid.familyValues,
        fatherOccupation: valid.fatherOccupation,
        motherOccupation: valid.motherOccupation,
        brothersCount: valid.brothersCount,
        sistersCount: valid.sistersCount,
        brothersMarriedCount: valid.brothersMarriedCount || 0,
        sistersMarriedCount: valid.sistersMarriedCount || 0,
        familyLocation: valid.familyLocation,
        familyBackground: valid.familyBackground,
        onboardingStep: Math.max(profile.onboardingStep, 6),
      },
    });

    await this.refreshCompletion(profile.id);
    return updated;
  },

  /**
   * Step 6: Save Lifestyle Information
   */
  async saveLifestyleInfo(userId: string, input: LifestyleInfoInput) {
    const valid = lifestyleInfoSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.matrimonialProfile.update({
      where: { id: profile.id },
      data: {
        dietaryHabits: valid.dietaryHabits,
        smokingHabits: valid.smokingHabits,
        drinkingHabits: valid.drinkingHabits,
        exerciseHabits: valid.exerciseHabits,
        livingArrangement: valid.livingArrangement,
        hobbies: valid.hobbies,
        languages: valid.languages,
        lifestyleDescription: valid.lifestyleDescription,
        onboardingStep: Math.max(profile.onboardingStep, 7),
      },
    });

    await this.refreshCompletion(profile.id);
    return updated;
  },

  /**
   * Step 7: Save Partner Preferences
   */
  async savePartnerPreferences(userId: string, input: PartnerPreferenceInput) {
    const valid = partnerPreferenceSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    await db.partnerPreference.upsert({
      where: { profileId: profile.id },
      update: {
        minAge: valid.minAge,
        maxAge: valid.maxAge,
        minHeightCm: valid.minHeightCm,
        maxHeightCm: valid.maxHeightCm,
        maritalStatus: valid.maritalStatus,
        educationLevels: valid.educationLevels,
        professions: valid.professions,
        countries: valid.countries,
        cities: valid.cities,
        nationalities: valid.nationalities,
        religions: valid.religions,
        familyTypes: valid.familyTypes,
        lifestyles: valid.lifestyles,
        additionalExpectations: valid.additionalExpectations,
      },
      create: {
        profileId: profile.id,
        minAge: valid.minAge,
        maxAge: valid.maxAge,
        minHeightCm: valid.minHeightCm,
        maxHeightCm: valid.maxHeightCm,
        maritalStatus: valid.maritalStatus,
        educationLevels: valid.educationLevels,
        professions: valid.professions,
        countries: valid.countries,
        cities: valid.cities,
        nationalities: valid.nationalities,
        religions: valid.religions,
        familyTypes: valid.familyTypes,
        lifestyles: valid.lifestyles,
        additionalExpectations: valid.additionalExpectations,
      },
    });

    await this.refreshCompletion(profile.id);
    return this.getProfileByUserId(userId);
  },

  /**
   * Save Privacy & Visibility Settings
   */
  async savePrivacySettings(userId: string, input: PrivacySettingsInput) {
    const valid = privacySettingsSchema.parse(input);
    const profile = await this.getOrCreateProfile(userId);

    const updated = await db.profilePrivacySettings.upsert({
      where: { profileId: profile.id },
      update: {
        profileVisibility: valid.profileVisibility,
        photoVisibility: valid.photoVisibility,
        showDateOfBirth: valid.showDateOfBirth,
        showContactInfo: valid.showContactInfo,
        showIncome: valid.showIncome,
        showEmployer: valid.showEmployer,
        showFamilyDetails: valid.showFamilyDetails,
        showLocation: valid.showLocation,
      },
      create: {
        profileId: profile.id,
        profileVisibility: valid.profileVisibility,
        photoVisibility: valid.photoVisibility,
        showDateOfBirth: valid.showDateOfBirth,
        showContactInfo: valid.showContactInfo,
        showIncome: valid.showIncome,
        showEmployer: valid.showEmployer,
        showFamilyDetails: valid.showFamilyDetails,
        showLocation: valid.showLocation,
      },
    });

    return updated;
  },

  /**
   * Upload and register a new profile photo.
   */
  async addPhoto(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string
  ) {
    const profile = await this.getOrCreateProfile(userId);

    // Upload to Cloudinary (or mock storage if dev without keys)
    const uploadRes = await cloudinaryService.uploadBuffer(fileBuffer, mimeType, userId);

    // Count existing photos to determine primary flag and order
    const existingCount = await db.profilePhoto.count({
      where: { profileId: profile.id },
    });

    const isPrimary = existingCount === 0;

    const photo = await db.profilePhoto.create({
      data: {
        profileId: profile.id,
        cloudinaryPublicId: uploadRes.publicId,
        secureUrl: uploadRes.secureUrl,
        isPrimary,
        orderIndex: existingCount,
        moderationStatus: "APPROVED", // Auto-approved for verified owner preview
      },
    });

    await this.refreshCompletion(profile.id);
    return photo;
  },

  /**
   * Delete a profile photo with ownership check.
   */
  async deletePhoto(userId: string, photoId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const photo = await db.profilePhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.profileId !== profile.id) {
      throw new Error("Photo not found or you do not have permission to delete it.");
    }

    // Delete asset from Cloudinary
    await cloudinaryService.deleteImage(photo.cloudinaryPublicId);

    // Delete record from DB
    await db.profilePhoto.delete({
      where: { id: photoId },
    });

    // If the deleted photo was primary, promote the next available photo
    if (photo.isPrimary) {
      const nextPhoto = await db.profilePhoto.findFirst({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });

      if (nextPhoto) {
        await db.profilePhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    await this.refreshCompletion(profile.id);
    return true;
  },

  /**
   * Set a photo as primary profile photo.
   */
  async setPrimaryPhoto(userId: string, photoId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const targetPhoto = await db.profilePhoto.findUnique({
      where: { id: photoId },
    });

    if (!targetPhoto || targetPhoto.profileId !== profile.id) {
      throw new Error("Photo not found or you do not have permission to modify it.");
    }

    await db.$transaction([
      db.profilePhoto.updateMany({
        where: { profileId: profile.id },
        data: { isPrimary: false },
      }),
      db.profilePhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
    ]);

    return true;
  },

  /**
   * Reorder gallery photos.
   */
  async reorderPhotos(userId: string, photoIds: string[]) {
    const profile = await this.getOrCreateProfile(userId);

    await db.$transaction(
      photoIds.map((id, index) =>
        db.profilePhoto.updateMany({
          where: { id, profileId: profile.id },
          data: { orderIndex: index },
        })
      )
    );

    return true;
  },
};

