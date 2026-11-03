"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { savePrivacySettingsAction } from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ProfilePrivacySettings, ProfileVisibility } from "@/generated/prisma";

interface PrivacyFormProps {
  initialSettings: ProfilePrivacySettings | null;
}

export function PrivacyForm({ initialSettings }: PrivacyFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [settings, setSettings] = React.useState({
    profileVisibility: initialSettings?.profileVisibility || "MEMBERS_ONLY",
    photoVisibility: initialSettings?.photoVisibility || "MEMBERS_ONLY",
    showDateOfBirth: initialSettings?.showDateOfBirth ?? false,
    showContactInfo: initialSettings?.showContactInfo ?? false,
    showIncome: initialSettings?.showIncome ?? false,
    showEmployer: initialSettings?.showEmployer ?? false,
    showFamilyDetails: initialSettings?.showFamilyDetails ?? true,
    showLocation: initialSettings?.showLocation ?? true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await savePrivacySettingsAction(settings);
      if (!res.success) throw new Error(res.error);

      setStatusMsg({
        type: "success",
        text: "Privacy controls and visibility permissions updated successfully.",
      });
      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update privacy settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm sm:p-8 space-y-8">
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

      {/* Visibility Tiers */}
      <div className="space-y-4">
        <h3 className="font-serif text-base font-bold text-[#14243A]">
          Broad Profile Visibility
        </h3>
        <p className="text-xs text-[#777777]">
          Determine who can discover and view your matrimonial profile across MatrimonyOS.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "PUBLIC",
              label: "Public Discovery",
              desc: "Indexed in web discovery and accessible to all verified and guest visitors.",
            },
            {
              value: "MEMBERS_ONLY",
              label: "Members Only (Recommended)",
              desc: "Only registered, verified MatrimonyOS account holders can view your profile.",
            },
            {
              value: "PRIVATE",
              label: "Completely Private",
              desc: "Hidden from discovery entirely. Accessible exclusively by direct invitation.",
            },
          ].map((tier) => {
            const isSelected = settings.profileVisibility === tier.value;
            return (
              <button
                key={tier.value}
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    profileVisibility: tier.value as ProfileVisibility,
                  })
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#B89A63] bg-[#B89A63]/10 text-[#14243A] shadow-sm ring-1 ring-[#B89A63]"
                    : "border-[#E8E2D5] bg-[#FAF8F3] text-[#777777] hover:border-[#B89A63]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-[#14243A]">
                    {tier.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-[#B89A63]" />
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#777777]">
                  {tier.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Privacy */}
      <div className="border-t border-[#E8E2D5] pt-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-[#14243A]">
          Portrait & Photo Privacy
        </h3>
        <p className="text-xs text-[#777777]">
          Decide who is permitted to view your gallery and portrait images.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "PUBLIC",
              label: "Public Photos",
              desc: "Photos visible to all prospective viewers permitted by your profile tier.",
            },
            {
              value: "MEMBERS_ONLY",
              label: "Verified Members",
              desc: "Only logged-in members with active profiles can see your portrait.",
            },
            {
              value: "PRIVATE",
              label: "Discreet Request-Only",
              desc: "Portraits blurred or hidden until mutual introduction consent.",
            },
          ].map((tier) => {
            const isSelected = settings.photoVisibility === tier.value;
            return (
              <button
                key={tier.value}
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    photoVisibility: tier.value as ProfileVisibility,
                  })
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#B89A63] bg-[#B89A63]/10 text-[#14243A] shadow-sm ring-1 ring-[#B89A63]"
                    : "border-[#E8E2D5] bg-[#FAF8F3] text-[#777777] hover:border-[#B89A63]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-[#14243A]">
                    {tier.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-[#B89A63]" />
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#777777]">
                  {tier.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Field Controls */}
      <div className="border-t border-[#E8E2D5] pt-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-[#14243A]">
          Granular Attribute Discretion
        </h3>
        <p className="text-xs text-[#777777]">
          Toggle individual field visibility on public-facing views.
        </p>

        <div className="space-y-3">
          {/* DOB vs Age */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 transition hover:bg-white">
            <div>
              <span className="text-xs font-bold text-[#14243A]">
                Display Exact Date of Birth
              </span>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                When disabled, only your calculated age (e.g. &quot;27 yrs&quot;) is shown.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showDateOfBirth}
              onChange={(e) =>
                setSettings({ ...settings, showDateOfBirth: e.target.checked })
              }
              className="h-5 w-5 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
          </label>

          {/* Income */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 transition hover:bg-white">
            <div>
              <span className="text-xs font-bold text-[#14243A]">
                Display Annual Income Range
              </span>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                When disabled, your income bracket is hidden from public and non-guardian views.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showIncome}
              onChange={(e) =>
                setSettings({ ...settings, showIncome: e.target.checked })
              }
              className="h-5 w-5 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
          </label>

          {/* Employer */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 transition hover:bg-white">
            <div>
              <span className="text-xs font-bold text-[#14243A]">
                Display Employer / Company Name
              </span>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                When disabled, only your profession and job title are shown, not your company.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showEmployer}
              onChange={(e) =>
                setSettings({ ...settings, showEmployer: e.target.checked })
              }
              className="h-5 w-5 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
          </label>

          {/* Family Details */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 transition hover:bg-white">
            <div>
              <span className="text-xs font-bold text-[#14243A]">
                Display Family Background Details
              </span>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                Controls visibility of parent professions, sibling counts, and family structure.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showFamilyDetails}
              onChange={(e) =>
                setSettings({ ...settings, showFamilyDetails: e.target.checked })
              }
              className="h-5 w-5 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
          </label>

          {/* Location */}
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 transition hover:bg-white">
            <div>
              <span className="text-xs font-bold text-[#14243A]">
                Display City of Residence
              </span>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                When disabled, only your country of residence is displayed.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showLocation}
              onChange={(e) =>
                setSettings({ ...settings, showLocation: e.target.checked })
              }
              className="h-5 w-5 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
          </label>
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
              <span>Updating Privacy...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Apply Privacy Settings</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

