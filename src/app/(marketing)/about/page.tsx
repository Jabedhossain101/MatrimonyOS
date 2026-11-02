import * as React from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { CtaSection } from "@/components/shared/cta-section";
import { SUPPORTED_REGIONS } from "@/lib/constants";
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  Users2,
  Compass,
  Sparkles,
  Scale,
  Award,
} from "lucide-react";

export const metadata = {
  title: "About MatrimonyOS — Our Mission & Privacy-First Philosophy",
  description:
    "Learn why MatrimonyOS was created to provide a dignified, privacy-first matchmaking experience for individuals and families across the globe.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "About Us" }]} className="mb-8" />

        {/* Hero Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            Our Heritage & Vision
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
            Restoring Dignity, Discretion & Respect to{" "}
            <span className="text-[#B89A63] italic">Global Matrimony.</span>
          </h1>
          <p className="text-base leading-relaxed text-[#777777] sm:text-lg">
            MatrimonyOS was born out of a clear realization: traditional
            matrimonial directories have turned sacred life decisions into
            public catalogs, while casual dating apps disregard the value of
            family and long-term marriage intentions.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8 shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
              <Compass className="h-6 w-6 text-[#B89A63]" />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-bold text-[#14243A]">
              Our Mission
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#777777]">
              To provide conscious individuals and families around the world
              with an uncompromisingly secure, verified, and culturally attuned
              digital space to find their lifelong partner—honoring personal
              sovereignty while celebrating family involvement.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8 shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
              <Award className="h-6 w-6 text-[#B89A63]" />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-bold text-[#14243A]">
              Our Vision
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#777777]">
              To become the global benchmark for ethical matchmaking—a platform
              where privacy is the default state, authenticity is verified, and
              modern careers seamlessly align with timeless spiritual and family
              values.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mt-24">
          <SectionHeading
            badge="Guiding Principles"
            title="The Values That Inform"
            titleAccent="Every Architecture Decision"
            description="We build software with strict ethical boundaries, ensuring our platform always respects human dignity."
          />

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                1. Privacy by Default
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Your personal identity, contact data, and photographs are never
                publicly searchable. You control who unlocks them through
                progressive consent.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                2. Uncompromising Verification
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                We combine phone verification, government-issued photo ID
                checks, and institutional credentials to maintain an authentic,
                high-trust network.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                3. Respectful Family Collaboration
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                We honor the tradition of parental and guardian blessings while
                guaranteeing candidates total personal autonomy and final veto
                rights.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                4. Transparent Economics
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                No predatory auto-renewals, hidden recurring traps, or
                fabricated matches. Our incentives align directly with your
                long-term success.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                5. Global Diaspora Reach
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Designed specifically for cross-border lives, bridging families
                across London, New York, Dhaka, Toronto, Dubai, and Continental
                Europe.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F3] text-[#B89A63]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#14243A]">
                6. Responsible Matchmaking
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                We promote deliberate, thoughtful discovery based on shared
                values and temperament rather than dopamine-driven superficial
                metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Global Corridors Section */}
        <div
          id="corridors"
          className="mt-24 rounded-3xl border border-[#E8E2D5] bg-[#FAF8F3] p-8 sm:p-12"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider text-[#B89A63] uppercase">
              Active Regional Infrastructure
            </span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
              Connecting the Homeland with the Global Diaspora
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-[#777777] sm:text-sm">
              MatrimonyOS is tailored for the geographical realities of South
              Asian diaspora families worldwide.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SUPPORTED_REGIONS.map((region) => (
              <div
                key={region.code}
                className="rounded-xl border border-[#E8E2D5] bg-white p-4 text-center shadow-xs"
              >
                <span className="block font-serif text-base font-bold text-[#14243A]">
                  {region.name}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-[#B89A63]">
                  Hub: {region.hub}
                </span>
                <span className="mt-0.5 block text-[10px] text-[#777777]">
                  Currency: {region.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Philosophy Deep-Dive */}
        <div
          id="privacy-philosophy"
          className="mx-auto mt-24 max-w-4xl space-y-6 text-left"
        >
          <SectionHeading
            badge="Philosophy"
            title="Why We Never Build"
            titleAccent="Public Member Directories"
            align="left"
          />
          <div className="prose prose-stone space-y-4 text-xs leading-relaxed text-[#777777] sm:text-sm">
            <p>
              On conventional matrimonial portals, registering a profile is
              equivalent to publishing your contact numbers, educational
              history, and personal photographs to Google and anyone with a
              browser. This leads to unsolicited family inquiries, photo
              scraping, and serious privacy violations.
            </p>
            <p>
              At MatrimonyOS, we engineered our data model so that your profile
              is discoverable strictly via compatible criteria (education level,
              values, location preference, spiritual practice) while keeping
              identifying markers encrypted and blurred behind mutual consent
              gates.
            </p>
            <p>
              Only when both you and a prospective candidate explicitly confirm
              mutual interest are high-resolution photographs unlocked and
              direct contact permitted. This simple architectural guarantee
              transforms matchmaking into an experience of safety, serenity, and
              dignity.
            </p>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="mt-20">
        <CtaSection
          title="Experience Matchmaking Built on Honor and Privacy"
          description="Join the growing number of conscious individuals and families creating thoughtful profiles on MatrimonyOS."
        />
      </div>
    </div>
  );
}
