"use client";

import * as React from "react";
import {
  Settings,
  Shield,
  Save,
  Loader2,
} from "lucide-react";
import { updatePlatformSettingAction } from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  updatedAt: Date;
  updatedBy: {
    name: string;
    email: string;
  } | null;
}

interface SettingsClientProps {
  initialSettings: SettingItem[];
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = React.useState<SettingItem[]>(initialSettings);
  const [editValues, setEditValues] = React.useState<Record<string, string>>(
    initialSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
  );

  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [reasonModalKey, setReasonModalKey] = React.useState<string | null>(null);
  const [auditReason, setAuditReason] = React.useState("");

  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSaveClick = (key: string) => {
    setReasonModalKey(key);
    setAuditReason("");
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModalKey || auditReason.trim().length < 5) return;

    const key = reasonModalKey;
    const value = editValues[key];

    setSavingKey(key);
    setFeedback(null);

    const res = await updatePlatformSettingAction({
      key,
      value,
      reason: auditReason,
    });

    setSavingKey(null);

    if (res.success) {
      setFeedback({ type: "success", message: `Platform setting '${key}' updated.` });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value, updatedAt: new Date() } : s))
      );
      setReasonModalKey(null);
      setAuditReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Update failed." });
    }
  };

  // Group by category
  const categories = Array.from(new Set(settings.map((s) => s.category)));

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Super Admin Only
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Platform Configuration
          </h1>
          <p className="text-xs text-[#777777]">
            Global system flags, safety parameters, maintenance mode, and registration controls.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {categories.map((category) => {
          const items = settings.filter((s) => s.category === category);

          return (
            <div
              key={category}
              className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4"
            >
              <div className="border-b border-[#E8E2D5] pb-3 flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#14243A] uppercase tracking-wider text-xs">
                  {category} Settings
                </h3>
                <span className="text-[10px] text-[#777777] font-semibold">
                  {items.length} parameters
                </span>
              </div>

              <div className="divide-y divide-[#E8E2D5]/50">
                {items.map((setting) => {
                  const currentValue = editValues[setting.key] ?? setting.value;
                  const isModified = currentValue !== setting.value;

                  return (
                    <div
                      key={setting.key}
                      className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs"
                    >
                      <div className="max-w-md">
                        <span className="font-mono font-bold text-xs text-[#14243A]">
                          {setting.key}
                        </span>
                        {setting.description && (
                          <p className="text-[#777777] text-[11px] mt-0.5">
                            {setting.description}
                          </p>
                        )}
                        <span className="text-[10px] text-[#777777]/80 block mt-1">
                          Last updated: {new Date(setting.updatedAt).toLocaleDateString()}
                          {setting.updatedBy ? ` by ${setting.updatedBy.name}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {setting.key === "MAINTENANCE_MODE" ||
                        setting.key === "ALLOW_REGISTRATIONS" ||
                        setting.key === "AUTO_APPROVE_PROFILES" ||
                        setting.key === "REQUIRE_VERIFICATION_FOR_MESSAGING" ? (
                          <select
                            value={currentValue}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [setting.key]: e.target.value,
                              })
                            }
                            className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs font-semibold text-[#14243A]"
                          >
                            <option value="true">ENABLED (true)</option>
                            <option value="false">DISABLED (false)</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [setting.key]: e.target.value,
                              })
                            }
                            className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] w-64"
                          />
                        )}

                        <Button
                          size="sm"
                          disabled={!isModified || savingKey === setting.key}
                          onClick={() => handleSaveClick(setting.key)}
                          className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold disabled:opacity-40"
                        >
                          {savingKey === setting.key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5 mr-1 text-[#B89A63]" />
                          )}
                          <span>Save</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Reason Confirmation Modal */}
      {reasonModalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmSave}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#14243A] text-[#B89A63]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Update Setting: {reasonModalKey}
                </h3>
                <p className="text-xs text-[#777777]">
                  New value: <strong>{editValues[reasonModalKey]}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Mandatory Audit Justification (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="State the engineering or administrative justification for this system-level change..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReasonModalKey(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={auditReason.trim().length < 5}
                className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold"
              >
                Confirm Update
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

