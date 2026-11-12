import * as React from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasRole } from "@/lib/permissions";
import { platformSettingsService } from "@/server/services/platform-settings.service";
import { SettingsClient, type SettingItem } from "./settings-client";
import { Lock, ArrowLeft } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Platform Settings | MatrimonyOS Admin",
  description: "Global system parameters and flags.",
};

export default async function AdminSettingsPage() {
  await connection();
  const user = await getCurrentUser();

  // Enforce SUPER_ADMIN check
  if (!user || !hasRole(user.roles, AppRole.SUPER_ADMIN)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A]">
            Super Admin Access Required
          </h1>
          <p className="mt-2 text-xs text-[#777777]">
            Platform configuration parameters can only be reviewed and modified by <strong>SUPER_ADMIN</strong> executives.
          </p>
          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-4 py-2 text-xs font-semibold text-[#FAF8F3] transition hover:bg-[#0B1728]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const settings = await platformSettingsService.listSettings();

  return <SettingsClient initialSettings={settings as unknown as SettingItem[]} />;
}

