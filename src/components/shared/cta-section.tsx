import * as React from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

interface CtaSectionProps {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export function CtaSection({
  title = "Ready for a More Dignified Matchmaking Experience?",
  description = "Join conscious individuals and families across the globe who prioritize verified identity, privacy tiers, and respectful communication.",
  primaryCtaLabel = "Create Your Profile",
  primaryCtaHref = "/about",
  secondaryCtaLabel = "Explore How It Works",
  secondaryCtaHref = "/how-it-works",
}: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#0B1728] py-20 text-center sm:py-28">
      {/* Editorial Decorative Ambient Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <div className="h-[500px] w-[500px] rounded-full border border-[#B89A63]" />
        <div className="absolute h-[700px] w-[700px] rounded-full border border-[#B89A63]" />
      </div>

      <Container size="md" className="relative z-10">
        <div className="mb-6 flex justify-center">
          <Badge
            variant="gold"
            className="border-[#B89A63]/40 bg-[#14243A] text-[#B89A63]"
          >
            <ShieldCheck className="h-3 w-3" />
            Global Privacy-First Architecture
          </Badge>
        </div>

        <h2 className="font-serif text-3xl leading-tight font-bold tracking-tight text-[#FAF8F3] sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#EEE8DC]/80 sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="gold"
            size="lg"
            href={primaryCtaHref}
            className="shadow-[0_10px_25px_rgba(184,154,99,0.25)]"
          >
            {primaryCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            href={secondaryCtaHref}
            className="border-[#EEE8DC]/30 bg-transparent text-[#FAF8F3] hover:border-[#B89A63] hover:bg-[#14243A]"
          >
            <HeartHandshake className="h-4 w-4 text-[#B89A63]" />
            {secondaryCtaLabel}
          </Button>
        </div>

        <p className="mt-8 text-[11px] text-[#EEE8DC]/60">
          Zero public image indexing • 100% Consent-gated conversations •
          Non-intrusive family involvement
        </p>
      </Container>
    </section>
  );
}
