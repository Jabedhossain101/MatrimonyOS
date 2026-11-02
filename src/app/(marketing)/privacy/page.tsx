import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { ShieldCheck, Info } from "lucide-react";

export const metadata = {
  title: "Privacy Policy (Draft Framework) | MatrimonyOS",
  description:
    "Our initial informational privacy policy draft detailing data collection, consent architecture, photo encryption, and member rights on MatrimonyOS.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 sm:py-20">
      <Container size="md">
        <Breadcrumb items={[{ label: "Privacy Policy" }]} className="mb-8" />

        <div className="space-y-4 border-b border-[#E8E2D5] pb-8">
          <Badge variant="gold">
            <ShieldCheck className="h-3 w-3" />
            Governance Framework
          </Badge>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#777777]">
            Last Updated: November 2026 • Initial Informational Working Draft
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong>Informational Draft Notice:</strong> This document
              represents our initial architectural privacy framework and
              operational commitment. It is not formal certified legal counsel,
              and compliance with statutory frameworks (such as GDPR, UK Data
              Protection Act, or California CCPA) will be formally ratified and
              certified upon commercial launch.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-10 space-y-8 text-xs leading-relaxed text-[#333333] sm:text-sm">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              1. Our Foundational Privacy Philosophy
            </h2>
            <p>
              At MatrimonyOS (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the
              Platform&rdquo;), privacy is not an afterthought or an optional
              toggle—it is the foundational premise upon which our entire system
              is engineered. Unlike conventional matrimonial directories that
              broadcast biodata and photographs to the public internet,
              MatrimonyOS operates under a zero-public-index model.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              2. Information We Collect
            </h2>
            <p>
              To deliver verified matrimonial matching, we collect information
              you voluntarily provide:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-[#777777]">
              <li>
                <strong>Identity & Verification Data:</strong> Mobile telephone
                numbers (verified via one-time passcodes), government-issued
                identification (NID / Passport) for verification badges, and
                email addresses.
              </li>
              <li>
                <strong>Matrimonial Profile Biodata:</strong> Educational
                history, profession, cultural background, spiritual preferences,
                dietary choices, and family background.
              </li>
              <li>
                <strong>Photographs:</strong> Uploaded images are encrypted at
                rest and blurred by default. Unblurred access requires mutual
                cryptographic consent.
              </li>
              <li>
                <strong>Guardian Information:</strong> Contact and permission
                settings for linked family accounts.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              3. Progressive Consent & Data Revelation
            </h2>
            <p>Your personal data is revealed in structured tiers:</p>
            <ul className="list-disc space-y-1.5 pl-5 text-[#777777]">
              <li>
                <strong>Tier 1 (Discovery):</strong> Non-identifying criteria
                (education level, values, regional corridor) are visible to
                verified members. Identifying information is hidden.
              </li>
              <li>
                <strong>Tier 2 (Proposal Review):</strong> High-level biodata is
                accessible to candidates and guardians considering a formal
                interest.
              </li>
              <li>
                <strong>Tier 3 (Mutual Consent):</strong> Only after both
                candidate accounts formally accept an interest are full
                photographs and messaging channels unlocked.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              4. Data Sharing & Third Parties
            </h2>
            <p>
              We do not sell, rent, or trade your personal biodata or contact
              details to third-party data brokers, marketers, or advertisers.
              Information is only processed by trusted infrastructure vendors
              (such as cloud hosting and database providers) under strict
              confidentiality agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              5. Profile Deletion & Data Retention
            </h2>
            <p>
              You maintain complete ownership of your data. You may request
              temporary deactivation (hiding your profile from discovery) or
              permanent account deletion at any time. Upon verified deletion,
              your biodata and uploaded media are purged from active database
              systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              6. Contact Our Privacy Office
            </h2>
            <p>
              For inquiries regarding this privacy framework, please contact our
              data governance team at{" "}
              <a
                href={`mailto:${APP_CONFIG.supportEmail}`}
                className="text-[#B89A63] underline"
              >
                {APP_CONFIG.supportEmail}
              </a>
              .
            </p>
            <p className="text-[11px] text-[#777777]">
              Mailing Address Placeholder: MatrimonyOS Legal Operations, 128
              City Road, London EC1V 2NX, United Kingdom.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
