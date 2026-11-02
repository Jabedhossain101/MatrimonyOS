"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_CONFIG, NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E2D5] bg-[#FAF8F3]/95 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="group flex items-center gap-3 transition focus-visible:outline-none"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243A] font-serif text-xl font-bold text-[#B89A63] shadow-sm transition-transform duration-200 group-hover:scale-105">
            M
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-extrabold tracking-tight text-[#14243A]">
                Matrimony<span className="text-[#B89A63]">OS</span>
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-[#777777] uppercase">
              Privacy-First Matchmaking
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center space-x-1 lg:flex xl:space-x-2">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? "bg-[#EEE8DC] text-[#14243A]"
                    : "text-[#333333] hover:bg-[#EEE8DC]/50 hover:text-[#14243A]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden items-center space-x-3 lg:flex">
          <Link
            href="/login"
            className="px-3.5 py-2 text-xs font-semibold text-[#14243A] transition hover:text-[#B89A63]"
          >
            Member Login
          </Link>
          <Button
            variant="gold"
            size="sm"
            href="/how-it-works"
            className="shadow-sm"
          >
            Create Profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-[#14243A] hover:bg-[#EEE8DC] focus:ring-2 focus:ring-[#B89A63] focus:outline-none lg:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-50 flex flex-col overflow-y-auto border-t border-[#E8E2D5] bg-[#FAF8F3] px-6 py-8 lg:hidden">
          <div className="mb-6 flex items-center justify-between border-b border-[#E8E2D5] pb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#B89A63]">
              <Shield className="h-4 w-4" />
              Verified Global Community
            </span>
            <span className="text-xs text-[#777777]">Phase 2 Edition</span>
          </div>

          <nav className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`rounded-xl px-4 py-3 font-serif text-base font-bold transition ${
                    isActive
                      ? "bg-[#14243A] text-[#FAF8F3]"
                      : "text-[#14243A] hover:bg-[#EEE8DC]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-3 border-t border-[#E8E2D5] pt-6">
            <Button
              variant="gold"
              size="lg"
              href="/how-it-works"
              onClick={closeMobileMenu}
              className="w-full text-center"
            >
              Create Your Profile
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/login"
              onClick={closeMobileMenu}
              className="w-full text-center"
            >
              Member Sign In
            </Button>
          </div>

          <div className="mt-auto pt-8 text-center text-xs text-[#777777]">
            <p>{APP_CONFIG.tagline}</p>
            <p className="mt-1 font-mono text-[10px]">
              Serving BD • UK • US • CA • EU • ME
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
