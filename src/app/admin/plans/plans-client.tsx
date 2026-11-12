"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  CheckCircle2,
  PlusCircle,
  Edit,
  Loader2,
} from "lucide-react";
import { upsertPlanAction } from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface PlanItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  priceMonthly: number | string | { toString(): string };
  priceQuarterly: number | string | { toString(): string } | null;
  priceYearly: number | string | { toString(): string } | null;
  currency: string;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  features: string[];
  entitlements: Array<{
    id: string;
    key: string;
    value: string;
    description: string | null;
  }>;
  _count: {
    subscriptions: number;
  };
}

interface PlansClientProps {
  initialPlans: PlanItem[];
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const router = useRouter();
  const [plans] = React.useState<PlanItem[]>(initialPlans);

  // Modal state
  const [editPlan, setEditPlan] = React.useState<PlanItem | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form fields
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priceMonthly, setPriceMonthly] = React.useState(0);
  const [priceQuarterly, setPriceQuarterly] = React.useState(0);
  const [priceYearly, setPriceYearly] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [isPopular, setIsPopular] = React.useState(false);
  const [featuresText, setFeaturesText] = React.useState("");
  const [entitlementsMap, setEntitlementsMap] = React.useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const openEditModal = (plan: PlanItem) => {
    setEditPlan(plan);
    setIsCreating(false);
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description || "");
    setPriceMonthly(Number(plan.priceMonthly) || 0);
    setPriceQuarterly(Number(plan.priceQuarterly) || 0);
    setPriceYearly(Number(plan.priceYearly) || 0);
    setIsActive(plan.isActive);
    setIsPopular(plan.isPopular);
    setFeaturesText(plan.features.join("\n"));
    setEntitlementsMap(
      plan.entitlements.reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {})
    );
  };

  const openCreateModal = () => {
    setEditPlan(null);
    setIsCreating(true);
    setName("");
    setCode("");
    setDescription("");
    setPriceMonthly(0);
    setPriceQuarterly(0);
    setPriceYearly(0);
    setIsActive(true);
    setIsPopular(false);
    setFeaturesText("");
    setEntitlementsMap({
      DAILY_INTEREST_LIMIT: "25",
      DISCOVERY_ALLOWANCE: "100",
      ADVANCED_SEARCH_FILTERS: "true",
      CAN_SEND_ATTACHMENTS: "true",
      PRIORITY_SUPPORT: "false",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const res = await upsertPlanAction({
      id: editPlan ? editPlan.id : undefined,
      name,
      code: code.toUpperCase(),
      description,
      priceMonthly: Number(priceMonthly),
      priceQuarterly: Number(priceQuarterly) || undefined,
      priceYearly: Number(priceYearly) || undefined,
      currency: "USD",
      isActive,
      isPopular,
      displayOrder: editPlan ? editPlan.displayOrder : plans.length + 1,
      features,
      entitlements: entitlementsMap,
    });

    setIsLoading(false);

    if (res.success) {
      setFeedback({ type: "success", message: res.message || "Plan saved." });
      setEditPlan(null);
      setIsCreating(false);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save plan." });
    }
  };

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
            <Layers className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Monetization
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Subscription Plans & Entitlements
          </h1>
          <p className="text-xs text-[#777777]">
            Configure tiers, discovery allowances, interest quotas, and feature flags enforced server-side.
          </p>
        </div>
        <div>
          <Button
            onClick={openCreateModal}
            size="sm"
            className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>Create Plan</span>
          </Button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl border bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 relative ${
              plan.isPopular ? "border-[#B89A63] ring-1 ring-[#B89A63]" : "border-[#E8E2D5]"
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 right-6 rounded-full bg-[#B89A63] px-3 py-0.5 text-[10px] font-bold text-[#14243A] uppercase tracking-wider">
                Popular Tier
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#14243A]">{plan.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#777777] uppercase">
                    Code: {plan.code}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    plan.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {plan.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="mt-3 font-serif text-2xl font-extrabold text-[#14243A]">
                ${Number(plan.priceMonthly).toFixed(2)}
                <span className="text-xs font-sans text-[#777777] font-normal"> / month</span>
              </div>

              {plan.description && (
                <p className="mt-2 text-xs text-[#777777] leading-relaxed">{plan.description}</p>
              )}

              {/* Entitlements preview */}
              <div className="mt-4 pt-3 border-t border-[#E8E2D5] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                  Enforced Entitlements:
                </span>
                {plan.entitlements.map((e) => (
                  <div key={e.key} className="flex items-center justify-between text-xs">
                    <span className="text-[#777777] text-[11px] font-mono">{e.key}</span>
                    <span className="font-bold text-[#14243A] text-[11px]">{e.value}</span>
                  </div>
                ))}
              </div>

              {/* Features bullets */}
              <div className="mt-4 pt-3 border-t border-[#E8E2D5] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                  Marketing Features:
                </span>
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-[#14243A]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#B89A63] shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#777777]">
                {plan._count.subscriptions} active members
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(plan)}
                className="rounded-xl border-[#E8E2D5] text-xs font-semibold"
              >
                <Edit className="h-3.5 w-3.5 mr-1 text-[#B89A63]" />
                <span>Configure</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {(editPlan || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4 my-8"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#14243A] text-[#B89A63]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  {isCreating ? "Create New Subscription Plan" : `Edit Plan: ${editPlan?.name}`}
                </h3>
                <p className="text-xs text-[#777777]">Configure pricing tiers and quota entitlements.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Plan Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Concierge"
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs text-[#14243A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Plan Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP"
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs font-mono text-[#14243A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Monthly Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Quarterly ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceQuarterly}
                  onChange={(e) => setPriceQuarterly(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Yearly ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary for member tier card..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Marketing Features (one per line)
              </label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="50 Daily Interests&#10;Direct Messaging&#10;Verified Priority Badge"
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            {/* Entitlements editor */}
            <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-3 space-y-2">
              <span className="text-xs font-bold text-[#14243A]">Database Entitlement Keys</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[#777777] font-semibold">DAILY_INTEREST_LIMIT</label>
                  <input
                    type="text"
                    value={entitlementsMap["DAILY_INTEREST_LIMIT"] || "10"}
                    onChange={(e) =>
                      setEntitlementsMap({ ...entitlementsMap, DAILY_INTEREST_LIMIT: e.target.value })
                    }
                    className="w-full rounded-lg border bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] font-semibold">DISCOVERY_ALLOWANCE</label>
                  <input
                    type="text"
                    value={entitlementsMap["DISCOVERY_ALLOWANCE"] || "50"}
                    onChange={(e) =>
                      setEntitlementsMap({ ...entitlementsMap, DISCOVERY_ALLOWANCE: e.target.value })
                    }
                    className="w-full rounded-lg border bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] font-semibold">ADVANCED_SEARCH_FILTERS</label>
                  <select
                    value={entitlementsMap["ADVANCED_SEARCH_FILTERS"] || "false"}
                    onChange={(e) =>
                      setEntitlementsMap({ ...entitlementsMap, ADVANCED_SEARCH_FILTERS: e.target.value })
                    }
                    className="w-full rounded-lg border bg-white p-1.5 text-xs"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] font-semibold">CAN_SEND_ATTACHMENTS</label>
                  <select
                    value={entitlementsMap["CAN_SEND_ATTACHMENTS"] || "false"}
                    onChange={(e) =>
                      setEntitlementsMap({ ...entitlementsMap, CAN_SEND_ATTACHMENTS: e.target.value })
                    }
                    className="w-full rounded-lg border bg-white p-1.5 text-xs"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#14243A]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#B89A63] focus:ring-[#B89A63]"
                />
                <span>Active Tier</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded text-[#B89A63] focus:ring-[#B89A63]"
                />
                <span>Highlight as Popular</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditPlan(null);
                  setIsCreating(false);
                }}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Save Plan</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

