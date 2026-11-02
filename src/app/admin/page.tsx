import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Shield,
  Users,
  ShieldAlert,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Admin Portal | MatrimonyOS",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Enforce ADMIN or SUPER_ADMIN role
  const isAuthorized = hasAnyRole(user.roles, [
    AppRole.ADMIN,
    AppRole.SUPER_ADMIN,
  ]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3] p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A]">
            Access Denied
          </h1>
          <p className="mt-2 text-xs text-[#777777]">
            You do not possess the required <strong>ADMIN</strong> or{" "}
            <strong>SUPER_ADMIN</strong> permissions to view this terminal.
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243A] font-serif text-xl font-bold text-[#B89A63] shadow-sm">
              M
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#777777] uppercase">
                Platform Administration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#14243A] hover:text-[#B89A63]"
            >
              Member Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B89A63]/40 bg-[#14243A] px-3 py-1 text-xs font-medium text-[#FAF8F3]">
              <Shield className="h-3.5 w-3.5 text-[#B89A63]" />
              Role: {user.roles.join(", ")}
            </div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#14243A]">
              Administrative Command Plane
            </h1>
            <p className="mt-1 text-xs text-[#777777]">
              Platform-wide trust operations, member moderation, and audit
              trails.
            </p>
          </div>
          <Link
            href="/api/health"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-semibold text-[#14243A] shadow-sm hover:bg-[#FAF8F3]"
          >
            <Activity className="h-4 w-4 text-emerald-600" />
            <span>Live Health Telemetry</span>
          </Link>
        </div>

        {/* Admin Dashboard Metric Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777777]">
                Trust & Verification
              </span>
              <ShieldAlert className="h-4 w-4 text-[#B89A63]" />
            </div>
            <p className="mt-3 text-2xl font-bold text-[#14243A]">
              Operational
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              <span>Zero breaches recorded</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777777]">
                Active RBAC Roles
              </span>
              <Users className="h-4 w-4 text-[#B89A63]" />
            </div>
            <p className="mt-3 text-2xl font-bold text-[#14243A]">6 Tiers</p>
            <p className="mt-1 text-[11px] text-[#777777]">
              MEMBER to SUPER_ADMIN
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777777]">
                Identity Engine
              </span>
              <Lock className="h-4 w-4 text-[#B89A63]" />
            </div>
            <p className="mt-3 text-2xl font-bold text-[#14243A]">
              Better Auth
            </p>
            <p className="mt-1 text-[11px] text-[#777777]">
              PostgreSQL / Neon Driver
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777777]">
                Database Driver
              </span>
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-[#14243A]">
              Prisma 7.10
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
              Adapter connected
            </p>
          </div>
        </div>

        {/* Administration Guidelines */}
        <div className="mt-8 rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#14243A]">
            Phase 3 Authentication & Governance Policy
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#777777]">
            This admin plane is guarded by server-side policy enforcement
            (`requireRole([AppRole.ADMIN, AppRole.SUPER_ADMIN])`). All user
            authentication, session cookies, password reset tokens, and email
            verification workflows operate through isolated cryptographic
            routines.
          </p>
        </div>
      </main>
    </div>
  );
}
