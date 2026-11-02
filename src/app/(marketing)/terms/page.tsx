import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { FileCheck, Info } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions (Draft) | MatrimonyOS",
  description:
    "Our initial informational terms and conditions draft governing account registration, matrimonial code of conduct, and service usage on MatrimonyOS.",
};

export default function TermsPage() {
  return (
    <div className="py-12 sm:py-20">
      <Container size="md">
        <Breadcrumb
          items={[{ label: "Terms and Conditions" }]}
          className="mb-8"
        />

        <div className="space-y-4 border-b border-[#E8E2D5] pb-8">
          <Badge variant="gold">
            <FileCheck className="h-3 w-3" />
            Terms of Service
          </Badge>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
            Terms and Conditions
          </h1>
          <p className="text-xs text-[#777777]">
            Last Updated: November 2026 • Initial Informational Working Draft
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong>Informational Draft Notice:</strong> These terms are an
              initial draft for interface preview purposes. Final legally
              binding terms tailored to each operating jurisdiction will be
              reviewed by legal counsel and published prior to active membership
              enrollment.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-10 space-y-8 text-xs leading-relaxed text-[#333333] sm:text-sm">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              1. Platform Purpose & Eligibility
            </h2>
            <p>
              MatrimonyOS is exclusively intended for adults seeking genuine,
              lawful matrimonial matchmaking for themselves or their family
              members. To register or maintain an account, you must:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-[#777777]">
              <li>
                Be at least 18 years of age (or the legal age of majority in
                your jurisdiction).
              </li>
              <li>
                Be legally eligible to marry under the laws of your country of
                residence and citizenship.
              </li>
              <li>
                Provide truthful, current, and verifiable personal information.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              2. Code of Respectful Conduct
            </h2>
            <p>
              Members and family guardians agree to interact with dignity.
              Prohibited conduct includes:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-[#777777]">
              <li>
                Misrepresenting age, education, marital status, or photographs.
              </li>
              <li>
                Harassment, offensive language, or unsolicited commercial
                promotion.
              </li>
              <li>
                Copying, screenshotting, or distributing other members&apos;
                photographs or biodata outside the platform without explicit
                written authorization.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              3. Verification & Identity Standards
            </h2>
            <p>
              To maintain the integrity of our community, MatrimonyOS may
              request proof of identification (NID, Passport, or institutional
              credentials). We reserve the right to suspend or terminate
              accounts that fail authenticity checks or breach community
              guidelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              4. Memberships & Proposed Pricing
            </h2>
            <p>
              Proposed membership plans (Standard, Premium, Elite) displayed on
              this platform represent intended pricing tiers for upcoming
              commercial launch. We pledge transparent billing with zero hidden
              renewals or predatory traps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              5. Limitation of Liability
            </h2>
            <p>
              MatrimonyOS provides communication infrastructure and
              compatibility tools. While we conduct verification checks,
              individuals and families remain solely responsible for performing
              their own due diligence, family inquiries, and background vetting
              prior to solemnizing marriage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              6. Questions Regarding Terms
            </h2>
            <p>
              For questions or clarifications, please reach out to our legal
              liaison team at{" "}
              <a
                href={`mailto:${APP_CONFIG.supportEmail}`}
                className="text-[#B89A63] underline"
              >
                {APP_CONFIG.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
