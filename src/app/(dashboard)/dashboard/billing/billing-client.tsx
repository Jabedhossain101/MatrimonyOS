"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Crown,
  Sparkles,
  Calendar,
  ArrowRight,
  Loader2,
  XCircle,
  Info,
} from "lucide-react";
import { BillingCycle } from "@/generated/prisma";
import { cancelUserSubscriptionAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

export interface BillingPlanDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  priceMonthly: string;
  priceQuarterly: string | null;
  priceYearly: string | null;
  currency: string;
  isPopular: boolean;
  features: string[];
  entitlements: Array<{
    key: string;
    value: string;
  }>;
}

export interface ActiveSubscriptionDto {
  id: string;
  status: string;
  billingCycle: BillingCycle;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentProvider: string | null;
  plan: {
    id: string;
    name: string;
    code: string;
  };
}

interface BillingClientProps {
  plans: BillingPlanDto[];
  activeSubscription: ActiveSubscriptionDto | null;
  resolvedEntitlements: Record<string, string>;
  paymentsEnabled: boolean;
  isSandbox: boolean;
}

export function BillingClient({
  plans,
  activeSubscription,
  resolvedEntitlements,
  paymentsEnabled,
  isSandbox,
}: BillingClientProps) {
  const router = useRouter();
  const [selectedCycle, setSelectedCycle] = React.useState<BillingCycle>(
    BillingCycle.MONTHLY
  );
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelImmediate, setCancelImmediate] = React.useState(false);
  const [canceling, setCanceling] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const getPriceForCycle = (plan: BillingPlanDto, cycle: BillingCycle): string => {
    if (plan.code === "FREE") return "0.00";
    if (cycle === BillingCycle.QUARTERLY && plan.priceQuarterly) {
      return plan.priceQuarterly;
    }
    if (cycle === BillingCycle.YEARLY && plan.priceYearly) {
      return plan.priceYearly;
    }
    return plan.priceMonthly;
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubscription || cancelReason.trim().length < 5) return;

    setCanceling(true);
    setFeedback(null);

    const res = await cancelUserSubscriptionAction({
      subscriptionId: activeSubscription.id,
      reason: cancelReason.trim(),
      immediate: cancelImmediate,
    });

    setCanceling(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: res.message || "Subscription updated.",
      });
      setShowCancelModal(false);
      setCancelReason("");
      router.refresh();
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Could not cancel subscription.",
      });
    }
  };

  const currentPlanCode = activeSubscription?.plan.code || "FREE";

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-sm font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Current Subscription Summary Banner */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#14243A] px-3 py-1 text-[10px] font-bold tracking-wider text-[#B89A63] uppercase">
                <Crown className="h-3 w-3" />
                Current Membership
              </span>
              {activeSubscription ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    activeSubscription.cancelAtPeriodEnd
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {activeSubscription.cancelAtPeriodEnd
                    ? "Active (Cancels at Period End)"
                    : activeSubscription.status}
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                  Standard Free Tier
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
              {activeSubscription ? activeSubscription.plan.name : "Free Member"}
            </h1>

            {activeSubscription ? (
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#777777]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#B89A63]" />
                  <span>
                    Valid until:{" "}
                    <strong className="text-[#14243A]">
                      {new Date(
                        activeSubscription.currentPeriodEnd
                      ).toLocaleDateString()}
                    </strong>
                  </span>
                </span>
                <span>•</span>
                <span>
                  Billing Cycle:{" "}
                  <strong className="text-[#14243A]">
                    {activeSubscription.billingCycle}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Provider:{" "}
                  <strong className="text-[#14243A]">
                    {activeSubscription.paymentProvider || "BKASH"}
                  </strong>
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#777777]">
                Upgrade to Premium Concierge or Elite Global Match via verified
                bKash checkout to unlock expanded daily interests, direct photo
                attachments, and priority discovery.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/billing/history"
              className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-4 py-2 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63]"
            >
              Payment History
            </Link>
            <Link
              href="/dashboard/billing/invoices"
              className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-4 py-2 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63]"
            >
              Receipts
            </Link>
            {activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Active Entitlements Strip */}
        <div className="mt-6 border-t border-[#E8E2D5] pt-5">
          <div className="mb-2.5 text-[11px] font-bold tracking-wider text-[#777777] uppercase">
            Active Server-Enforced Entitlements
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(resolvedEntitlements).map(([key, val]) => (
              <div
                key={key}
                className="rounded-2xl border border-[#E8E2D5]/80 bg-[#FAF8F3] p-3"
              >
                <div className="text-[10px] font-semibold text-[#777777]">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 text-xs font-bold text-[#14243A]">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bKash Provider & Market Notice */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[#B89A63]/40 bg-white p-4 text-xs text-[#14243A] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B89A63]" />
          <div>
            <strong>bKash Mobile Financial Service (BDT):</strong> All
            memberships are billed in Bangladeshi Taka (BDT) through official
            bKash Checkout. Renewals are manual one-time payments—your bKash
            wallet is never auto-debited without explicit consent.
          </div>
        </div>
        <div className="shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              paymentsEnabled
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {paymentsEnabled
              ? isSandbox
                ? "bKash Sandbox Active"
                : "bKash Live Active"
              : "Gateway Disabled (Config Pending)"}
          </span>
        </div>
      </div>

      {/* Billing Cycle Selector */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#14243A]">
            Select Membership Tier & Billing Cycle
          </h2>
          <p className="text-xs text-[#777777]">
            Prices are fetched directly from the platform subscription catalog
            in BDT.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-[#E8E2D5] bg-white p-1 shadow-2xs">
          {(
            [
              { cycle: BillingCycle.MONTHLY, label: "Monthly (30 Days)" },
              { cycle: BillingCycle.QUARTERLY, label: "Quarterly (90 Days)" },
              { cycle: BillingCycle.YEARLY, label: "Yearly (365 Days)" },
            ] as const
          ).map((item) => (
            <button
              key={item.cycle}
              type="button"
              onClick={() => setSelectedCycle(item.cycle)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCycle === item.cycle
                  ? "bg-[#14243A] text-[#FAF8F3] shadow-xs"
                  : "text-[#777777] hover:text-[#14243A]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = getPriceForCycle(plan, selectedCycle);
          const isCurrentPlan = currentPlanCode === plan.code;
          const isFree = plan.code === "FREE";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 shadow-xs transition ${
                plan.isPopular
                  ? "border-[#B89A63] bg-white ring-1 ring-[#B89A63]/30"
                  : "border-[#E8E2D5] bg-white"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 right-6 rounded-full bg-[#B89A63] px-3 py-0.5 text-[10px] font-bold tracking-wider text-[#14243A] uppercase">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#B89A63] uppercase">
                    {plan.code}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#14243A]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#777777]">
                    {plan.description}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F3] p-4 border border-[#E8E2D5]/70">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-[#777777]">
                      {plan.currency}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#14243A]">
                      {Number(price).toLocaleString("en-BD", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#777777]">
                    {isFree
                      ? "Complimentary standard access"
                      : `Per ${selectedCycle.toLowerCase()} billing period`}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#14243A] uppercase">
                    Included Features
                  </div>
                  <ul className="space-y-2 text-xs text-[#333333]">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 border-t border-[#E8E2D5]/60 pt-3">
                  <div className="text-[10px] font-bold text-[#777777] uppercase">
                    Server Entitlements
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.entitlements.map((ent) => (
                      <span
                        key={ent.key}
                        className="rounded-lg bg-[#FAF8F3] px-2 py-0.5 text-[10px] font-medium text-[#14243A] border border-[#E8E2D5]"
                      >
                        {ent.key}: <strong>{ent.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8E2D5]">
                {isFree ? (
                  <div className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2.5 text-center text-xs font-semibold text-[#777777]">
                    {isCurrentPlan ? "Current Tier" : "Included Base Tier"}
                  </div>
                ) : (
                  <Link
                    href={`/dashboard/billing/checkout?planId=${plan.id}&cycle=${selectedCycle}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14243A] px-4 py-2.5 text-xs font-semibold text-[#FAF8F3] transition hover:bg-[#0B1728]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
                    <span>
                      {isCurrentPlan
                        ? `Renew ${plan.name} with bKash`
                        : `Upgrade with bKash (${plan.currency} ${price})`}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && activeSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCancelSubmit}
            className="w-full max-w-md space-y-4 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-2.5 text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Cancel {activeSubscription.plan.name}
                </h3>
                <p className="text-xs text-[#777777]">
                  Current period ends{" "}
                  {new Date(
                    activeSubscription.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Reason for Cancellation (min 5 characters)
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please share why you are cancelling..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A]"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-3 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={cancelImmediate}
                onChange={(e) => setCancelImmediate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded"
              />
              <div>
                <div className="font-semibold text-[#14243A]">
                  End membership immediately
                </div>
                <div className="text-[11px] text-[#777777]">
                  If unchecked (recommended), you keep your paid entitlements
                  until{" "}
                  {new Date(
                    activeSubscription.currentPeriodEnd
                  ).toLocaleDateString()}
                  .
                </div>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Keep Membership
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={canceling || cancelReason.trim().length < 5}
                className="rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {canceling ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                <span>Confirm Cancellation</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
