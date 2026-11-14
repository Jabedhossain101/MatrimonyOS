import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import {
  ArrowLeft,
  CreditCard,
  History,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export const instant = false;

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing");
  }

  const navLinks = [
    {
      label: "Plans & Membership",
      href: "/dashboard/billing",
      icon: Sparkles,
    },
    {
      label: "bKash Checkout",
      href: "/dashboard/billing/checkout",
      icon: CreditCard,
    },
    {
      label: "Payment History",
      href: "/dashboard/billing/history",
      icon: History,
    },
    {
      label: "Payment Receipts",
      href: "/dashboard/billing/invoices",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      <header className="sticky top-0 z-40 border-b border-[#E8E2D5] bg-[#14243A] text-[#FAF8F3]">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#FAF8F3] transition hover:border-[#B89A63] hover:text-[#B89A63]"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#B89A63]" />
              <span>Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-white/15" />
            <div>
              <span className="font-serif text-base font-bold text-[#FAF8F3]">
                Matrimony<span className="text-[#B89A63]">OS</span> Billing
              </span>
              <span className="ml-2 hidden rounded-md bg-[#B89A63]/20 px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase sm:inline-block">
                bKash Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80">
            <ShieldCheck className="h-4 w-4 text-[#B89A63]" />
            <span className="hidden sm:inline">{user.email}</span>
          </div>
        </div>

        {/* Sub-navigation bar */}
        <div className="border-t border-white/10 bg-[#0F1C2E]">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-[#B89A63]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#B89A63]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

