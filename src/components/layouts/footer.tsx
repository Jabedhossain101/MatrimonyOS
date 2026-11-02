import * as React from "react";
import Link from "next/link";
import { APP_CONFIG, FOOTER_LINKS, SUPPORTED_REGIONS } from "@/lib/constants";
import { Container } from "@/components/ui/container";
import { Shield, Globe, Lock, HeartHandshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E8E2D5] bg-[#0B1728] text-[#FAF8F3] pt-16 pb-12">
      <Container size="lg">
        {/* Top Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243A] font-serif text-xl font-bold text-[#B89A63] border border-[#B89A63]/30">
                M
              </span>
              <span className="font-serif text-2xl font-bold text-[#FAF8F3]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-[#EEE8DC]/70">
              A dignified, privacy-first matchmaking platform connecting conscious individuals and families across Bangladesh and the global diaspora through verified credentials and progressive consent.
            </p>

            {/* Core Pillars */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-[#B89A63]">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Zero Public Indexing
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> ID Verified Tiers
              </span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5" /> Family Assisted
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#B89A63]">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {FOOTER_LINKS.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#EEE8DC]/70 transition hover:text-[#FAF8F3]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#B89A63]">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#EEE8DC]/70 transition hover:text-[#FAF8F3]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#B89A63]">
              Governance
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#EEE8DC]/70 transition hover:text-[#FAF8F3]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Global Corridors Section */}
        <div className="mt-12 pt-8 border-t border-[#14243A]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#B89A63]">
              <Globe className="h-4 w-4" />
              Active International Corridors:
            </span>
            <div className="flex flex-wrap gap-2 text-xs text-[#EEE8DC]/60">
              {SUPPORTED_REGIONS.map((region) => (
                <span
                  key={region.code}
                  className="rounded-md border border-[#14243A] bg-[#14243A]/50 px-2.5 py-1 text-[11px]"
                >
                  {region.name} ({region.hub})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-8 pt-8 border-t border-[#14243A]/70 text-[11px] leading-relaxed text-[#EEE8DC]/50 space-y-2">
          <p>
            <strong>Engineering Notice:</strong> MatrimonyOS is currently operating in Phase 2 architectural presentation. All profiles, member stories, and pricing tiers showcased on this public preview are structured demonstration data designed to illustrate the platform&apos;s privacy and matchmaking mechanics.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <p>
              © 2026 {APP_CONFIG.name}. All rights reserved.
            </p>
            <p>
              Privacy-First SaaS Architecture • Built for Global Communities
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
