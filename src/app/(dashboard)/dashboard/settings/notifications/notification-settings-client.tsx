"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, ShieldCheck, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateNotificationPreferencesAction } from "@/server/actions/notification.actions";
import type { NotificationPreferencesInput } from "@/lib/validations/notifications";

interface NotificationSettingsClientProps {
  initialPreferences: {
    inAppInterests: boolean;
    inAppMatches: boolean;
    inAppMessages: boolean;
    emailInterests: boolean;
    emailMatches: boolean;
    emailMessages: boolean;
    emailSystem: boolean;
  };
}

export function NotificationSettingsClient({
  initialPreferences,
}: NotificationSettingsClientProps) {
  const [formState, setFormState] = React.useState<NotificationPreferencesInput>({
    inAppInterests: initialPreferences.inAppInterests,
    inAppMatches: initialPreferences.inAppMatches,
    inAppMessages: initialPreferences.inAppMessages,
    emailInterests: initialPreferences.emailInterests,
    emailMatches: initialPreferences.emailMatches,
    emailMessages: initialPreferences.emailMessages,
    emailSystem: initialPreferences.emailSystem,
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const toggle = (key: keyof NotificationPreferencesInput) => {
    setFormState((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await updateNotificationPreferencesAction(formState);
      if (!res.success) {
        throw new Error(res.error || "Failed to update notification preferences.");
      }
      setSavedSuccess(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-16">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#777777] hover:text-[#14243A] transition mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Notifications</span>
          </Link>

          <h1 className="font-serif text-2xl font-bold text-[#14243A]">
            Notification Preferences
          </h1>
          <p className="mt-1 text-xs text-[#777777]">
            Decide how and when you wish to be alerted about candidate interactions and private introductions.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {savedSuccess && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Your notification preferences have been saved successfully.</span>
            </span>
            <button onClick={() => setSavedSuccess(false)} className="text-emerald-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* In-App Notifications */}
          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E8E2D5]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F2D3C] text-[#D4AF37]">
                <Bell className="h-4 w-4" />
              </div>
              <h2 className="font-serif text-base font-bold text-[#14243A]">
                In-App Notification Center
              </h2>
            </div>

            <div className="divide-y divide-[#E8E2D5]/60">
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">Matrimonial Interests</h4>
                  <p className="text-[11px] text-[#777777]">
                    Alerts when candidates send, accept, or decline matrimonial interests.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.inAppInterests}
                  onChange={() => toggle("inAppInterests")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">Mutual Matches</h4>
                  <p className="text-[11px] text-[#777777]">
                    Alerts when mutual alignment confirms, unlocking private communication.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.inAppMatches}
                  onChange={() => toggle("inAppMatches")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">Private Messages</h4>
                  <p className="text-[11px] text-[#777777]">
                    Alerts when a new message arrives from an active connection.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.inAppMessages}
                  onChange={() => toggle("inAppMessages")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E8E2D5]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B89A63] text-white">
                <Mail className="h-4 w-4" />
              </div>
              <h2 className="font-serif text-base font-bold text-[#14243A]">
                Email Notification Alerts
              </h2>
            </div>

            <div className="divide-y divide-[#E8E2D5]/60">
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">New Interest Email</h4>
                  <p className="text-[11px] text-[#777777]">
                    Receive an email when someone expresses matrimonial interest.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.emailInterests}
                  onChange={() => toggle("emailInterests")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">Mutual Match Email</h4>
                  <p className="text-[11px] text-[#777777]">
                    Receive an email when an interest is reciprocated into a mutual match.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.emailMatches}
                  onChange={() => toggle("emailMatches")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">New Message Alerts</h4>
                  <p className="text-[11px] text-[#777777]">
                    Receive an email notification when a partner sends a private message.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.emailMessages}
                  onChange={() => toggle("emailMessages")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#14243A]">Platform Announcements</h4>
                  <p className="text-[11px] text-[#777777]">
                    Periodic safety recommendations, product releases, and community updates.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.emailSystem}
                  onChange={() => toggle("emailSystem")}
                  className="h-4 w-4 rounded accent-[#B89A63]"
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-xs text-[#555555]">
            <ShieldCheck className="h-5 w-5 text-[#B89A63] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Essential security alerts (such as password changes, login verification, or account status
              updates) cannot be disabled to preserve the integrity and safety of your account.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/dashboard/notifications"
              className="rounded-xl border border-[#E8E2D5] bg-white px-4 py-2.5 text-xs font-semibold text-[#14243A] hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#0F2D3C] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1a4459] transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-[#D4AF37]" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

