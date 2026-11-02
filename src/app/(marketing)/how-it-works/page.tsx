import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { CtaSection } from "@/components/shared/cta-section";
import {
  UserPlus,
  FileText,
  Sliders,
  Compass,
  Send,
  MessageCircle,
  Lock,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "How It Works — Step-by-Step Matchmaking Guide | MatrimonyOS",
  description:
    "Explore the 6-step journey from verified profile setup to mutual consent-based family communication on MatrimonyOS.",
};

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Create Your Verified Account",
    tagline: "Authentication & Identity Verification",
    icon: UserPlus,
    description:
      "Begin by creating an account with two-factor mobile authentication. Submit your basic credentials and specify whether you are creating this profile independently or collaboratively with a parent or guardian.",
    features: [
      "Mobile OTP verification",
      "Optional Guardian Co-Management linkage",
      "Strict data protection encryption",
    ],
    statusNotice: "Account creation engine scheduled for Phase 3 launch.",
  },
  {
    step: "02",
    title: "Build Your Matrimonial Profile",
    tagline: "Comprehensive Biodata & Values",
    icon: FileText,
    description:
      "Go beyond superficial prompts. Detail your educational achievements, professional milestones, cultural roots, spiritual practices, dietary lifestyle, and family background.",
    features: [
      "Structured educational & career history",
      "Detailed lifestyle, deen, and dietary alignment",
      "Family background & generational heritage",
    ],
    statusNotice:
      "Comprehensive profile builder currently in architecture phase.",
  },
  {
    step: "03",
    title: "Define Partner Preferences",
    tagline: "Corridor & Compatibility Filters",
    icon: Sliders,
    description:
      "Specify your criteria for a compatible partner: preferred regional corridors (e.g. London, New York, Dhaka), relocation openness, educational background, and spiritual values.",
    features: [
      "Multi-country corridor filtering",
      "Relocation flexibility indicators",
      "Family involvement preference toggles",
    ],
    statusNotice: "Preference weighting algorithm scheduled for Phase 4.",
  },
  {
    step: "04",
    title: "Discover Compatible Candidates",
    tagline: "Privacy-Protected Exploration",
    icon: Compass,
    description:
      "Review profiles that match your foundational criteria. All profiles are presented with blurred or protected photographs by default, ensuring your evaluation focuses first on substance and values.",
    features: [
      "Zero public search indexing",
      "Compatibility match indicators",
      "Discreet browsing with zero footprint",
    ],
    statusNotice: "Discovery feed engine scheduled for Phase 4.",
  },
  {
    step: "05",
    title: "Express Thoughtful Interest",
    tagline: "Formal, Dignified Proposals",
    icon: Send,
    description:
      "Send a respectful interest expression to profiles you feel aligned with. Both candidate and linked family guardians receive a dignified notification with high-level compatibility details.",
    features: [
      "Polite interest signaling without unsolicited messages",
      "Guardian notification routing",
      "Transparent accept / decline states with zero awkwardness",
    ],
    statusNotice: "Interests state machine scheduled for Phase 5.",
  },
  {
    step: "06",
    title: "Connect Through Consent Communication",
    tagline: "Progressive Photo & Contact Unlock",
    icon: MessageCircle,
    description:
      "When interest is mutually confirmed, private photographs are unblurred and a secure conversation thread is unlocked. Families can coordinate formal introductory calls or in-person meetings.",
    features: [
      "Two-way cryptographic consent gating",
      "Optional guardian-moderated conversation thread",
      "Direct family introduction coordination",
    ],
    statusNotice: "Secure messaging module scheduled for Phase 5.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "How It Works" }]} className="mb-8" />

        {/* Hero Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            The MatrimonyOS Journey
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
            A Respectful Six-Step Path to{" "}
            <span className="text-[#B89A63] italic">
              Lifelong Compatibility.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-[#777777] sm:text-lg">
            We designed our process to honor traditional values while providing
            modern convenience. Here is how your journey unfolds from profile
            setup to formal engagement.
          </p>
        </div>

        {/* Steps Journey */}
        <div className="mt-20 space-y-12">
          {JOURNEY_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-[#E8E2D5] bg-white p-8 shadow-[0_4px_20px_rgba(20,36,58,0.03)] transition-all hover:border-[#B89A63]/50 sm:p-12"
            >
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                {/* Left Column: Number and Icon */}
                <div className="space-y-4 lg:col-span-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14243A] font-serif text-2xl font-bold text-[#B89A63]">
                      {item.step}
                    </span>
                    <div>
                      <span className="text-xs font-semibold tracking-wider text-[#B89A63] uppercase">
                        {item.tagline}
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#14243A] sm:text-2xl">
                        {item.title}
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-xs text-[#777777]">
                    <div className="mb-1 flex items-center gap-2 font-medium text-[#14243A]">
                      <Lock className="h-3.5 w-3.5 text-[#B89A63]" />
                      Architectural Status
                    </div>
                    <p>{item.statusNotice}</p>
                  </div>
                </div>

                {/* Right Column: Narrative & Key Features */}
                <div className="space-y-6 lg:col-span-8">
                  <p className="text-sm leading-relaxed text-[#777777] sm:text-base">
                    {item.description}
                  </p>

                  <div className="rounded-2xl border border-[#E8E2D5]/70 bg-[#FAF8F3] p-6">
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-[#14243A] uppercase">
                      Key Capabilities at this Stage:
                    </h4>
                    <ul className="grid grid-cols-1 gap-2.5 text-xs text-[#333333] sm:grid-cols-2">
                      {item.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#B89A63]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Notice */}
        <div className="mt-20 rounded-3xl border border-[#E8E2D5] bg-[#14243A] p-8 text-[#FAF8F3] sm:p-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold tracking-wider text-[#B89A63] uppercase">
              The Architectural Standard
            </span>
            <h3 className="font-serif text-2xl font-bold sm:text-3xl">
              Why Progressive Consent Changes Everything
            </h3>
            <p className="text-xs leading-relaxed text-[#EEE8DC]/80 sm:text-sm">
              Unlike legacy matrimonial services where your photos and personal
              data can be forwarded across group chats without your permission,
              MatrimonyOS introduces progressive cryptographic consent. Your
              privacy is non-negotiable at every step.
            </p>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="mt-20">
        <CtaSection
          title="Ready to Begin Your Thoughtful Search?"
          description="Create your verified matrimonial passport and explore compatible individuals and families worldwide."
        />
      </div>
    </div>
  );
}
