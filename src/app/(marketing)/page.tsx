import Link from "next/link";
import { APP_CONFIG, SUPPORTED_REGIONS } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      {/* Hero Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF9F6] px-4 py-1.5 text-xs font-medium text-[#0F172A] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
          Enterprise SaaS Architecture • Day 1 Complete
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-6xl">
          Matrimony<span className="text-[#C5A059]">OS</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#64748B] sm:text-xl">
          {APP_CONFIG.tagline}
        </p>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#64748B]">
          Engineered for privacy, dignity, and real-world scalability.
          Connecting communities across Bangladesh, the UK, the US, Canada,
          Europe, and the Middle East.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/api/health"
            className="inline-flex items-center justify-center rounded-lg bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E293B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
          >
            Inspect System Health (/api/health)
          </Link>
          <a
            href="#architecture"
            className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:border-[#C5A059] hover:bg-[#FAF9F6]"
          >
            Architecture Overview
          </a>
        </div>
      </div>

      {/* Target Markets */}
      <div className="mt-20 rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wider text-[#64748B] uppercase">
          Target Global Corridors
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {SUPPORTED_REGIONS.map((region) => (
            <div
              key={region.code}
              className="flex flex-col rounded-lg border border-[#E2E8F0] bg-[#FAF9F6] p-3 text-center transition hover:border-[#C5A059]"
            >
              <span className="text-xs font-semibold text-[#0F172A]">
                {region.name}
              </span>
              <span className="text-[10px] text-[#64748B]">
                {region.currency} • {region.code}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Foundations */}
      <div
        id="architecture"
        className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F172A]/5 text-[#0F172A]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-[#0F172A]">
            Modular Monolith
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
            Separated domain modules (Auth, Profiles, Matching, Interests,
            Messaging, Subscriptions, Payments) in Next.js App Router.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F172A]/5 text-[#0F172A]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-[#0F172A]">
            Prisma 7 + Neon PostgreSQL
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
            Configured with Prisma 7.10.0, `@prisma/adapter-pg` driver adapter,
            connection pooling with DATABASE_URL, and direct migrations via
            DIRECT_URL.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F172A]/5 text-[#0F172A]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-[#0F172A]">
            Privacy & Type Safety
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
            TypeScript strict mode, Zod environment validation, server-only
            database isolation, and standardized AppError architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
