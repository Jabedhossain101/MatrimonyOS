import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { OnboardingWizard } from "./onboarding-wizard";
import { ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const instant = false;

export const metadata = {
  title: "Profile Onboarding | MatrimonyOS",
  description: "Complete your matrimonial profile discreetly and securely.",
};

export default async function OnboardingPage() {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    redirect("/login?callbackUrl=/onboarding");
  }

  const profile = await profileService.getOrCreateProfile(user.id);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243A] font-serif text-xl font-bold text-[#B89A63]">
              M
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#777777] uppercase">
                Discreet Onboarding
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-[#B89A63]/30 bg-white px-3 py-1 text-xs font-medium text-[#14243A] md:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#B89A63]" />
              <span>Signed in as {user.name}</span>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#777777] hover:text-[#14243A]"
            >
              Skip to Dashboard &rarr;
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OnboardingWizard initialProfile={profile} />
      </main>
    </div>
  );
}

