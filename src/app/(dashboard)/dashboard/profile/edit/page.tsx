import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { ProfileEditor } from "./profile-editor";
import { ChevronLeft } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Edit Matrimonial Profile | MatrimonyOS",
  description: "Update your individual matrimonial profile sections.",
};

export default async function ProfileEditPage() {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    redirect("/login?callbackUrl=/dashboard/profile/edit");
  }

  const profile = await profileService.getOrCreateProfile(user.id);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#777777] transition hover:text-[#14243A]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Profile</span>
          </Link>

          <span className="text-xs font-bold text-[#14243A]">
            Section Editor
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A]">
            Edit Profile Sections
          </h1>
          <p className="mt-1 text-xs text-[#777777]">
            Update individual sections directly without restarting the full onboarding wizard.
          </p>
        </div>

        <ProfileEditor initialProfile={profile} />
      </main>
    </div>
  );
}

