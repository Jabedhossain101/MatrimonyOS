import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, HeartHandshake } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F3] text-[#333333]">
      {/* Top Bar */}
      <header className="border-b border-[#E8E2D5] bg-[#FAF8F3]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 transition focus-visible:outline-none"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14243A] font-serif text-lg font-bold text-[#B89A63] shadow-sm transition-transform duration-200 group-hover:scale-105">
              M
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-[#777777] uppercase">
                Privacy-First Matchmaking
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#777777]">
            <Lock className="h-3.5 w-3.5 text-[#B89A63]" />
            <span className="hidden sm:inline">256-bit Encrypted Session</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-xl lg:grid-cols-12">
          {/* Editorial Brand Sidebar */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0B1728] p-10 text-[#FAF8F3] lg:col-span-5 lg:flex">
            {/* Background Decorative Rings */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full border border-[#B89A63]/20" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full border border-[#B89A63]/15" />

            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B89A63]/40 bg-[#14243A]/80 px-3 py-1 text-xs font-medium text-[#FAF8F3]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B89A63]" />
                Zero Public Exposure
              </div>
            </div>

            {/* Middle Quote */}
            <div className="relative z-10 my-8 space-y-4">
              <h2 className="font-serif text-2xl leading-snug font-bold tracking-tight text-[#FAF8F3]">
                Where dignity meets purposeful matrimonial discovery.
              </h2>
              <p className="text-xs leading-relaxed text-[#EEE8DC]/80">
                Your photograph, family lineage, and contact credentials remain
                strictly confidential. Only mutually accepted introductions gain
                verified access.
              </p>
            </div>

            {/* Bottom Trust Indicators */}
            <div className="relative z-10 space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3 text-xs text-[#EEE8DC]">
                <HeartHandshake className="h-4 w-4 text-[#B89A63]" />
                <span>Global South Asian & International Corridors</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#EEE8DC]">
                <Lock className="h-4 w-4 text-[#B89A63]" />
                <span>Strict Role-Based Security & Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Dynamic Auth View */}
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-7">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D5] bg-[#FAF8F3] py-6 text-center text-xs text-[#777777]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
          <span>&copy; 2026 MatrimonyOS. All rights reserved.</span>
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-[#14243A] hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="underline-offset-4 hover:text-[#14243A] hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/faq"
            className="underline-offset-4 hover:text-[#14243A] hover:underline"
          >
            Security & FAQ
          </Link>
          <Link
            href="/contact"
            className="underline-offset-4 hover:text-[#14243A] hover:underline"
          >
            Concierge Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
