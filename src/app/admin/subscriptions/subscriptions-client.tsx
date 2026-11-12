"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Search,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { SubscriptionStatus, BillingCycle } from "@/generated/prisma";
import { manualAdjustSubscriptionAction } from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface SubscriptionItem {
  id: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  paymentProvider: string | null;
  notes: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    matrimonialProfile: {
      slug: string;
      fullName: string | null;
    } | null;
  };
  plan: {
    id: string;
    name: string;
    code: string;
    currency: string;
    priceMonthly: number | string | { toString(): string };
  };
  events: Array<{
    id: string;
    eventType: string;
    reason: string | null;
    createdAt: Date;
  }>;
}

interface PlanOption {
  id: string;
  name: string;
  code: string;
}

interface SubscriptionsClientProps {
  initialSubscriptions: SubscriptionItem[];
  availablePlans: PlanOption[];
  total: number;
  currentPage: number;
  limit: number;
}

export function SubscriptionsClient({
  initialSubscriptions,
  availablePlans,
}: SubscriptionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscriptions] = React.useState<SubscriptionItem[]>(initialSubscriptions);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || "");
  const [planFilter, setPlanFilter] = React.useState(searchParams.get("planId") || "");

  // Manual adjustment modal
  const [showAdjustModal, setShowAdjustModal] = React.useState(false);
  const [targetUserId, setTargetUserId] = React.useState("");
  const [targetPlanId, setTargetPlanId] = React.useState(availablePlans[0]?.id || "");
  const [durationDays, setDurationDays] = React.useState(30);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.MONTHLY);
  const [adjustReason, setAdjustReason] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (planFilter) params.set("planId", planFilter);
    params.set("page", "1");
    router.push(`/admin/subscriptions?${params.toString()}`);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !targetPlanId || adjustReason.trim().length < 5) return;

    setIsLoading(true);
    setFeedback(null);

    const res = await manualAdjustSubscriptionAction({
      userId: targetUserId.trim(),
      planId: targetPlanId,
      status: SubscriptionStatus.ACTIVE,
      billingCycle,
      durationDays: Number(durationDays),
      reason: adjustReason,
    });

    setIsLoading(false);

    if (res.success) {
      setFeedback({ type: "success", message: "Subscription adjustment applied and recorded." });
      setShowAdjustModal(false);
      setTargetUserId("");
      setAdjustReason("");
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Adjustment failed." });
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
            <CreditCard className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Billing Administration
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Subscription Registry
          </h1>
          <p className="text-xs text-[#777777]">
            Review active premium memberships, grant manual administrative overrides, and inspect billing event logs.
          </p>
        </div>
        <div>
          <Button
            onClick={() => setShowAdjustModal(true)}
            size="sm"
            className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>Grant Override</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 pl-9 pr-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Statuses</option>
          {Object.values(SubscriptionStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Plans</option>
          {availablePlans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <Button
          onClick={applyFilters}
          size="sm"
          className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] px-4 text-xs font-semibold"
        >
          Apply Filters
        </Button>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E8E2D5] bg-[#FAF8F3] text-[11px] font-bold text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Plan Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Active Period</th>
                <th className="py-3.5 px-4">Provider / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5]/50 text-[#14243A]">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#777777]">
                    No subscription records found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAF8F3]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-xs">
                        {sub.user.matrimonialProfile?.fullName || sub.user.name}
                      </div>
                      <div className="text-[11px] text-[#777777]">{sub.user.email}</div>
                      <div className="text-[9px] text-[#777777]/80 font-mono">UID: {sub.user.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-[#B89A63]/20 px-2 py-0.5 text-[10px] font-bold text-[#B89A63] border border-[#B89A63]/30">
                        {sub.plan.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          sub.status === SubscriptionStatus.ACTIVE
                            ? "bg-emerald-100 text-emerald-800"
                            : sub.status === SubscriptionStatus.EXPIRED
                            ? "bg-gray-100 text-gray-700"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{sub.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold">{sub.billingCycle}</span>
                    </td>

                    <td className="py-3.5 px-4 text-[#777777] text-[11px]">
                      <div>Start: {new Date(sub.startDate).toLocaleDateString()}</div>
                      <div>End: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-[11px] font-semibold text-[#14243A]">
                        {sub.paymentProvider || "MANUAL"}
                      </div>
                      {sub.notes && (
                        <div className="text-[10px] text-[#777777] truncate max-w-xs">
                          {sub.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Override Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#14243A] text-[#B89A63]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Grant Administrative Override
                </h3>
                <p className="text-xs text-[#777777]">
                  Provision or extend membership plan tier for a user.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">Target User ID</label>
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="User CUID (e.g. cm...)"
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs text-[#14243A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Plan Tier</label>
                <select
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                >
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              >
                <option value={BillingCycle.MONTHLY}>MONTHLY</option>
                <option value={BillingCycle.QUARTERLY}>QUARTERLY</option>
                <option value={BillingCycle.YEARLY}>YEARLY</option>
                <option value={BillingCycle.LIFETIME}>LIFETIME</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Mandatory Administrative Reason (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason for promotional grant, customer dispute resolution, or VIP tier..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs text-[#14243A]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustModal(false)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || adjustReason.trim().length < 5}
                className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Apply Override</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

