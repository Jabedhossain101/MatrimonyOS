import * as React from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfilePreviewCard } from "@/components/shared/profile-preview-card";
import { TestimonialCard } from "@/components/shared/testimonial-card";
import { PricingCard } from "@/components/shared/pricing-card";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { CtaSection } from "@/components/shared/cta-section";
import {
  DEMO_PROFILES,
  DEMO_STORIES,
  PRICING_PLANS,
  FAQ_ITEMS,
} from "@/lib/demo-data";
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  Users2,
  Sparkles,
  ArrowRight,
  EyeOff,
  UserCheck,
  Compass,
} from "lucide-react";

export const metadata = {
  title: "A More Meaningful Way to Find Your Life Partner | MatrimonyOS",
  description:
    "A global, privacy-first matrimonial matchmaking platform for individuals and families seeking verified, meaningful connections.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* =========================================================================
          SECTION B: EDITORIAL HERO SECTION
         ========================================================================= */}
      <section className="relative overflow-hidden border-b border-[#E8E2D5]/70 bg-gradient-to-b from-[#FAF8F3] via-[#FAF8F3] to-[#EEE8DC]/30 pt-12 pb-20 sm:pt-20 sm:pb-32">
        <Container size="lg" className="relative z-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Narrative Column */}
            <div className="space-y-6 text-left lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">
                  <Sparkles className="h-3 w-3" />
                  Conscious Matchmaking Architecture
                </Badge>
                <span className="text-xs text-[#777777]">
                  Serving Global South Asian Diaspora
                </span>
              </div>

              <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
                A More Meaningful Way to Find Your{" "}
                <span className="text-[#B89A63] italic">Life Partner.</span>
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-[#777777] sm:text-lg">
                MatrimonyOS replaces intrusive public biodata directories with a
                dignified, privacy-first matchmaking ecosystem. Connect with
                verified individuals and families across Bangladesh, the UK, the
                US, Canada, Europe, and the Middle East through progressive
                consent and shared values.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button variant="gold" size="lg" href="/how-it-works">
                  Create Your Profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" href="#how-it-works">
                  Explore How It Works
                </Button>
              </div>

              {/* Architectural Badges */}
              <div className="grid grid-cols-3 gap-4 border-t border-[#E8E2D5] pt-6 text-xs text-[#14243A]">
                <div>
                  <strong className="block font-serif text-base font-bold text-[#14243A]">
                    Zero
                  </strong>
                  <span className="text-[11px] text-[#777777]">
                    Public Search Indexing
                  </span>
                </div>
                <div>
                  <strong className="block font-serif text-base font-bold text-[#14243A]">
                    100%
                  </strong>
                  <span className="text-[11px] text-[#777777]">
                    Consent-Gated Profiles
                  </span>
                </div>
                <div>
                  <strong className="block font-serif text-base font-bold text-[#14243A]">
                    6+
                  </strong>
                  <span className="text-[11px] text-[#777777]">
                    Global Corridors
                  </span>
                </div>
              </div>
            </div>

            {/* Right Editorial Visual Composition */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-[0_20px_50px_rgba(20,36,58,0.08)] sm:p-8">
                {/* Decorative Seal */}
                <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14243A] font-serif text-sm font-bold text-[#B89A63]">
                      M
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#14243A]">
                        Verified Profile Passport
                      </p>
                      <p className="text-[10px] text-[#777777]">
                        Consent Tier: Progressive Access
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    ID Verified
                  </span>
                </div>

                {/* Simulated Visual Presentation */}
                <div className="my-6 space-y-4">
                  <div className="relative rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#14243A] font-serif text-2xl font-bold text-[#B89A63] shadow-sm">
                      S
                    </div>
                    <p className="mt-3 font-serif text-lg font-bold text-[#14243A]">
                      Senior Clinical Fellow
                    </p>
                    <p className="text-xs text-[#777777]">
                      London, UK • Roots in Dhaka
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D5] bg-white px-3 py-1 text-[11px] text-[#A3854F]">
                      <Lock className="h-3 w-3" />
                      Photographs revealed upon mutual consent
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5">
                      <span className="block text-[10px] text-[#777777]">
                        Education
                      </span>
                      <strong className="text-[#14243A]">
                        Imperial College London
                      </strong>
                    </div>
                    <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5">
                      <span className="block text-[10px] text-[#777777]">
                        Guardian Mode
                      </span>
                      <strong className="text-[#14243A]">
                        Family Co-Managed
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Simulated Verification Notice */}
                <div className="flex items-center gap-2 rounded-xl bg-[#EEE8DC]/50 p-3 text-[11px] text-[#14243A]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#B89A63]" />
                  <span>
                    NID / Passport verified • Non-commercial privacy protection
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION C: TRUST INDICATORS
         ========================================================================= */}
      <section className="border-b border-[#E8E2D5] bg-white py-16">
        <Container size="lg">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
                <Lock className="h-6 w-6 text-[#B89A63]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Privacy by Design
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#777777]">
                  No public photo search. Sensitive biodata is revealed
                  progressively with mutual consent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
                <ShieldCheck className="h-6 w-6 text-[#B89A63]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Verification Framework
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#777777]">
                  Multi-step validation including official ID documents,
                  academic milestones, and phone checks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
                <HeartHandshake className="h-6 w-6 text-[#B89A63]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Consent Communication
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#777777]">
                  Unsolicited spam is structurally impossible. Messages require
                  explicit mutual agreement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A]">
                <Users2 className="h-6 w-6 text-[#B89A63]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Global Community
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#777777]">
                  Dedicated corridors connecting Bangladesh with UK, US, Canada,
                  Europe, and Middle East.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION D: HOW IT WORKS
         ========================================================================= */}
      <section
        id="how-it-works"
        className="border-b border-[#E8E2D5] bg-[#FAF8F3] py-20 sm:py-28"
      >
        <Container size="lg">
          <SectionHeading
            badge="The Matchmaking Journey"
            title="A Deliberate, Dignified"
            titleAccent="Four-Step Process"
            description="Designed to eliminate the noise, superficial swiping, and harassment common on generic matchmaking platforms."
          />

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-2xl border border-[#E8E2D5] bg-white p-7 shadow-sm">
              <span className="font-serif text-3xl font-extrabold text-[#B89A63]/30">
                01
              </span>
              <h3 className="mt-2 font-serif text-lg font-bold text-[#14243A]">
                Create Your Profile
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Detail your educational background, cultural grounding,
                spiritual outlook, and family expectations with granular privacy
                controls.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[#E8E2D5] bg-white p-7 shadow-sm">
              <span className="font-serif text-3xl font-extrabold text-[#B89A63]/30">
                02
              </span>
              <h3 className="mt-2 font-serif text-lg font-bold text-[#14243A]">
                Discover Compatibility
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Filter prospective matches across international corridors based
                on lifestyle habits, relocation willingness, and family
                alignment.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[#E8E2D5] bg-white p-7 shadow-sm">
              <span className="font-serif text-3xl font-extrabold text-[#B89A63]/30">
                03
              </span>
              <h3 className="mt-2 font-serif text-lg font-bold text-[#14243A]">
                Express Interest
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Send a formal interest signal. Both parties review high-level
                compatibility before any private details or photographs are
                unlocked.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[#E8E2D5] bg-white p-7 shadow-sm">
              <span className="font-serif text-3xl font-extrabold text-[#B89A63]/30">
                04
              </span>
              <h3 className="mt-2 font-serif text-lg font-bold text-[#14243A]">
                Build Connection
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Communicate directly or with family guardian involvement in
                secure threads designed to foster clear, respectful marriage
                conversations.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button variant="primary" size="md" href="/how-it-works">
              Read the Complete Step-by-Step Guide →
            </Button>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION E: FEATURED PROFILES (ILLUSTRATIVE DEMO PROFILES)
         ========================================================================= */}
      <section
        id="demo-profiles"
        className="border-b border-[#E8E2D5] bg-white py-20 sm:py-28"
      >
        <Container size="lg">
          <SectionHeading
            badge="Demonstration Profiles"
            title="Sample Profiles Designed for"
            titleAccent="Privacy & Dignity"
            description="Explore these fictional demonstration profiles to see how MatrimonyOS balances rich compatibility data with strict personal confidentiality."
          />

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DEMO_PROFILES.map((profile) => (
              <ProfilePreviewCard key={profile.id} profile={profile} />
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-center text-xs text-[#777777]">
            <p>
              <strong>Notice:</strong> The cards above are structured
              demonstration profiles for interface evaluation. No actual
              customer biodata or photographs are made public.
            </p>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION F: WHY MATRIMONYOS
         ========================================================================= */}
      <section className="border-b border-[#E8E2D5] bg-[#FAF8F3] py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            badge="The MatrimonyOS Difference"
            title="Engineered for Conscious Families,"
            titleAccent="Not Casual Swiping"
            description="Every detail of our software architecture has been created to solve the real frustrations of traditional matrimonial platforms."
          />

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF8F3] text-[#14243A]">
                <EyeOff className="h-6 w-6 text-[#B89A63]" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#14243A]">
                Granular Privacy Tiers
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#777777]">
                You decide who sees your photographs, workplace, and family
                information. Choose between Standard, Protected, or completely
                Invisible exploration modes.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF8F3] text-[#14243A]">
                <UserCheck className="h-6 w-6 text-[#B89A63]" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#14243A]">
                Collaborative Guardian Mode
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#777777]">
                Invite your parents or a trusted elder to assist in reviewing
                prospective profiles while maintaining your personal autonomy
                and absolute veto power.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2D5] bg-white p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF8F3] text-[#14243A]">
                <Compass className="h-6 w-6 text-[#B89A63]" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#14243A]">
                Cross-Border Corridors
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#777777]">
                Purpose-built filters address the realities of diaspora life:
                immigration timelines, relocation readiness, language fluency,
                and family living arrangements.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION G: SUCCESS STORIES (ILLUSTRATIVE CASE STUDIES)
         ========================================================================= */}
      <section className="border-b border-[#E8E2D5] bg-white py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            badge="Illustrative Case Studies"
            title="Real-World Matchmaking"
            titleAccent="Workflows Illustrated"
            description="Understand how cross-border couples and families navigate verified introductions, consent gates, and family introductions on MatrimonyOS."
          />

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {DEMO_STORIES.map((story) => (
              <TestimonialCard key={story.id} story={story} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="md" href="/success-stories">
              View All Demonstrative Journeys →
            </Button>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION H: MEMBERSHIP PREVIEW
         ========================================================================= */}
      <section className="border-b border-[#E8E2D5] bg-[#FAF8F3] py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            badge="Transparent Memberships"
            title="Straightforward Plans for"
            titleAccent="Every Family"
            description="Transparent, fair pricing with zero predatory automatic renewals or cancellation hurdles. Start with our comprehensive Free tier."
          />

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="md" href="/pricing">
              View Detailed Feature Comparison Matrix →
            </Button>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION I: FAQ PREVIEW
         ========================================================================= */}
      <section className="border-b border-[#E8E2D5] bg-white py-20 sm:py-28">
        <Container size="md">
          <SectionHeading
            badge="Frequently Asked Questions"
            title="Everything You Need"
            titleAccent="to Know"
            description="Clear answers regarding privacy architecture, guardian accounts, identity verification, and international corridor matching."
          />

          <div className="mt-12">
            <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} allowSearch={false} />
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="md" href="/faq">
              Explore All Questions in the FAQ Center →
            </Button>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION J: FINAL CTA
         ========================================================================= */}
      <CtaSection
        title="Begin Your Journey with Complete Peace of Mind"
        description="Experience the difference of a matchmaking platform built on privacy, respect, and family collaboration across the globe."
        primaryCtaLabel="Create Your Profile"
        primaryCtaHref="/how-it-works"
        secondaryCtaLabel="Learn About Our Philosophy"
        secondaryCtaHref="/about"
      />
    </div>
  );
}
