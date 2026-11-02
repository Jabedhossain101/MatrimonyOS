import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasRole } from "@/lib/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Crown,
  Globe2,
  Database,
  Lock,
  ArrowLeft,
  Sliders,
} from "lucide-react";
import { SUPPORTED_REGIONS } from "@/lib/constants";

export const instant = false;

export const metadata = {
  title: "Super Admin Terminal | MatrimonyOS",
};

export default async function SuperAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/super-admin");
  }

  // Enforce SUPER_ADMIN role
  const isAuthorized = hasRole(user.roles, AppRole.SUPER_ADMIN);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3] p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A]">
            Super Admin Access Required
          </h1>
          <p className="mt-2 text-xs text-[#777777]">
            This terminal is restricted exclusively to{" "}
            <strong>SUPER_ADMIN</strong> principal engineers.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-4 py-2 text-xs font-semibold text-[#FAF8F3] transition hover:bg-[#0B1728]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Member Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1728] font-serif text-xl font-bold text-[#B89A63] shadow-sm">
              <Crown className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#777777] uppercase">
                Super Admin Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-[#14243A] hover:text-[#B89A63]"
            >
              Admin Portal
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#14243A] hover:text-[#B89A63]"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89A63]/40 bg-[#0B1728] px-3 py-1 text-xs font-medium text-[#FAF8F3]">
            <Crown className="h-3.5 w-3.5 text-[#B89A63]" />
            Principal Authority
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#14243A]">
            Infrastructure & Global Tenancy Controls
          </h1>
          <p className="mt-1 text-xs text-[#777777]">
            Multi-corridor configuration, secret rotation management, and root
            access controls.
          </p>
        </div>

        {/* Global Regional Hubs */}
        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Globe2 className="h-5 w-5 text-[#B89A63]" />
            <h2 className="font-serif text-lg font-bold text-[#14243A]">
              Configured Geographic Corridors
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#777777]">
            Active international clusters serving our global South Asian
            matrimonial community.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORTED_REGIONS.map((region) => (
              <div
                key={region.code}
                className="flex items-center justify-between rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4"
              >
                <div>
                  <p className="text-xs font-semibold text-[#14243A]">
                    {region.name}
                  </p>
                  <p className="text-[11px] text-[#777777]">
                    Hub: {region.hub} &bull; Currency: {region.currency}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Diagnostics */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-[#B89A63]" />
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Persistence & Connection Pool
              </h3>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Cloud Provider</span>
                <span className="font-semibold text-[#14243A]">
                  Neon PostgreSQL
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">ORM Engine</span>
                <span className="font-semibold text-[#14243A]">
                  Prisma 7.10.0
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Driver Adapter</span>
                <span className="font-semibold text-emerald-700">
                  @prisma/adapter-pg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777777]">Connection Pooling</span>
                <span className="font-semibold text-emerald-700">
                  pg.Pool (SSL enabled)
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-[#B89A63]" />
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Cryptographic Security
              </h3>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Auth Engine</span>
                <span className="font-semibold text-[#14243A]">
                  Better Auth 1.7.15
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Password Hashing</span>
                <span className="font-semibold text-emerald-700">
                  Argon2id / Scrypt
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/60 pb-2">
                <span className="text-[#777777]">Email Verification</span>
                <span className="font-semibold text-emerald-700">
                  Enforced (Active)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777777]">Role Governance</span>
                <span className="font-semibold text-emerald-700">
                  6 Multi-Role Levels
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
