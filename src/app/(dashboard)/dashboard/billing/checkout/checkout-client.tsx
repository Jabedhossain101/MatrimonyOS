"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { BillingCycle } from "@/generated/prisma";
import { initiateBkashCheckoutAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";
import type { BillingPlanDto } from "../billing-client";

interface CheckoutClientProps {
  paidPlans: BillingPlanDto[];
  initialPlanId?: string;
  initialCycle?: BillingCycle;
  paymentsEnabled: boolean;
  isSandbox: boolean;
}

function createClientIdempotencyKey(planId: string, cycle: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `chk_${planId.slice(-6)}_${cycle}_${ts}_${rand}`;
}

export function CheckoutClient({
  paidPlans,
  initialPlanId,
  initialCycle = BillingCycle.MONTHLY,
  paymentsEnabled,
  isSandbox,
}: CheckoutClientProps) {
  const defaultPlan =
    paidPlans.find((p) => p.id === initialPlanId) ||
    paidPlans.find((p) => p.isPopular) ||
    paidPlans[0];

  const [selectedPlanId, setSelectedPlanId] = React.useState<string>(
    defaultPlan?.id || ""
  );
  const [selectedCycle, setSelectedCycle] =
    React.useState<BillingCycle>(initialCycle);
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>(() =>
    createClientIdempotencyKey(defaultPlan?.id || "default", initialCycle)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const selectedPlan =
    paidPlans.find((p) => p.id === selectedPlanId) || defaultPlan;

  const handlePlanOrCycleChange = (newPlanId: string, newCycle: BillingCycle) => {
    setSelectedPlanId(newPlanId);
    setSelectedCycle(newCycle);
    setIdempotencyKey(createClientIdempotencyKey(newPlanId, newCycle));
    setErrorMessage(null);
  };

  const resolveDisplayPrice = (
    plan: BillingPlanDto | undefined,
    cycle: BillingCycle
  ): string => {
    if (!plan) return "0.00";
    if (cycle === BillingCycle.QUARTERLY && plan.priceQuarterly) {
      return plan.priceQuarterly;
    }
    if (cycle === BillingCycle.YEARLY && plan.priceYearly) {
      return plan.priceYearly;
    }
    return plan.priceMonthly;
  };

  const displayAmount = resolveDisplayPrice(selectedPlan, selectedCycle);

  const handleProceedToBkash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await initiateBkashCheckoutAction({
      planId: selectedPlan.id,
      billingCycle: selectedCycle,
      idempotencyKey,
    });

    if (res.success && res.data?.checkoutUrl) {
      window.location.assign(res.data.checkoutUrl);
      return;
    }

    setSubmitting(false);
    setErrorMessage(
      res.error ||
        "Unable to initialize bKash checkout session. Please verify gateway configuration."
    );
  };

  if (!selectedPlan) {
    return (
      <div className="rounded-3xl border border-[#E8E2D5] bg-white p-8 text-center">
        <p className="text-sm text-[#777777]">
          No paid subscription plans are currently active for checkout.
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#14243A] underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Billing Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-md bg-[#14243A] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#B89A63] uppercase">
            bKash Tokenized Checkout (v1.2.0-beta)
          </span>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
            Complete Your Membership Upgrade
          </h1>
          <p className="text-xs text-[#777777]">
            Authoritative server-verified checkout in Bangladeshi Taka (BDT).
          </p>
        </div>

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3.5 py-2 text-xs font-semibold text-[#14243A] hover:border-[#B89A63]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Plans</span>
        </Link>
      </div>

      {!paymentsEnabled && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong>bKash Gateway Configuration Notice:</strong>{" "}
            <code>PAYMENTS_ENABLED</code> or bKash merchant credentials are not
            currently active in this environment. Once sandbox or live merchant
            credentials are provided on the server, checkout will redirect to
            the official bKash payment gateway.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleProceedToBkash}
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        {/* Left column: Plan & Cycle Selection */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-base font-bold text-[#14243A]">
              1. Choose Membership Tier
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {paidPlans.map((plan) => {
                const active = plan.id === selectedPlan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() =>
                      handlePlanOrCycleChange(plan.id, selectedCycle)
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#14243A] bg-[#FAF8F3] ring-1 ring-[#14243A]"
                        : "border-[#E8E2D5] bg-white hover:border-[#B89A63]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-[#B89A63] uppercase">
                        {plan.code}
                      </span>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-[#14243A]" />
                      )}
                    </div>
                    <div className="mt-1 font-serif text-base font-bold text-[#14243A]">
                      {plan.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#777777]">
                      {plan.currency}{" "}
                      {resolveDisplayPrice(plan, selectedCycle)} /{" "}
                      {selectedCycle.toLowerCase()}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <h2 className="mb-3 font-serif text-base font-bold text-[#14243A]">
                2. Select Billing Duration
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      cycle: BillingCycle.MONTHLY,
                      label: "Monthly",
                      days: "30 Days",
                    },
                    {
                      cycle: BillingCycle.QUARTERLY,
                      label: "Quarterly",
                      days: "90 Days",
                    },
                    {
                      cycle: BillingCycle.YEARLY,
                      label: "Yearly",
                      days: "365 Days",
                    },
                  ] as const
                ).map((item) => {
                  const active = selectedCycle === item.cycle;
                  return (
                    <button
                      key={item.cycle}
                      type="button"
                      onClick={() =>
                        handlePlanOrCycleChange(selectedPlan.id, item.cycle)
                      }
                      className={`rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-[#14243A] bg-[#14243A] text-[#FAF8F3]"
                          : "border-[#E8E2D5] bg-[#FAF8F3] text-[#14243A] hover:border-[#B89A63]"
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div
                        className={`text-[10px] ${
                          active ? "text-[#B89A63]" : "text-[#777777]"
                        }`}
                      >
                        {item.days}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-base font-bold text-[#14243A]">
              3. Payment Method (Bangladesh MFS)
            </h2>
            <div className="flex items-center justify-between rounded-2xl border border-[#B89A63] bg-[#FAF8F3] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-xs font-extrabold text-white">
                  bKash
                </div>
                <div>
                  <div className="text-xs font-bold text-[#14243A]">
                    bKash Official Checkout
                  </div>
                  <div className="text-[11px] text-[#777777]">
                    One-time wallet authorization in BDT •{" "}
                    {isSandbox ? "Sandbox Environment" : "Live Gateway"}
                  </div>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <p className="text-[11px] leading-relaxed text-[#777777]">
              You will be redirected to the official bKash secure payment page
              to enter your bKash account number, OTP, and PIN. MatrimonyOS
              never collects or stores your bKash PIN or OTP.
            </p>
          </div>
        </div>

        {/* Right column: Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-32 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-[#E8E2D5] pb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#B89A63] uppercase">
                Order Summary
              </span>
              <h3 className="mt-1 font-serif text-lg font-bold text-[#14243A]">
                {selectedPlan.name}
              </h3>
              <p className="text-xs text-[#777777]">
                Billing Cycle: {selectedCycle}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#777777]">
                <span>Plan Tier</span>
                <span className="font-semibold text-[#14243A]">
                  {selectedPlan.code}
                </span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Payment Currency</span>
                <span className="font-semibold text-[#14243A]">
                  BDT (Bangladeshi Taka)
                </span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Renewal Type</span>
                <span className="font-semibold text-[#14243A]">
                  Manual One-Time
                </span>
              </div>
              <div className="border-t border-[#E8E2D5] pt-3 flex items-baseline justify-between">
                <span className="font-bold text-[#14243A]">Total Payable</span>
                <span className="font-serif text-2xl font-bold text-[#14243A]">
                  BDT {displayAmount}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !paymentsEnabled}
              className="w-full rounded-xl bg-[#14243A] py-3 text-xs font-bold text-[#FAF8F3] hover:bg-[#0B1728] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Connecting to bKash...</span>
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4 text-[#B89A63]" />
                  <span>Pay BDT {displayAmount} with bKash</span>
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>

            <div className="space-y-2 rounded-2xl bg-[#FAF8F3] p-3.5 text-[11px] text-[#777777] border border-[#E8E2D5]/70">
              <div className="flex items-center gap-1.5 font-semibold text-[#14243A]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Server-Verified Activation</span>
              </div>
              <p>
                Membership activates strictly after our server independently
                verifies your completed transaction with the bKash API.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#777777]/80 font-mono">
                <Lock className="h-3 w-3" />
                <span>Ref: {idempotencyKey.slice(0, 22)}...</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

