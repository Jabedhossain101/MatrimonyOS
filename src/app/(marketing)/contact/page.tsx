import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ContactFormClient } from "./contact-form-client";
import { APP_CONFIG, SUPPORTED_REGIONS } from "@/lib/constants";
import {
  Mail,
  MapPin,
  Globe,
  Sparkles,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Contact & Global Concierge | MatrimonyOS",
  description:
    "Get in touch with the MatrimonyOS concierge team. Inquire about Elite membership, privacy architecture, or family guardian assistance.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Contact & Support" }]} className="mb-8" />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Direct Info & Regional Hubs */}
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-4">
              <Badge variant="gold">
                <Sparkles className="h-3 w-3" />
                Matrimonial Concierge
              </Badge>
              <h1 className="font-serif text-3xl leading-tight font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
                We Are Here to Assist{" "}
                <span className="text-[#B89A63] italic">Your Family.</span>
              </h1>
              <p className="text-sm leading-relaxed text-[#777777]">
                Whether you have questions regarding our privacy architecture,
                guardian collaboration mode, or custom Elite matchmaking
                inquiries, our team is dedicated to thoughtful, confidential
                service.
              </p>
            </div>

            {/* Direct Channels */}
            <div className="space-y-4 rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
              <div className="flex items-start gap-3 text-xs text-[#333333]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#B89A63]" />
                <div>
                  <strong className="block text-[#14243A]">
                    General Concierge
                  </strong>
                  <a
                    href={`mailto:${APP_CONFIG.supportEmail}`}
                    className="text-[#777777] transition hover:text-[#B89A63]"
                  >
                    {APP_CONFIG.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#E8E2D5] pt-3 text-xs text-[#333333]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B89A63]" />
                <div>
                  <strong className="block text-[#14243A]">
                    Elite Inquiries
                  </strong>
                  <a
                    href={`mailto:${APP_CONFIG.inquiriesEmail}`}
                    className="text-[#777777] transition hover:text-[#B89A63]"
                  >
                    {APP_CONFIG.inquiriesEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#E8E2D5] pt-3 text-xs text-[#333333]">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#B89A63]" />
                <div>
                  <strong className="block text-[#14243A]">
                    Response Times
                  </strong>
                  <p className="text-[#777777]">
                    Standard inquiries answered within 24 hours (Monday to
                    Friday).
                  </p>
                </div>
              </div>
            </div>

            {/* Regional Corridors Card */}
            <div className="space-y-3 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-6">
              <h3 className="flex items-center gap-2 font-serif text-sm font-bold text-[#14243A]">
                <Globe className="h-4 w-4 text-[#B89A63]" />
                Primary Regional Hubs
              </h3>
              <p className="text-xs text-[#777777]">
                Our advisory representatives coordinate cross-border family
                connections across:
              </p>
              <ul className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium text-[#14243A]">
                {SUPPORTED_REGIONS.map((r) => (
                  <li key={r.code} className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-[#B89A63]" />
                    {r.name} ({r.hub})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <ContactFormClient />
          </div>
        </div>
      </Container>
    </div>
  );
}
