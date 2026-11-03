-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProfileFor" AS ENUM ('SELF', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'RELATIVE', 'FRIEND');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ANNULLED');

-- CreateEnum
CREATE TYPE "FamilyType" AS ENUM ('NUCLEAR', 'JOINT');

-- CreateEnum
CREATE TYPE "PhotoModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE');

-- CreateTable
CREATE TABLE "matrimonial_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "profile_for" "ProfileFor",
    "full_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "marital_status" "MaritalStatus",
    "country_of_residence" TEXT,
    "city_of_residence" TEXT,
    "nationality" TEXT,
    "preferred_language" TEXT,
    "height_cm" INTEGER,
    "weight_kg" INTEGER,
    "body_type" TEXT,
    "complexion" TEXT,
    "religion" TEXT,
    "religious_practice" TEXT,
    "community_ethnicity" TEXT,
    "disability_info" TEXT,
    "about_me" TEXT,
    "employment_status" TEXT,
    "profession" TEXT,
    "job_title" TEXT,
    "industry" TEXT,
    "employer" TEXT,
    "income_currency" TEXT DEFAULT 'USD',
    "annual_income_range" TEXT,
    "work_location" TEXT,
    "career_description" TEXT,
    "family_type" "FamilyType",
    "family_values" TEXT,
    "father_occupation" TEXT,
    "mother_occupation" TEXT,
    "brothers_count" INTEGER NOT NULL DEFAULT 0,
    "sisters_count" INTEGER NOT NULL DEFAULT 0,
    "brothers_married_count" INTEGER NOT NULL DEFAULT 0,
    "sisters_married_count" INTEGER NOT NULL DEFAULT 0,
    "family_location" TEXT,
    "family_background" TEXT,
    "dietary_habits" TEXT,
    "smoking_habits" TEXT,
    "drinking_habits" TEXT,
    "exercise_habits" TEXT,
    "living_arrangement" TEXT,
    "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifestyle_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matrimonial_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_educations" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "education_level" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field_of_study" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "additional_qualifications" TEXT,
    "is_highest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "moderation_status" "PhotoModerationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "min_height_cm" INTEGER,
    "max_height_cm" INTEGER,
    "marital_status" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education_levels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "professions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nationalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "religions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "family_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifestyles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additional_expectations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_privacy_settings" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'MEMBERS_ONLY',
    "photo_visibility" "ProfileVisibility" NOT NULL DEFAULT 'MEMBERS_ONLY',
    "show_date_of_birth" BOOLEAN NOT NULL DEFAULT false,
    "show_contact_info" BOOLEAN NOT NULL DEFAULT false,
    "show_income" BOOLEAN NOT NULL DEFAULT false,
    "show_employer" BOOLEAN NOT NULL DEFAULT false,
    "show_family_details" BOOLEAN NOT NULL DEFAULT true,
    "show_location" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matrimonial_profiles_user_id_key" ON "matrimonial_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "matrimonial_profiles_slug_key" ON "matrimonial_profiles"("slug");

-- CreateIndex
CREATE INDEX "matrimonial_profiles_user_id_idx" ON "matrimonial_profiles"("user_id");

-- CreateIndex
CREATE INDEX "matrimonial_profiles_slug_idx" ON "matrimonial_profiles"("slug");

-- CreateIndex
CREATE INDEX "matrimonial_profiles_gender_marital_status_religion_idx" ON "matrimonial_profiles"("gender", "marital_status", "religion");

-- CreateIndex
CREATE INDEX "profile_educations_profile_id_idx" ON "profile_educations"("profile_id");

-- CreateIndex
CREATE INDEX "profile_photos_profile_id_idx" ON "profile_photos"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_preferences_profile_id_key" ON "partner_preferences"("profile_id");

-- CreateIndex
CREATE INDEX "partner_preferences_profile_id_idx" ON "partner_preferences"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_privacy_settings_profile_id_key" ON "profile_privacy_settings"("profile_id");

-- CreateIndex
CREATE INDEX "profile_privacy_settings_profile_id_idx" ON "profile_privacy_settings"("profile_id");

-- AddForeignKey
ALTER TABLE "matrimonial_profiles" ADD CONSTRAINT "matrimonial_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_educations" ADD CONSTRAINT "profile_educations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
