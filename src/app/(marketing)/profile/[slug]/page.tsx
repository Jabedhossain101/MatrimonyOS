import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import {
  User,
  Heart,
  GraduationCap,
  Briefcase,
  Users as FamilyIcon,
  Smile,
  Sliders,
  MapPin,
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
} from "lucide-react";

export const instant = false;

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const profile = await profileService.getProfileBySlug(slug, user?.id || null);

  if (!profile || !profile.viewerCanAccess) {
    return {
      title: "Matrimonial Profile | MatrimonyOS",
      description: "Discreet matrimonial matchmaking profile on MatrimonyOS.",
    };
  }

  return {
    title: `${profile.fullName} | Matrimonial Profile | MatrimonyOS`,
    description: `${profile.age ? `${profile.age} yrs • ` : ""}${profile.profession || "Professional"} in ${profile.countryOfResidence || "Global"}. Verified matrimonial profile.`,
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const profile = await profileService.getProfileBySlug(slug, currentUser?.id || null);

  if (!profile) {
    notFound();
  }

  // Handle case where profile is members-only and user is unauthenticated
  if (!profile.viewerCanAccess) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14243A] text-[#B89A63] shadow-lg">
            <Lock className="h-8 w-8" />
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#14243A]">
            Members-Only Matrimonial Profile
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#777777]">
            This profile is protected under strict privacy controls and is visible exclusively to registered and verified MatrimonyOS members.
          </p>

          <div className="mt-8 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm text-left text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-[#14243A]">
              <ShieldCheck className="h-4 w-4 text-[#B89A63]" />
              <span>Discreet Profile Summary</span>
            </div>
            <p className="text-[#777777]">
              Candidate: <strong className="text-[#14243A]">{profile.gender === "MALE" ? "Groom" : "Bride"}</strong> &bull; Location: <strong className="text-[#14243A]">{profile.countryOfResidence || "Global"}</strong> &bull; Religion: <strong className="text-[#14243A]">{profile.religion || "Specified"}</strong>
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/login?callbackUrl=/profile/${encodeURIComponent(slug)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#14243A] px-6 py-3 text-xs font-semibold text-white shadow transition hover:bg-[#B89A63]"
            >
              <span>Sign In to View Full Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-6 py-3 text-xs font-semibold text-[#14243A] shadow-sm transition hover:border-[#B89A63]"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryPhoto = profile.photos?.find((p) => p.isPrimary) || profile.photos?.[0];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333] pb-16">
      {/* Owner Preview Banner */}
      {profile.isOwner && (
        <div className="border-b border-[#B89A63]/40 bg-[#14243A] px-4 py-3 text-center text-xs text-[#FAF8F3]">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <Eye className="h-4 w-4 text-[#B89A63]" />
            <span>
              <strong>Owner Preview:</strong> You are viewing your public profile exactly as other verified members see it.
            </span>
            <Link
              href="/dashboard/profile/edit"
              className="ml-3 font-semibold text-[#B89A63] underline hover:text-white"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      )}

      {/* Profile Header Hero */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-sm">
          <div className="h-44 bg-gradient-to-r from-[#14243A] via-[#0B1728] to-[#14243A]" />
          <div className="relative px-6 pb-8 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-20 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-4 border-white bg-[#FAF8F3] shadow-lg">
                  {primaryPhoto ? (
                    <Image
                      src={primaryPhoto.secureUrl}
                      alt={profile.fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#EEE8DC] text-[#14243A]">
                      <User className="h-16 w-16 text-[#B89A63]" />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center sm:mt-0 sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
                      {profile.fullName}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#777777]">
                    {profile.age ? `${profile.age} years old` : ""}{" "}
                    {profile.maritalStatus ? `• ${profile.maritalStatus.replace(/_/g, " ")}` : ""}{" "}
                    {profile.religion ? `• ${profile.religion}` : ""}
                  </p>

                  <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-xs font-semibold text-[#14243A]">
                    <MapPin className="h-3.5 w-3.5 text-[#B89A63]" />
                    <span>
                      {profile.cityOfResidence ? `${profile.cityOfResidence}, ` : ""}
                      {profile.countryOfResidence || "Location not disclosed"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-0">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-4 py-2 text-xs font-semibold text-[#14243A] hover:bg-white"
                >
                  Dashboard
                </Link>
                {!profile.isOwner && (
                  <button
                    type="button"
                    disabled
                    title="Mutual interest exchange will be activated in Phase 5"
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[#14243A] px-5 py-2 text-xs font-semibold text-white opacity-90 shadow"
                  >
                    <Heart className="h-4 w-4 text-[#B89A63]" />
                    <span>Send Interest (Phase 5)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Preview if multiple photos */}
        {profile.photos && profile.photos.length > 1 && (
          <div className="mt-6 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <h2 className="font-serif text-base font-bold text-[#14243A] mb-4">
              Photo Gallery ({profile.photos.length} Verified Photos)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#E8E2D5] bg-[#FAF8F3]"
                >
                  <Image
                    src={photo.secureUrl}
                    alt="Gallery photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {photo.isPrimary && (
                    <div className="absolute bottom-2 left-2 rounded bg-[#14243A]/90 px-2 py-0.5 text-[9px] font-bold text-[#B89A63]">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Profile Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Left Column: Personal, Education, Career */}
          <div className="space-y-6 md:col-span-2">
            {/* About Me */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#14243A] border-b border-[#E8E2D5] pb-3">
                <Heart className="h-5 w-5 text-[#B89A63]" />
                About Candidate & Outlook
              </h2>
              <p className="mt-4 text-xs leading-relaxed text-[#555555]">
                {profile.aboutMe || "No detailed personal bio provided."}
              </p>
            </div>

            {/* Education History */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#14243A] border-b border-[#E8E2D5] pb-3">
                <GraduationCap className="h-5 w-5 text-[#B89A63]" />
                Education & Credentials
              </h2>
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
                          Graduated {edu.graduationYear}
                        </span>
                      </div>
                      <p className="mt-1 text-[#555555]">
                        {edu.fieldOfStudy} &bull; {edu.institution}, {edu.country}
                      </p>
                      {edu.additionalQualifications && (
                        <p className="mt-1 text-[11px] text-[#777777]">
                          Honours: {edu.additionalQualifications}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-[#777777]">No education records listed.</p>
                )}
              </div>
            </div>

            {/* Career & Profession */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#14243A] border-b border-[#E8E2D5] pb-3">
                <Briefcase className="h-5 w-5 text-[#B89A63]" />
                Career & Employment
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-[#E8E2D5]/60 p-3 bg-[#FAF8F3]">
                  <span className="text-[#777777]">Profession</span>
                  <p className="font-bold text-[#14243A] mt-0.5">{profile.profession || "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-[#E8E2D5]/60 p-3 bg-[#FAF8F3]">
                  <span className="text-[#777777]">Employment Status</span>
                  <p className="font-bold text-[#14243A] mt-0.5">{profile.employmentStatus || "Not specified"}</p>
                </div>
                {profile.jobTitle && (
                  <div className="rounded-xl border border-[#E8E2D5]/60 p-3 bg-[#FAF8F3]">
                    <span className="text-[#777777]">Designation / Job Title</span>
                    <p className="font-bold text-[#14243A] mt-0.5">{profile.jobTitle}</p>
                  </div>
                )}
                {profile.industry && (
                  <div className="rounded-xl border border-[#E8E2D5]/60 p-3 bg-[#FAF8F3]">
                    <span className="text-[#777777]">Industry</span>
                    <p className="font-bold text-[#14243A] mt-0.5">{profile.industry}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Expectations */}
            {profile.partnerPreference && (
              <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#14243A] border-b border-[#E8E2D5] pb-3">
                  <Sliders className="h-5 w-5 text-[#B89A63]" />
                  Partner Expectations
                </h2>
                <div className="mt-4 space-y-3 text-xs">
                  {(profile.partnerPreference.minAge || profile.partnerPreference.maxAge) && (
                    <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                      <span className="text-[#777777]">Preferred Age Range</span>
                      <span className="font-semibold text-[#14243A]">
                        {profile.partnerPreference.minAge || 18} - {profile.partnerPreference.maxAge || 60} years
                      </span>
                    </div>
                  )}
                  {profile.partnerPreference.religions && profile.partnerPreference.religions.length > 0 && (
                    <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                      <span className="text-[#777777]">Preferred Religion</span>
                      <span className="font-semibold text-[#14243A]">
                        {profile.partnerPreference.religions.join(", ")}
                      </span>
                    </div>
                  )}
                  {profile.partnerPreference.countries && profile.partnerPreference.countries.length > 0 && (
                    <div className="flex justify-between border-b border-[#FAF8F3] pb-2">
                      <span className="text-[#777777]">Preferred Country</span>
                      <span className="font-semibold text-[#14243A]">
                        {profile.partnerPreference.countries.join(", ")}
                      </span>
                    </div>
                  )}
                  {profile.partnerPreference.additionalExpectations && (
                    <div className="pt-2">
                      <span className="text-[#777777] block mb-1">Additional Expectations:</span>
                      <p className="text-[#555555] leading-relaxed italic bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E2D5]/70">
                        &quot;{profile.partnerPreference.additionalExpectations}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quick Attributes, Family, Lifestyle */}
          <div className="space-y-6 md:col-span-1">
            {/* Attributes Card */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-bold text-[#14243A] border-b border-[#E8E2D5] pb-2">
                Personal Overview
              </h3>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Height</span>
                  <span className="font-semibold text-[#14243A]">
                    {profile.heightCm ? `${profile.heightCm} cm` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Religion</span>
                  <span className="font-semibold text-[#14243A]">{profile.religion || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Ethnicity</span>
                  <span className="font-semibold text-[#14243A]">{profile.communityEthnicity || "South Asian"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Languages</span>
                  <span className="font-semibold text-[#14243A]">{profile.languages?.join(", ") || "English"}</span>
                </div>
              </div>
            </div>

            {/* Family Structure */}
            {profile.familyType && (
              <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A] border-b border-[#E8E2D5] pb-2">
                  <FamilyIcon className="h-4 w-4 text-[#B89A63]" />
                  Family Background
                </h3>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Family Type</span>
                    <span className="font-semibold text-[#14243A]">{profile.familyType}</span>
                  </div>
                  {profile.familyValues && (
                    <div className="flex justify-between">
                      <span className="text-[#777777]">Values</span>
                      <span className="font-semibold text-[#14243A]">{profile.familyValues}</span>
                    </div>
                  )}
                  {profile.brothersCount !== null && profile.brothersCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-[#777777]">Siblings</span>
                      <span className="font-semibold text-[#14243A]">
                        {profile.brothersCount} Brother(s), {profile.sistersCount} Sister(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#14243A] border-b border-[#E8E2D5] pb-2">
                <Smile className="h-4 w-4 text-[#B89A63]" />
                Lifestyle & Habits
              </h3>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Diet</span>
                  <span className="font-semibold text-[#14243A]">{profile.dietaryHabits || "Halal"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Smoking</span>
                  <span className="font-semibold text-[#14243A]">{profile.smokingHabits || "Non-Smoker"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Drinking</span>
                  <span className="font-semibold text-[#14243A]">{profile.drinkingHabits || "Non-Drinker"}</span>
                </div>
              </div>
            </div>

            {/* Discreet Trust Notice */}
            <div className="rounded-2xl border border-[#B89A63]/30 bg-[#FAF8F3] p-4 text-[11px] text-[#777777] leading-relaxed">
              <span className="font-bold text-[#14243A] block mb-1">
                Privacy Protection Active
              </span>
              Direct contact details, financial employer verifications, and family contact numbers are safeguarded under MatrimonyOS family privacy protocols.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

