import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { CtaSection } from "@/components/shared/cta-section";
import { FAQ_ITEMS } from "@/lib/demo-data";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions & Help Center | MatrimonyOS",
  description:
    "Find comprehensive answers on privacy architecture, guardian accounts, identity verification, matching algorithms, and membership fees on MatrimonyOS.",
};

export default function FaqPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="md">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: "Frequently Asked Questions" }]}
          className="mb-8"
        />

        {/* Hero Header */}
        <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            Knowledge Base
          </Badge>
          <h1 className="font-serif text-3xl leading-[1.15] font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
            Everything You Need to Know About{" "}
            <span className="text-[#B89A63] italic">MatrimonyOS.</span>
          </h1>
          <p className="text-sm leading-relaxed text-[#777777] sm:text-base">
            Search our answers regarding privacy tiers, verification standards,
            guardian co-management, and proposed membership plans.
          </p>
        </div>

        {/* Searchable Categorized Accordion */}
        <FaqAccordion items={FAQ_ITEMS} allowSearch={true} />

        {/* Still Have Questions Banner */}
        <div className="mt-16 space-y-3 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-8 text-center">
          <h3 className="font-serif text-lg font-bold text-[#14243A]">
            Have a Specific Family Question?
          </h3>
          <p className="mx-auto max-w-md text-xs text-[#777777]">
            Our advisory team is happy to speak with individuals or parents
            regarding custom corridor requirements or discreet Elite services.
          </p>
          <div className="pt-2">
            <a
              href="/contact"
              className="inline-flex items-center text-xs font-semibold text-[#B89A63] hover:underline"
            >
              Contact Our Concierge Team →
            </a>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="mt-20">
        <CtaSection
          title="Ready to Begin with Complete Privacy?"
          description="Create your verified profile today and connect with conscious individuals and families across the globe."
        />
      </div>
    </div>
  );
}
