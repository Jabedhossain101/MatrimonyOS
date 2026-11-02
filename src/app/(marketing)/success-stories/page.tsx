import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { TestimonialCard } from "@/components/shared/testimonial-card";
import { CtaSection } from "@/components/shared/cta-section";
import { DEMO_STORIES } from "@/lib/demo-data";
import { Sparkles, Info } from "lucide-react";

export const metadata = {
  title: "Success Stories & Journey Demonstrations | MatrimonyOS",
  description:
    "Read illustrative case studies showcasing how cross-border couples navigate privacy tiers, family involvement, and verified introductions on MatrimonyOS.",
};

export default function SuccessStoriesPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Success Stories" }]} className="mb-8" />

        {/* Hero Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            Simulated Match Journeys
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
            Journeys of Dignity, Mutual Values &{" "}
            <span className="text-[#B89A63] italic">Family Alignment.</span>
          </h1>
          <p className="text-base leading-relaxed text-[#777777] sm:text-lg">
            To demonstrate our platform mechanics without compromising the
            confidential data of real human beings, we present these detailed
            illustrative scenarios modeled on typical cross-border matrimonial
            pathways.
          </p>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#B89A63]/30 bg-[#FAF8F3] p-4 text-xs text-[#14243A]">
            <Info className="h-4 w-4 shrink-0 text-[#B89A63]" />
            <span>
              <strong>Transparency Notice:</strong> In adherence to our strict
              ethical code, we never manufacture fake customer reviews or invent
              artificial statistical success claims. All cases below represent
              illustrative user workflows.
            </span>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {DEMO_STORIES.map((story) => (
            <TestimonialCard key={story.id} story={story} />
          ))}
        </div>

        {/* Deep-Dive Case Study Narrative */}
        <div className="mt-24 rounded-3xl border border-[#E8E2D5] bg-white p-8 shadow-sm sm:p-12">
          <div className="max-w-3xl space-y-6">
            <Badge variant="navy">In-Depth Workflow Breakdown</Badge>
            <h2 className="font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
              How the Cross-Border Corridor Works in Practice
            </h2>
            <p className="text-xs leading-relaxed text-[#777777] sm:text-sm">
              Consider an educator in London with roots in Dhaka seeking a
              spouse who shares both a commitment to Islamic ethics and a
              demanding professional career.
            </p>
            <div className="space-y-4 text-xs leading-relaxed text-[#333333] sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B89A63]/20 text-xs font-bold text-[#B89A63]">
                  1
                </div>
                <p>
                  <strong>Values & Relocation Alignment:</strong> The candidate
                  specifies readiness to remain in London or relocate within
                  Europe, while prioritizing family involvement during
                  introduction stages.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B89A63]/20 text-xs font-bold text-[#B89A63]">
                  2
                </div>
                <p>
                  <strong>Progressive Discovery:</strong> Prospective matches
                  evaluate shared priorities—such as family living arrangements,
                  career aspirations, and community involvement—without viewing
                  unblurred photographs.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B89A63]/20 text-xs font-bold text-[#B89A63]">
                  3
                </div>
                <p>
                  <strong>Formal Proposal Signal:</strong> An expression of
                  interest is exchanged. Linked family guardians review the
                  verified educational credentials.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B89A63]/20 text-xs font-bold text-[#B89A63]">
                  4
                </div>
                <p>
                  <strong>Cryptographic Consent Unlock:</strong> When mutual
                  interest is ratified by both parties, high-resolution
                  photographs and secure direct messaging are unlocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="mt-20">
        <CtaSection
          title="Ready to Write Your Own Success Story?"
          description="Create your verified matrimonial passport and explore compatible individuals and families worldwide."
        />
      </div>
    </div>
  );
}
