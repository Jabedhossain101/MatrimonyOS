import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { calculateAge } from "@/lib/validations/profile";
import {
  User,
  Heart,
  GraduationCap,
  Briefcase,
  Users as FamilyIcon,
  Smile,
  Sliders,
  Edit3,
  ExternalLink,
  ChevronLeft,
  Lock,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "My Matrimonial Profile | MatrimonyOS",
  description: "View and review your complete profile.",
};

export default async function ProfileViewPage() {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    redirect("/login?callbackUrl=/dashboard/profile");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const primaryPhoto =
    profile.photos?.find((p) => p.isPrimary) || profile.photos?.[0];

  const age = profile.dateOfBirth
    ? calculateAge(new Date(profile.dateOfBirth))
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#777777] transition hover:text-[#14243A]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${profile.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E2D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14243A] hover:border-[#B89A63]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Preview</span>
            </Link>
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#14243A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#B89A63]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Hero Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-sm">
          <div className="h-36 bg-gradient-to-r from-[#14243A] via-[#0B1728] to-[#14243A]" />
          <div className="relative px-6 pb-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-[#FAF8F3] shadow-md">
                  {primaryPhoto ? (
                    <Image
                      src={primaryPhoto.secureUrl}
                      alt={profile.fullName || user.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#EEE8DC] text-[#14243A]">
                      <User className="h-12 w-12 text-[#B89A63]" />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center sm:mt-0 sm:text-left">
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A]">
                    {profile.fullName || user.name}
                  </h1>
                  <p className="mt-0.5 text-xs text-[#777777]">
                    {age ? `${age} years old` : "Age not specified"} &bull;{" "}
                    {profile.maritalStatus
                      ? profile.maritalStatus.replace(/_/g, " ")
                      : "Marital status not specified"}{" "}
                    &bull; {profile.religion || "Religion not specified"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[#14243A]">
                    {profile.cityOfResidence ? `${profile.cityOfResidence}, ` : ""}
                    {profile.countryOfResidence || "Location not specified"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-0">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Profile {profile.completionPercentage}% Complete
                </span>
                <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-semibold text-[#14243A] border border-[#E8E2D5]">
                  Visibility: {profile.privacySettings?.profileVisibility || "MEMBERS_ONLY"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Sections */}
        <div className="space-y-6">
          {/* Section: About Me */}
          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#14243A]">
                <Heart className="h-5 w-5 text-[#B89A63]" />
                About & Personal Introduction
              </h2>
              <Link
                href="/dashboard/profile/edit"
                className="text-xs font-semibold text-[#B89A63] hover:underline"
              >
                Edit &rarr;
              </Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#555555]">
              {profile.aboutMe || (
                <span className="italic text-[#777777]">
                  No personal bio provided yet. Click &quot;Edit&quot; to write an introduction.
                </span>
              )}
            </p>
          </div>

          {/* Section: Basic & Personal Attributes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <User className="h-4 w-4 text-[#B89A63]" />
                  Basic Information
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Profile For</span>
                  <span className="font-semibold text-[#14243A]">{profile.profileFor || "Self"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Gender</span>
                  <span className="font-semibold text-[#14243A]">{profile.gender || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Marital Status</span>
                  <span className="font-semibold text-[#14243A]">{profile.maritalStatus?.replace(/_/g, " ") || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Nationality</span>
                  <span className="font-semibold text-[#14243A]">{profile.nationality || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Preferred Language</span>
                  <span className="font-semibold text-[#14243A]">{profile.preferredLanguage || "Not set"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <Smile className="h-4 w-4 text-[#B89A63]" />
                  Personal Details
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Height</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.heightCm ? `${profile.heightCm} cm (${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}")` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Religion & Practice</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.religion || "Not set"} {profile.religiousPractice ? `(${profile.religiousPractice})` : ""}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Community / Ethnicity</span>
                  <span className="font-semibold text-[#14243A]">{profile.communityEthnicity || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Body Type & Complexion</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.bodyType || "Average"} &bull; {profile.complexion || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Disability Info</span>
                  <span className="font-semibold text-[#14243A]">{profile.disabilityInfo || "None"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Education & Career */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <GraduationCap className="h-4 w-4 text-[#B89A63]" />
                  Education History
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-4">
                {profile.educations && profile.educations.length > 0 ? (
                  profile.educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-2xl border border-[#E8E2D5]/70 bg-[#FAF8F3] p-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#14243A]">{edu.degree}</span>
                        <span className="rounded bg-[#EEE8DC] px-2 py-0.5 text-[10px] font-semibold text-[#777777]">
                          {edu.graduationYear}
                        </span>
                      </div>
                      <p className="mt-1 text-[#777777]">
                        {edu.fieldOfStudy} &bull; {edu.institution}, {edu.country}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-[#777777]">
                    No education records added yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <Briefcase className="h-4 w-4 text-[#B89A63]" />
                  Career & Employment
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Profession</span>
                  <span className="font-semibold text-[#14243A]">{profile.profession || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Job Title</span>
                  <span className="font-semibold text-[#14243A]">{profile.jobTitle || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Industry</span>
                  <span className="font-semibold text-[#14243A]">{profile.industry || "Not set"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Employer</span>
                  <span className="font-semibold text-[#14243A] flex items-center gap-1">
                    <Lock className="h-3 w-3 text-[#B89A63]" />
                    {profile.employer || "Private"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Annual Income</span>
                  <span className="font-semibold text-[#14243A] flex items-center gap-1">
                    <Lock className="h-3 w-3 text-[#B89A63]" />
                    {profile.annualIncomeRange || "Private"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Family & Lifestyle */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <FamilyIcon className="h-4 w-4 text-[#B89A63]" />
                  Family Background
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Family Type</span>
                  <span className="font-semibold text-[#14243A]">{profile.familyType || "Nuclear"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Family Values</span>
                  <span className="font-semibold text-[#14243A]">{profile.familyValues || "Moderate"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Siblings</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.brothersCount} Brother(s), {profile.sistersCount} Sister(s)
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Parents&apos; Occupation</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.fatherOccupation ? `Father: ${profile.fatherOccupation}` : "Father: Not set"}{" "}
                    &bull; {profile.motherOccupation ? `Mother: ${profile.motherOccupation}` : "Mother: Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
                  <Sliders className="h-4 w-4 text-[#B89A63]" />
                  Lifestyle & Habits
                </h3>
                <Link
                  href="/dashboard/profile/edit"
                  className="text-xs font-semibold text-[#B89A63] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Dietary Habit</span>
                  <span className="font-semibold text-[#14243A]">{profile.dietaryHabits || "Strictly Halal"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Smoking & Drinking</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.smokingHabits || "Non-Smoker"} &bull; {profile.drinkingHabits || "Non-Drinker"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Languages Known</span>
                  <span className="font-semibold text-[#14243A]">{profile.languages?.join(", ") || "English"}</span>
                </div>
                <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                  <span className="text-[#777777]">Hobbies & Interests</span>
                  <span className="font-semibold text-[#14243A]">{profile.hobbies?.join(", ") || "Reading, Travel"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

