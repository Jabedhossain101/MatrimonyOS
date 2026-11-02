import * as React from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/shared/pricing-card";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { CtaSection } from "@/components/shared/cta-section";
import { PRICING_PLANS, FAQ_ITEMS } from "@/lib/demo-data";
import { Check, Minus, Info, Sparkles } from "lucide-react";

export const metadata = {
  title: "Membership Plans & Proposed Pricing | MatrimonyOS",
  description:
    "Explore transparent membership tiers for MatrimonyOS: Standard Free, Premium, and Elite tiers designed for families and individuals.",
};

const COMPARISON_FEATURES = [
  {
    category: "Profile & Identity Verification",
    items: [
      {
        name: "Verified Profile Creation (Mobile OTP)",
        free: true,
        premium: true,
        elite: true,
      },
      {
        name: "Official ID / Passport Badge Verification",
        free: true,
        premium: true,
        elite: true,
      },
      {
        name: "Education & Institution Verification",
        free: false,
        premium: true,
        elite: true,
      },
      {
        name: "Family Guardian Co-Management Portal",
        free: false,
        premium: true,
        elite: true,
      },
    ],
  },
  {
    category: "Discovery & Privacy Controls",
    items: [
      {
        name: "Standard Privacy Control (Photo Blur Default)",
        free: true,
        premium: true,
        elite: true,
      },
      {
        name: "Full Global Corridor Filters (UK, US, CA, EU, ME)",
        free: false,
        premium: true,
        elite: true,
      },
      {
        name: "Relocation & Diaspora Nuance Filters",
        free: false,
        premium: true,
        elite: true,
      },
      {
        name: "Maximum Discreet Mode (Completely Invisible)",
        free: false,
        premium: false,
        elite: true,
      },
    ],
  },
  {
    category: "Interests & Communication",
    items: [
      {
        name: "Receive & Review Incoming Interests",
        free: true,
        premium: true,
        elite: true,
      },
      {
        name: "Outgoing Interest Quota",
        free: "5 / month",
        premium: "25 / month",
        elite: "Unlimited",
      },
      {
        name: "Consent-Gated Encrypted Messaging",
        free: true,
        premium: true,
        elite: true,
      },
      {
        name: "Dedicated Matrimonial Concierge Support",
        free: false,
        premium: "Standard (24h)",
        elite: "VIP Priority",
      },
      {
        name: "Hand-Curated Matchmaker Consultations",
        free: false,
        premium: false,
        elite: true,
      },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Pricing & Plans" }]} className="mb-8" />

        {/* Hero Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            Transparent Memberships
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
            Simple, Transparent Tiers for{" "}
            <span className="text-[#B89A63] italic">Every Family.</span>
          </h1>
          <p className="text-base leading-relaxed text-[#777777] sm:text-lg">
            We reject the aggressive recurring subscriptions, fake urgency
            timers, and cancellation hurdles that plague the matchmaking
            industry.
          </p>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#B89A63]/30 bg-[#FAF8F3] p-4 text-xs text-[#14243A]">
            <Info className="h-4 w-4 shrink-0 text-[#B89A63]" />
            <span>
              <strong>Launch Notice:</strong> All fees shown below represent
              proposed illustrative pricing structures for our upcoming
              commercial launch. No payment processing is enabled in Phase 2.
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Detailed Feature Comparison Matrix */}
        <div className="mt-28">
          <SectionHeading
            badge="Full Breakdown"
            title="Comprehensive Feature"
            titleAccent="Comparison Matrix"
            description="Examine the exact capabilities included within each tier to choose the right fit for your family."
          />

          <div className="mt-12 overflow-x-auto rounded-3xl border border-[#E8E2D5] bg-white shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D5] bg-[#FAF8F3]">
                  <th className="w-1/2 p-4 font-serif font-bold text-[#14243A] sm:w-2/5 sm:p-6">
                    Plan Capabilities
                  </th>
                  <th className="p-4 text-center font-serif font-bold text-[#14243A] sm:p-6">
                    Standard (Free)
                  </th>
                  <th className="bg-[#B89A63]/5 p-4 text-center font-serif font-bold text-[#B89A63] sm:p-6">
                    Premium
                  </th>
                  <th className="p-4 text-center font-serif font-bold text-[#14243A] sm:p-6">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {COMPARISON_FEATURES.map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-[#FAF8F3]/60">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-xs font-bold tracking-wider text-[#14243A] uppercase sm:px-6"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.items.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="transition-colors hover:bg-[#FAF8F3]/30"
                      >
                        <td className="p-4 text-xs font-medium text-[#333333] sm:p-6">
                          {row.name}
                        </td>
                        <td className="p-4 text-center text-xs sm:p-6">
                          {typeof row.free === "boolean" ? (
                            row.free ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-[#777777]/40" />
                            )
                          ) : (
                            <span className="font-medium text-[#777777]">
                              {row.free}
                            </span>
                          )}
                        </td>
                        <td className="bg-[#B89A63]/5 p-4 text-center text-xs sm:p-6">
                          {typeof row.premium === "boolean" ? (
                            row.premium ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-[#777777]/40" />
                            )
                          ) : (
                            <span className="font-semibold text-[#14243A]">
                              {row.premium}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-xs sm:p-6">
                          {typeof row.elite === "boolean" ? (
                            row.elite ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-[#777777]/40" />
                            )
                          ) : (
                            <span className="font-bold text-[#B89A63]">
                              {row.elite}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQ Section */}
        <div className="mt-28">
          <SectionHeading
            badge="Common Questions"
            title="Questions About"
            titleAccent="Pricing & Tiers"
            description="Clear, honest answers regarding our upcoming billing models and refund policies."
          />

          <div className="mx-auto mt-12 max-w-3xl">
            <FaqAccordion
              items={FAQ_ITEMS.filter(
                (f) => f.category === "Membership & Fees"
              )}
              allowSearch={false}
            />
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="mt-20">
        <CtaSection
          title="Begin with Our Free Standard Plan"
          description="Create your verified matrimonial passport today and discover meaningful matches worldwide."
        />
      </div>
    </div>
  );
}
