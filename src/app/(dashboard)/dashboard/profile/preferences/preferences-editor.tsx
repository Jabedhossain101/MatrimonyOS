"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { savePartnerPreferencesAction } from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { PartnerPreference } from "@/generated/prisma";

const COUNTRIES = [
  "United Kingdom",
  "United States",
  "Canada",
  "Bangladesh",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Germany",
  "Sweden",
  "Any Country",
];

const RELIGIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Buddhism",
  "Sikhism",
  "Any Religion",
];

const MARITAL_STATUS_OPTIONS = [
  { value: "NEVER_MARRIED", label: "Never Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
  { value: "ANNULLED", label: "Annulled" },
];

interface PreferencesEditorProps {
  initialPreferences: PartnerPreference | null;
}

export function PreferencesEditor({ initialPreferences }: PreferencesEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = React.useState({
    minAge: initialPreferences?.minAge ?? 22,
    maxAge: initialPreferences?.maxAge ?? 35,
    minHeightCm: initialPreferences?.minHeightCm ?? 155,
    maxHeightCm: initialPreferences?.maxHeightCm ?? 185,
    maritalStatus: initialPreferences?.maritalStatus?.length
      ? initialPreferences.maritalStatus
      : ["NEVER_MARRIED"],
    countries: initialPreferences?.countries?.length
      ? initialPreferences.countries
      : ["United Kingdom"],
    religions: initialPreferences?.religions?.length
      ? initialPreferences.religions
      : ["Islam"],
    additionalExpectations: initialPreferences?.additionalExpectations || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await savePartnerPreferencesAction({
        minAge: Number(form.minAge),
        maxAge: Number(form.maxAge),
        minHeightCm: Number(form.minHeightCm),
        maxHeightCm: Number(form.maxHeightCm),
        maritalStatus: form.maritalStatus,
        educationLevels: [],
        professions: [],
        countries: form.countries,
        cities: [],
        nationalities: [],
        religions: form.religions,
        familyTypes: [],
        lifestyles: [],
        additionalExpectations: form.additionalExpectations || null,
      });

      if (!res.success) throw new Error(res.error);

      setStatusMsg({
        type: "success",
        text: "Partner preferences saved successfully.",
      });
      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save preferences.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8 space-y-6">
      {statusMsg && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs ${
            statusMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[#14243A]">
            Acceptable Age Range
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="number"
              min="18"
              max="80"
              value={form.minAge}
              onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })}
              className="h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
            />
            <span className="text-xs text-[#777777]">to</span>
            <input
              type="number"
              min="18"
              max="80"
              value={form.maxAge}
              onChange={(e) => setForm({ ...form, maxAge: Number(e.target.value) })}
              className="h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#14243A]">
            Acceptable Height Range (cm)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="number"
              min="120"
              max="240"
              value={form.minHeightCm}
              onChange={(e) =>
                setForm({ ...form, minHeightCm: Number(e.target.value) })
              }
              className="h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
            />
            <span className="text-xs text-[#777777]">to</span>
            <input
              type="number"
              min="120"
              max="240"
              value={form.maxHeightCm}
              onChange={(e) =>
                setForm({ ...form, maxHeightCm: Number(e.target.value) })
              }
              className="h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#14243A]">
            Acceptable Marital Status
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {MARITAL_STATUS_OPTIONS.map((opt) => {
              const isChecked = form.maritalStatus.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const updated = isChecked
                      ? form.maritalStatus.filter((s) => s !== opt.value)
                      : [...form.maritalStatus, opt.value];
                    setForm({ ...form, maritalStatus: updated });
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    isChecked
                      ? "border-[#B89A63] bg-[#B89A63]/15 text-[#14243A]"
                      : "border-[#E8E2D5] bg-white text-[#777777] hover:border-[#B89A63]/40"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#14243A]">
            Preferred Country of Residence
          </label>
          <select
            value={form.countries[0] || "United Kingdom"}
            onChange={(e) => setForm({ ...form, countries: [e.target.value] })}
            className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#14243A]">
            Preferred Religious Tradition
          </label>
          <select
            value={form.religions[0] || "Islam"}
            onChange={(e) => setForm({ ...form, religions: [e.target.value] })}
            className="mt-1 h-11 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
          >
            {RELIGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#14243A]">
            Additional Expectations, Qualities & Values
          </label>
          <textarea
            rows={4}
            value={form.additionalExpectations}
            onChange={(e) =>
              setForm({ ...form, additionalExpectations: e.target.value })
            }
            placeholder="Describe what traits, family background, mindset, and goals you cherish most in a future spouse..."
            className="mt-1 w-full rounded-xl border border-[#E8E2D5] bg-white p-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63]"
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-[#E8E2D5] pt-6">
        <Button
          type="submit"
          variant="gold"
          size="md"
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

