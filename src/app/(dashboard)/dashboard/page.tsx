import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole } from "@/lib/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  ShieldCheck,
  User,
  Shield,
  KeyRound,
  ExternalLink,
  Crown,
  Clock,
  Sparkles,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Member Dashboard | MatrimonyOS",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const isAdmin =
    user.roles.includes(AppRole.ADMIN) ||
    user.roles.includes(AppRole.SUPER_ADMIN);
  const isSuperAdmin = user.roles.includes(AppRole.SUPER_ADMIN);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Navigation Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
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
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B89A63]/50 bg-[#EEE8DC] px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#B89A63] hover:text-white"
              >
                <Shield className="h-3.5 w-3.5 text-[#B89A63]" />
                <span>Admin Portal</span>
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1728] px-3 py-1.5 text-xs font-semibold text-[#FAF8F3] transition hover:bg-[#14243A]"
              >
                <Crown className="h-3.5 w-3.5 text-[#B89A63]" />
                <span>Super Admin</span>
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-3xl border border-[#E8E2D5] bg-gradient-to-r from-[#14243A] to-[#0B1728] p-8 text-[#FAF8F3] shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B89A63]/40 bg-[#14243A] px-3 py-1 text-xs font-medium text-[#FAF8F3]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B89A63]" />
                Authenticated Session
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#FAF8F3]">
                Assalamu Alaikum, {user.name}
              </h1>
              <p className="mt-1 text-xs text-[#EEE8DC]/80">
                Welcome to your private matrimonial command center.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#EEE8DC]">
                Account Status:{" "}
                <strong
                  className={
                    user.accountStatus === "ACTIVE"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {user.accountStatus}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Warning if unverified */}
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

        {/* Identity & RBAC Matrix Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Identity Profile */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE8DC] text-[#14243A]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Account Identity
                </h3>
                <p className="text-[11px] text-[#777777]">
                  Authenticated credentials
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Display Name</span>
                <span className="font-semibold text-[#14243A]">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Email Address</span>
                <span className="font-mono text-[#14243A]">{user.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Email Verified</span>
                <span
                  className={`font-semibold ${
                    user.emailVerified ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {user.emailVerified
                    ? "Verified (Yes)"
                    : "Unverified (Pending)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777777]">User ID</span>
                <span className="font-mono text-[10px] text-[#777777]">
                  {user.id}
                </span>
              </div>
            </div>
          </div>

          {/* RBAC Roles */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE8DC] text-[#B89A63]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Roles & Permissions
                </h3>
                <p className="text-[11px] text-[#777777]">
                  Active authorization tier
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="text-xs text-[#777777]">Assigned App Roles:</div>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#B89A63]/50 bg-[#FAF8F3] px-3 py-1 text-xs font-semibold text-[#14243A]"
                  >
                    <Sparkles className="h-3 w-3 text-[#B89A63]" />
                    {role}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-3 text-[11px] text-[#777777]">
                <p className="font-semibold text-[#14243A]">Access Rights:</p>
                <p className="mt-0.5">
                  Full member directory browsing is privacy-gated. Phase 3 RBAC
                  enforcement active across all server policies.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Security & Portal Navigation */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE8DC] text-[#14243A]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Portal Corridors
                </h3>
                <p className="text-[11px] text-[#777777]">
                  Quick navigational paths
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-xs">
              <Link
                href="/pricing"
                className="flex items-center justify-between rounded-xl border border-[#E8E2D5] p-3 transition hover:border-[#B89A63]/50 hover:bg-[#FAF8F3]"
              >
                <span className="font-medium text-[#14243A]">
                  Membership & Pricing Tiers
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#777777]" />
              </Link>
              <Link
                href="/how-it-works"
                className="flex items-center justify-between rounded-xl border border-[#E8E2D5] p-3 transition hover:border-[#B89A63]/50 hover:bg-[#FAF8F3]"
              >
                <span className="font-medium text-[#14243A]">
                  Platform Methodology & Verification
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#777777]" />
              </Link>
              <Link
                href="/privacy"
                className="flex items-center justify-between rounded-xl border border-[#E8E2D5] p-3 transition hover:border-[#B89A63]/50 hover:bg-[#FAF8F3]"
              >
                <span className="font-medium text-[#14243A]">
                  Zero-Exposure Privacy Policy
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#777777]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
