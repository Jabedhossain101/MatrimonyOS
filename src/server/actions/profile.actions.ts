"use server";

import { requireAuthenticatedUser, getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { cloudinaryService } from "@/server/services/cloudinary.service";
import {
  type BasicInfoInput,
  type PersonalDetailsInput,
  type SingleEducationInput,
  type CareerInfoInput,
  type FamilyInfoInput,
  type LifestyleInfoInput,
  type PartnerPreferenceInput,
  type PrivacySettingsInput,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get or initialize profile for the current user.
 */
export async function getOrCreateProfileAction(): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    return { success: true, data: profile };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load profile",
    };
  }
}

/**
 * Save Step 1: Basic Information
 */
export async function saveBasicInfoAction(
  data: BasicInfoInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.saveBasicInfo(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save basic information",
    };
  }
}

/**
 * Save Step 2: Personal Details
 */
export async function savePersonalDetailsAction(
  data: PersonalDetailsInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.savePersonalDetails(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save personal details",
    };
  }
}

/**
 * Save Step 3: Education Records
 */
export async function saveEducationsAction(data: {
  educations: SingleEducationInput[];
}): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.saveEducations(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save education records",
    };
  }
}

/**
 * Save Step 4: Career Information
 */
export async function saveCareerInfoAction(
  data: CareerInfoInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.saveCareerInfo(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save career information",
    };
  }
}

/**
 * Save Step 5: Family Information
 */
export async function saveFamilyInfoAction(
  data: FamilyInfoInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.saveFamilyInfo(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save family information",
    };
  }
}

/**
 * Save Step 6: Lifestyle Information
 */
export async function saveLifestyleInfoAction(
  data: LifestyleInfoInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.saveLifestyleInfo(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save lifestyle information",
    };
  }
}

/**
 * Save Step 7: Partner Preferences
 */
export async function savePartnerPreferencesAction(
  data: PartnerPreferenceInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.savePartnerPreferences(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/preferences");
    revalidatePath("/onboarding");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save partner preferences",
    };
  }
}

/**
 * Save Privacy Settings
 */
export async function savePrivacySettingsAction(
  data: PrivacySettingsInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const updated = await profileService.savePrivacySettings(user.id, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/privacy");
    return { success: true, data: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update privacy settings",
    };
  }
}

/**
 * Upload Profile Photo via FormData
 */
export async function uploadProfilePhotoAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPG, PNG, and WebP are allowed.",
      };
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return {
        success: false,
        error: "Image exceeds maximum allowed size of 5MB.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const photo = await profileService.addPhoto(user.id, buffer, file.type);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/photos");
    return { success: true, data: photo };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload photo",
    };
  }
}

/**
 * Delete Profile Photo
 */
export async function deleteProfilePhotoAction(
  photoId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    await profileService.deletePhoto(user.id, photoId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/photos");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete photo",
    };
  }
}

/**
 * Set Primary Profile Photo
 */
export async function setPrimaryPhotoAction(
  photoId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    await profileService.setPrimaryPhoto(user.id, photoId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/photos");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to set primary photo",
    };
  }
}

/**
 * Reorder Gallery Photos
 */
export async function reorderPhotosAction(
  photoIds: string[]
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    await profileService.reorderPhotos(user.id, photoIds);
    revalidatePath("/dashboard/profile/photos");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder photos",
    };
  }
}

/**
 * Get Public Profile by Slug with privacy applied
 */
export async function getPublicProfileBySlugAction(
  slug: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const profile = await profileService.getProfileBySlug(
      slug,
      user?.id || null
    );

    if (!profile) {
      return { success: false, error: "Profile not found or is set to private." };
    }

    return { success: true, data: profile };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load public profile",
    };
  }
}

/**
 * Generate Cloudinary signed parameters for direct-to-cloud browser uploads.
 */
export async function getCloudinaryUploadSignatureAction(): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const signatureParams = cloudinaryService.generateUploadSignature(user.id);
    return { success: true, data: signatureParams };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Cloudinary signing failed. Using server-side proxy upload.",
    };
  }
}

