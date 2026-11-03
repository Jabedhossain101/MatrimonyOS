import { z } from "zod";

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export const ProfileForEnum = z.enum([
  "SELF",
  "SON",
  "DAUGHTER",
  "BROTHER",
  "SISTER",
  "RELATIVE",
  "FRIEND",
]);

export const GenderEnum = z.enum(["MALE", "FEMALE"]);

export const MaritalStatusEnum = z.enum([
  "NEVER_MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "ANNULLED",
]);

export const FamilyTypeEnum = z.enum(["NUCLEAR", "JOINT"]);

export const ProfileVisibilityEnum = z.enum([
  "PUBLIC",
  "MEMBERS_ONLY",
  "PRIVATE",
]);

export const PhotoModerationStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

// -----------------------------------------------------------------------------
// Helper: Minimum Age 18 Validator
// -----------------------------------------------------------------------------

export function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function isValidAdultBirthDate(dateStr: string | Date): boolean {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return false;
  return calculateAge(date) >= 18;
}

// -----------------------------------------------------------------------------
// Step 1: Basic Information
// -----------------------------------------------------------------------------

export const basicInfoSchema = z.object({
  profileFor: ProfileForEnum,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => isValidAdultBirthDate(val),
      "You must be at least 18 years old to join MatrimonyOS"
    ),
  gender: GenderEnum,
  maritalStatus: MaritalStatusEnum,
  countryOfResidence: z
    .string()
    .min(2, "Country of residence is required")
    .max(100)
    .trim(),
  cityOfResidence: z
    .string()
    .min(2, "City of residence is required")
    .max(100)
    .trim(),
  nationality: z.string().min(2, "Nationality is required").max(100).trim(),
  preferredLanguage: z
    .string()
    .min(2, "Preferred language is required")
    .max(100)
    .trim(),
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;

// -----------------------------------------------------------------------------
// Step 2: Personal Details
// -----------------------------------------------------------------------------

export const personalDetailsSchema = z.object({
  heightCm: z.coerce
    .number()
    .int("Height must be a whole number")
    .min(120, "Height must be at least 120 cm (3'11\")")
    .max(240, "Height must be at most 240 cm (7'10\")"),
  weightKg: z.coerce
    .number()
    .int("Weight must be a whole number")
    .min(30, "Weight must be at least 30 kg")
    .max(250, "Weight must be at most 250 kg")
    .optional()
    .nullable(),
  bodyType: z.string().max(50).optional().nullable(),
  complexion: z.string().max(50).optional().nullable(),
  religion: z.string().min(2, "Religion is required").max(100).trim(),
  religiousPractice: z.string().max(100).optional().nullable(),
  communityEthnicity: z.string().max(100).optional().nullable(),
  disabilityInfo: z.string().max(250).optional().nullable(),
  aboutMe: z
    .string()
    .max(2000, "Personal introduction cannot exceed 2000 characters")
    .optional()
    .nullable(),
});

export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;

// -----------------------------------------------------------------------------
// Step 3: Education
// -----------------------------------------------------------------------------

export const singleEducationSchema = z.object({
  id: z.string().optional(),
  educationLevel: z.string().min(2, "Education level is required"),
  degree: z.string().min(2, "Degree name is required").max(150).trim(),
  fieldOfStudy: z.string().min(2, "Field of study is required").max(150).trim(),
  institution: z.string().min(2, "Institution is required").max(200).trim(),
  country: z.string().min(2, "Country of education is required").max(100).trim(),
  graduationYear: z.coerce
    .number()
    .int("Year must be a valid 4-digit number")
    .min(1960, "Year must be 1960 or later")
    .max(new Date().getFullYear() + 8, "Year cannot be more than 8 years in the future"),
  additionalQualifications: z.string().max(500).optional().nullable(),
  isHighest: z.boolean().default(false),
});

export const educationListSchema = z.object({
  educations: z
    .array(singleEducationSchema)
    .min(1, "Please provide at least one education record"),
});

export type SingleEducationInput = z.infer<typeof singleEducationSchema>;
export type EducationListInput = z.infer<typeof educationListSchema>;

// -----------------------------------------------------------------------------
// Step 4: Career & Professional Information
// -----------------------------------------------------------------------------

export const careerInfoSchema = z.object({
  employmentStatus: z.string().min(2, "Employment status is required"),
  profession: z.string().min(2, "Profession category is required").max(100).trim(),
  jobTitle: z.string().max(150).optional().nullable(),
  industry: z.string().max(150).optional().nullable(),
  employer: z.string().max(200).optional().nullable(),
  incomeCurrency: z.string().max(10).default("USD"),
  annualIncomeRange: z.string().max(100).optional().nullable(),
  workLocation: z.string().max(150).optional().nullable(),
  careerDescription: z.string().max(1000).optional().nullable(),
});

export type CareerInfoInput = z.infer<typeof careerInfoSchema>;

// -----------------------------------------------------------------------------
// Step 5: Family Information
// -----------------------------------------------------------------------------

export const familyInfoSchema = z.object({
  familyType: FamilyTypeEnum,
  familyValues: z.string().min(2, "Family values are required"),
  fatherOccupation: z.string().max(150).optional().nullable(),
  motherOccupation: z.string().max(150).optional().nullable(),
  brothersCount: z.coerce.number().int().min(0, "Count cannot be negative").max(20).default(0),
  sistersCount: z.coerce.number().int().min(0, "Count cannot be negative").max(20).default(0),
  brothersMarriedCount: z.coerce.number().int().min(0).max(20).optional().default(0),
  sistersMarriedCount: z.coerce.number().int().min(0).max(20).optional().default(0),
  familyLocation: z.string().max(150).optional().nullable(),
  familyBackground: z.string().max(2000).optional().nullable(),
});

export type FamilyInfoInput = z.infer<typeof familyInfoSchema>;

// -----------------------------------------------------------------------------
// Step 6: Lifestyle
// -----------------------------------------------------------------------------

export const lifestyleInfoSchema = z.object({
  dietaryHabits: z.string().min(2, "Dietary habit is required"),
  smokingHabits: z.string().min(2, "Smoking habit is required"),
  drinkingHabits: z.string().min(2, "Drinking habit is required"),
  exerciseHabits: z.string().max(100).optional().nullable(),
  livingArrangement: z.string().max(100).optional().nullable(),
  hobbies: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  lifestyleDescription: z.string().max(1000).optional().nullable(),
});

export type LifestyleInfoInput = z.infer<typeof lifestyleInfoSchema>;

// -----------------------------------------------------------------------------
// Step 7: Partner Preferences
// -----------------------------------------------------------------------------

export const partnerPreferenceSchema = z
  .object({
    minAge: z.coerce.number().int().min(18, "Minimum age is 18").max(80).optional().nullable(),
    maxAge: z.coerce.number().int().min(18, "Minimum age is 18").max(80).optional().nullable(),
    minHeightCm: z.coerce.number().int().min(120).max(240).optional().nullable(),
    maxHeightCm: z.coerce.number().int().min(120).max(240).optional().nullable(),
    maritalStatus: z.array(z.string()).default([]),
    educationLevels: z.array(z.string()).default([]),
    professions: z.array(z.string()).default([]),
    countries: z.array(z.string()).default([]),
    cities: z.array(z.string()).default([]),
    nationalities: z.array(z.string()).default([]),
    religions: z.array(z.string()).default([]),
    familyTypes: z.array(z.string()).default([]),
    lifestyles: z.array(z.string()).default([]),
    additionalExpectations: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.minAge && data.maxAge) {
        return data.minAge <= data.maxAge;
      }
      return true;
    },
    {
      message: "Minimum age cannot be greater than maximum age",
      path: ["maxAge"],
    }
  )
  .refine(
    (data) => {
      if (data.minHeightCm && data.maxHeightCm) {
        return data.minHeightCm <= data.maxHeightCm;
      }
      return true;
    },
    {
      message: "Minimum height cannot be greater than maximum height",
      path: ["maxHeightCm"],
    }
  );

export type PartnerPreferenceInput = z.infer<typeof partnerPreferenceSchema>;

// -----------------------------------------------------------------------------
// Privacy Settings
// -----------------------------------------------------------------------------

export const privacySettingsSchema = z.object({
  profileVisibility: ProfileVisibilityEnum.default("MEMBERS_ONLY"),
  photoVisibility: ProfileVisibilityEnum.default("MEMBERS_ONLY"),
  showDateOfBirth: z.boolean().default(false),
  showContactInfo: z.boolean().default(false),
  showIncome: z.boolean().default(false),
  showEmployer: z.boolean().default(false),
  showFamilyDetails: z.boolean().default(true),
  showLocation: z.boolean().default(true),
});

export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;

// -----------------------------------------------------------------------------
// Photo Upload Validation
// -----------------------------------------------------------------------------

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const photoUploadSchema = z.object({
  fileSize: z.number().max(MAX_PHOTO_SIZE_BYTES, "Image must not exceed 5MB"),
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Only JPG, PNG, and WebP images are allowed" }),
  }),
});

