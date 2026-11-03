import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { AppRole } from "@/lib/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  ShieldCheck,
  User,
  Shield,
  Crown,
  Clock,
  Sparkles,
  ArrowRight,
  Camera,
  Heart,
  Eye,
  Edit3,
  Lock,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Users as FamilyIcon,
  Smile,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { calculateProfileCompletion } from "@/server/services/profile-completion.service";
import { calculateAge } from "@/lib/validations/profile";

export const instant = false;

export const metadata = {
  title: "Member Dashboard | MatrimonyOS",
  description: "Discreet matrimonial command center.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const completionStats = calculateProfileCompletion(profile);

  const isAdmin =
    user.roles.includes(AppRole.ADMIN) ||
    user.roles.includes(AppRole.SUPER_ADMIN);
  const isSuperAdmin = user.roles.includes(AppRole.SUPER_ADMIN);

  const primaryPhoto =
    profile.photos?.find((p) => p.isPrimary) || profile.photos?.[0];

  const age = profile.dateOfBirth
    ? calculateAge(new Date(profile.dateOfBirth))
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Navigation Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 transition focus-visible:outline-none"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243A] font-serif text-xl font-bold text-[#B89A63] shadow-sm transition-transform duration-200 group-hover:scale-105">
              M
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#777777] uppercase">
                Member Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${profile.slug}`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg border border-[#E8E2D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63] hover:text-[#B89A63] sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Preview</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B89A63]/50 bg-[#EEE8DC] px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#B89A63] hover:text-white"
              >
                <Shield className="h-3.5 w-3.5 text-[#B89A63]" />
                <span className="hidden sm:inline">Admin Portal</span>
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1728] px-3 py-1.5 text-xs font-semibold text-[#FAF8F3] transition hover:bg-[#14243A]"
              >
                <Crown className="h-3.5 w-3.5 text-[#B89A63]" />
                <span className="hidden sm:inline">Super Admin</span>
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-3xl border border-[#E8E2D5] bg-gradient-to-r from-[#14243A] to-[#0B1728] p-6 text-[#FAF8F3] shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B89A63]/40 bg-[#14243A] px-3 py-1 text-xs font-medium text-[#FAF8F3]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B89A63]" />
                Authenticated Discreet Session
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#FAF8F3]">
                Assalamu Alaikum, {profile.fullName || user.name}
              </h1>
              <p className="mt-1 text-xs text-[#EEE8DC]/80">
                Welcome to your private matrimonial command center.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#EEE8DC]">
                Profile Status:{" "}
                <strong className="text-[#B89A63]">
                  {profile.onboardingStatus === "COMPLETED"
                    ? "Completed"
                    : "In Progress"}
                </strong>
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#EEE8DC]">
                Visibility:{" "}
                <strong className="text-emerald-400">
                  {profile.privacySettings?.profileVisibility || "MEMBERS_ONLY"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Onboarding Callout Banner if not completed */}
        {profile.onboardingStatus !== "COMPLETED" && (
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[#B89A63]/50 bg-gradient-to-r from-[#FAF8F3] to-[#EEE8DC] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B89A63] text-white shadow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#14243A]">
                  Complete Your Profile (Step {profile.onboardingStep} of 7)
                </h3>
                <p className="mt-0.5 text-xs text-[#777777]">
                  Your profile is {profile.completionPercentage}% complete. A complete profile significantly boosts credibility and genuine match inquiries.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-white border border-[#E8E2D5]">
                    <div
                      className="h-full rounded-full bg-[#B89A63] transition-all"
                      style={{ width: `${Math.max(10, profile.completionPercentage)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#14243A]">
                    {profile.completionPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/onboarding"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14243A] px-5 py-3 text-xs font-semibold text-white shadow transition hover:bg-[#B89A63]"
            >
              <span>Continue Onboarding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Warning if email unverified */}
        {user.isPendingVerification && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-sm">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-semibold text-amber-950">
                Email Verification Pending
              </p>
              <p className="mt-0.5 text-amber-900">
                Your account is currently in pending status. Please verify your
                email to unlock mutual matching and introductions.
              </p>
              <div className="mt-3">
                <Link
                  href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-900"
                >
                  Verify Email Now &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card & Action Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Profile Card */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-2xl border-2 border-[#E8E2D5] bg-[#FAF8F3] shadow-inner">
                {primaryPhoto ? (
                  <Image
                    src={primaryPhoto.secureUrl}
                    alt={profile.fullName || user.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#777777]">
                    <User className="h-16 w-16 text-[#B89A63]/50" />
                    <span className="text-[11px] font-medium">No photo uploaded</span>
                  </div>
                )}
                <Link
                  href="/dashboard/profile/photos"
                  className="absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#14243A]/90 text-white backdrop-blur transition hover:bg-[#B89A63]"
                  title="Manage Photos"
                >
                  <Camera className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 text-center">
                <h2 className="font-serif text-xl font-bold text-[#14243A]">
                  {profile.fullName || user.name}
                </h2>
                <p className="text-xs text-[#777777]">
                  {age ? `${age} yrs` : "Age not set"} &bull;{" "}
                  {profile.profession || "Profession not set"}
                </p>
                <p className="mt-1 text-xs font-medium text-[#14243A]">
                  {profile.cityOfResidence ? `${profile.cityOfResidence}, ` : ""}
                  {profile.countryOfResidence || "Location not set"}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Verified Member
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F3] px-2.5 py-0.5 text-[11px] font-medium text-[#777777] border border-[#E8E2D5]">
                    <Eye className="h-3 w-3 text-[#B89A63]" />
                    {profile.privacySettings?.profileVisibility || "MEMBERS_ONLY"}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-[#E8E2D5] pt-4 space-y-2">
                <Link
                  href="/dashboard/profile"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2.5 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63] hover:bg-white"
                >
                  <User className="h-4 w-4 text-[#B89A63]" />
                  <span>View Full Profile</span>
                </Link>

                <Link
                  href={`/profile/${profile.slug}`}
                  target="_blank"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14243A] py-2.5 text-xs font-semibold text-white transition hover:bg-[#B89A63]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Public Preview Mode</span>
                </Link>
              </div>
            </div>

            {/* Profile Strength Breakdown */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Section Completion Breakdown
              </h3>
              <p className="mt-1 text-[11px] text-[#777777]">
                Weighted breakdown of your matrimonial profile:
              </p>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <User className="h-3.5 w-3.5 text-[#B89A63]" />
                    Basic Information (15%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.basicInfo}/15%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <Heart className="h-3.5 w-3.5 text-[#B89A63]" />
                    Personal Details (15%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.personalDetails}/15%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <GraduationCap className="h-3.5 w-3.5 text-[#B89A63]" />
                    Education (10%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.education}/10%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <Briefcase className="h-3.5 w-3.5 text-[#B89A63]" />
                    Career & Profession (10%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.career}/10%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <FamilyIcon className="h-3.5 w-3.5 text-[#B89A63]" />
                    Family Information (10%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.family}/10%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <Smile className="h-3.5 w-3.5 text-[#B89A63]" />
                    Lifestyle & Values (10%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.lifestyle}/10%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <Sliders className="h-3.5 w-3.5 text-[#B89A63]" />
                    Partner Preferences (20%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.partnerPreferences}/20%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#777777]">
                    <Camera className="h-3.5 w-3.5 text-[#B89A63]" />
                    Profile Photos (10%)
                  </span>
                  <span className="font-semibold text-[#14243A]">
                    {completionStats.sections.photos}/10%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Navigation & Quick Actions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Management Hub */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Card 1: Edit Profile */}
              <Link
                href="/dashboard/profile/edit"
                className="group rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm transition hover:border-[#B89A63] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63] transition group-hover:bg-[#B89A63] group-hover:text-white">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#777777] transition group-hover:translate-x-1 group-hover:text-[#B89A63]" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
                  Edit Profile Information
                </h3>
                <p className="mt-1 text-xs text-[#777777]">
                  Update your personal details, career accomplishments, education history, and lifestyle attributes.
                </p>
              </Link>

              {/* Card 2: Photos */}
              <Link
                href="/dashboard/profile/photos"
                className="group rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm transition hover:border-[#B89A63] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63] transition group-hover:bg-[#B89A63] group-hover:text-white">
                    <Camera className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#777777] transition group-hover:translate-x-1 group-hover:text-[#B89A63]" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
                  Manage Gallery Photos
                </h3>
                <p className="mt-1 text-xs text-[#777777]">
                  Upload high-resolution portraits, set your primary photo, reorder images, and view moderation review status.
                </p>
              </Link>

              {/* Card 3: Partner Preferences */}
              <Link
                href="/dashboard/profile/preferences"
                className="group rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm transition hover:border-[#B89A63] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63] transition group-hover:bg-[#B89A63] group-hover:text-white">
                    <Heart className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#777777] transition group-hover:translate-x-1 group-hover:text-[#B89A63]" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
                  Partner Preferences
                </h3>
                <p className="mt-1 text-xs text-[#777777]">
                  Define expected age ranges, location preferences, education standards, religious compatibility, and family values.
                </p>
              </Link>

              {/* Card 4: Privacy Settings */}
              <Link
                href="/dashboard/profile/privacy"
                className="group rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm transition hover:border-[#B89A63] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63] transition group-hover:bg-[#B89A63] group-hover:text-white">
                    <Lock className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#777777] transition group-hover:translate-x-1 group-hover:text-[#B89A63]" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
                  Privacy & Visibility Controls
                </h3>
                <p className="mt-1 text-xs text-[#777777]">
                  Control who sees your photos, disguise your income and employer, hide exact birthdates, and set profile visibility.
                </p>
              </Link>
            </div>

            {/* Coming Soon Features in Phase 5 & 6 (Clearly Labelled - No Fake Data) */}
            <div className="rounded-3xl border border-[#E8E2D5] bg-[#FAF8F3] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Upcoming Platform Capabilities
                </h3>
                <span className="rounded-full bg-[#EEE8DC] px-2.5 py-0.5 text-[10px] font-semibold text-[#777777]">
                  In Active Development
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#E8E2D5]/80 bg-white/70 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#B89A63] uppercase">
                      Phase 5
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#14243A]">
                    Discreet Match Discovery
                  </h4>
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Algorithmic compatibility matching and international South Asian directory.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E2D5]/80 bg-white/70 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#B89A63] uppercase">
                      Phase 5
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#14243A]">
                    Mutual Interest Exchange
                  </h4>
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Discreet interest sending, acceptance workflows, and guardian invitations.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E2D5]/80 bg-white/70 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#B89A63] uppercase">
                      Phase 6
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
                      Coming Soon
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#14243A]">
                    Real-time Messaging
                  </h4>
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Consent-based secure chat channels between verified families.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
