"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info, Send } from "lucide-react";

const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  region: z.string().min(1, "Please select your regional corridor."),
  topic: z.string().min(1, "Please select an inquiry category."),
  message: z.string().min(10, "Your message must be at least 10 characters."),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactFormClient() {
  const [formData, setFormData] = React.useState<ContactFormData>({
    fullName: "",
    email: "",
    region: "United Kingdom",
    topic: "General Inquiry",
    message: "",
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});
  const [submittedStatus, setSubmittedStatus] = React.useState<
    "idle" | "simulated_success"
  >("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setSubmittedStatus("idle");
      return;
    }

    setErrors({});
    // In accordance with guidelines: clearly indicate this is Phase 2 client UI validation
    setSubmittedStatus("simulated_success");
  };

  return (
    <div className="rounded-3xl border border-[#E8E2D5] bg-white p-8 shadow-[0_4px_24px_rgba(20,36,58,0.04)] sm:p-10">
      <div className="mb-6 rounded-xl border border-[#B89A63]/30 bg-[#FAF8F3] p-4 text-xs text-[#14243A]">
        <div className="mb-1 flex items-center gap-2 font-bold text-[#B89A63]">
          <Info className="h-4 w-4 shrink-0" />
          Client Form Demonstration Notice
        </div>
        <p className="text-[#777777]">
          This form executes complete client-side Zod validation. Actual
          automated email dispatch and concierge ticket routing will be
          integrated in upcoming backend phases.
        </p>
      </div>

      {submittedStatus === "simulated_success" ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="font-serif text-xl font-bold text-emerald-950">
            Form Input Validated Successfully
          </h3>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-emerald-800">
            Thank you, {formData.fullName}. Your inputs meet all validation
            rules. Once live concierge routing is enabled, your note will be
            directed to our regional corridor team in {formData.region}.
          </p>
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmittedStatus("idle");
                setFormData({
                  fullName: "",
                  email: "",
                  region: "United Kingdom",
                  topic: "General Inquiry",
                  message: "",
                });
              }}
            >
              Reset Form
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-xs font-semibold tracking-wider text-[#14243A] uppercase"
            >
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="e.g. Farhan Chowdhury"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#14243A] transition focus:ring-1 focus:outline-none ${
                errors.fullName
                  ? "border-red-400 focus:ring-red-400"
                  : "border-[#E8E2D5] focus:border-[#B89A63] focus:ring-[#B89A63]"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-semibold tracking-wider text-[#14243A] uppercase"
            >
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="name@example.com"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#14243A] transition focus:ring-1 focus:outline-none ${
                errors.email
                  ? "border-red-400 focus:ring-red-400"
                  : "border-[#E8E2D5] focus:border-[#B89A63] focus:ring-[#B89A63]"
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Regional Corridor & Category Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="region"
                className="mb-2 block text-xs font-semibold tracking-wider text-[#14243A] uppercase"
              >
                Regional Corridor *
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-[#14243A] transition focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63] focus:outline-none"
              >
                <option value="Bangladesh">Bangladesh (Dhaka / Sylhet)</option>
                <option value="United Kingdom">United Kingdom (London)</option>
                <option value="United States">United States (New York)</option>
                <option value="Canada">Canada (Toronto)</option>
                <option value="Europe">Continental Europe</option>
                <option value="Middle East">Middle East (Dubai)</option>
                <option value="Other">Other Global Diaspora</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-xs font-semibold tracking-wider text-[#14243A] uppercase"
              >
                Inquiry Category *
              </label>
              <select
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-[#14243A] transition focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63] focus:outline-none"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Elite Membership Inquiries">
                  Elite Membership Inquiries
                </option>
                <option value="Guardian Mode Assistance">
                  Guardian Mode Assistance
                </option>
                <option value="Privacy & Verification">
                  Privacy & Verification
                </option>
                <option value="Partnerships & Community">
                  Partnerships & Community
                </option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="mb-2 block text-xs font-semibold tracking-wider text-[#14243A] uppercase"
            >
              Message Details *
            </label>
            <textarea
              id="message"
              rows={5}
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="How can our concierge team assist your family?"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#14243A] transition focus:ring-1 focus:outline-none ${
                errors.message
                  ? "border-red-400 focus:ring-red-400"
                  : "border-[#E8E2D5] focus:border-[#B89A63] focus:ring-[#B89A63]"
              }`}
            />
            {errors.message && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full">
            Validate & Submit Inquiry
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
