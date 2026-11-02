import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { Cookie, Info } from "lucide-react";

export const metadata = {
  title: "Cookie Policy (Draft) | MatrimonyOS",
  description:
    "Our initial informational cookie policy draft explaining essential session cookies, security tokens, and privacy-respecting practices on MatrimonyOS.",
};

export default function CookiesPage() {
  return (
    <div className="py-12 sm:py-20">
      <Container size="md">
        <Breadcrumb items={[{ label: "Cookie Policy" }]} className="mb-8" />

        <div className="space-y-4 border-b border-[#E8E2D5] pb-8">
          <Badge variant="gold">
            <Cookie className="h-3 w-3" />
            Cookie Governance
          </Badge>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
            Cookie Policy
          </h1>
          <p className="text-xs text-[#777777]">
            Last Updated: November 2026 • Initial Informational Working Draft
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong>Informational Draft Notice:</strong> This document
              outlines our intended technical use of cookies and local storage.
              We do not deploy invasive third-party tracking or behavioral
              advertising pixels.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-10 space-y-8 text-xs leading-relaxed text-[#333333] sm:text-sm">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small data files placed on your device by websites you
              visit. They are widely used to ensure websites function
              efficiently, remember user preferences, and provide necessary
              security layers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              2. How MatrimonyOS Uses Cookies
            </h2>
            <p>
              In alignment with our privacy-first philosophy, we restrict our
              use of cookies strictly to essential and functional operations:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-[#777777]">
              <li>
                <strong>Strictly Necessary Cookies:</strong> Required to
                authenticate members, maintain secure active sessions, and
                prevent cross-site request forgery (CSRF).
              </li>
              <li>
                <strong>Security & Fraud Prevention:</strong> Assist in
                rate-limiting authentication attempts and verifying trusted
                device tokens.
              </li>
              <li>
                <strong>Functional Preferences:</strong> Remember your regional
                corridor selection and accessibility preferences.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              3. No Cross-Site Advertising Pixels
            </h2>
            <p>
              We firmly refuse to embed intrusive third-party advertising pixels
              (such as social media tracking tags or ad network beacons) that
              track your browsing behavior across the web. Your visit to
              MatrimonyOS remains strictly confidential.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              4. Managing & Disabling Cookies
            </h2>
            <p>
              Most modern web browsers allow you to manage cookie preferences
              through their settings menu. Please note that disabling strictly
              necessary cookies may prevent authentication and secure dashboard
              access from functioning properly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#14243A]">
              5. Questions Regarding Cookies
            </h2>
            <p>
              For further questions regarding our cookie practices, please
              contact us at{" "}
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
