import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { AdminNav } from "./admin-nav";
import { Lock, ArrowLeft } from "lucide-react";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Check if user has administrative or moderation capabilities
  const isAuthorized = hasAnyRole(user.roles, [
    AppRole.MODERATOR,
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
            Administrative Access Denied
          </h1>
          <p className="mt-2 text-xs text-[#777777]">
            You do not possess the required <strong>MODERATOR</strong>,{" "}
            <strong>ADMIN</strong>, or <strong>SUPER_ADMIN</strong> permissions to view this terminal.
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
    <div className="flex min-h-screen flex-col bg-[#FAF8F3] text-[#333333] lg:flex-row">
      <AdminNav user={user} />
      <main className="flex-1 overflow-y-auto min-h-screen bg-[#FAF8F3]">
        {children}
      </main>
    </div>
  );
}

