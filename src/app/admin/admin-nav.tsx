"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  FileCheck2,
  CreditCard,
  Layers,
  History,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Shield,
  Crown,
  Banknote,
  RotateCcw,
} from "lucide-react";
import { AppRole } from "@/lib/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface AdminNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    roles: AppRole[];
  };
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isSuperAdmin = user.roles.includes(AppRole.SUPER_ADMIN);
  const isAdmin = user.roles.includes(AppRole.ADMIN);
  const isModerator = user.roles.includes(AppRole.MODERATOR);

  const highestRole = isSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : isModerator
    ? "Moderator"
    : "Member";

  const navigationItems = [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      allowed: isSuperAdmin || isAdmin || isModerator,
    },
    {
      label: "User Accounts",
      href: "/admin/users",
      icon: Users,
      allowed: isSuperAdmin || isAdmin || isModerator,
    },
    {
      label: "Profile Moderation",
      href: "/admin/profiles",
      icon: UserCheck,
      allowed: isSuperAdmin || isAdmin || isModerator,
    },
    {
      label: "Verifications",
      href: "/admin/verifications",
      icon: FileCheck2,
      allowed: isSuperAdmin || isAdmin || isModerator,
    },
    {
      label: "Safety Reports",
      href: "/admin/reports",
      icon: ShieldAlert,
      allowed: isSuperAdmin || isAdmin || isModerator,
    },
    {
      label: "bKash Payments",
      href: "/admin/payments",
      icon: Banknote,
      allowed: isSuperAdmin || isAdmin, // MODERATOR excluded
    },
    {
      label: "Refund Requests",
      href: "/admin/refunds",
      icon: RotateCcw,
      allowed: isSuperAdmin || isAdmin, // MODERATOR excluded
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      allowed: isSuperAdmin || isAdmin, // MODERATOR excluded
    },
    {
      label: "Plans & Tiers",
      href: "/admin/plans",
      icon: Layers,
      allowed: isSuperAdmin || isAdmin, // MODERATOR excluded
    },
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: History,
      allowed: isSuperAdmin || isAdmin, // MODERATOR excluded
    },
    {
      label: "Platform Settings",
      href: "/admin/settings",
      icon: Settings,
      allowed: isSuperAdmin, // SUPER_ADMIN only
    },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="flex h-16 items-center justify-between border-b border-[#E8E2D5] bg-[#14243A] px-4 text-[#FAF8F3] lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B89A63] font-serif text-sm font-bold text-[#14243A]">
            M
          </span>
          <span className="font-serif text-base font-bold tracking-tight text-[#FAF8F3]">
            Matrimony<span className="text-[#B89A63]">OS</span> Admin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#FAF8F3] hover:bg-white/10"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#E8E2D5] bg-[#14243A] text-[#FAF8F3] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#B89A63] to-[#9A7E4B] font-serif text-lg font-bold text-[#14243A] shadow-md">
              {isSuperAdmin ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-[#FAF8F3]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#B89A63] uppercase">
                {highestRole} Console
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/60 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="border-b border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-bold text-[#FAF8F3] truncate">{user.name}</div>
            <div className="text-[11px] text-white/60 truncate">{user.email}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-[#B89A63]/20 px-2 py-0.5 text-[9px] font-bold text-[#B89A63] border border-[#B89A63]/30 uppercase">
                {highestRole}
              </span>
              <Link
                href="/dashboard"
                className="text-[10px] text-white/70 hover:text-[#B89A63] flex items-center gap-1 transition"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#B89A63] text-[#14243A] shadow-sm font-bold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#14243A]" : "text-[#B89A63]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>Member Dashboard</span>
          </Link>
          <div className="pt-1">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}

