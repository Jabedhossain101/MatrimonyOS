import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { subscriptionService } from "@/server/services/subscription.service";
import { formatCanonicalAmount } from "@/server/payments/payment.types";
import { isBkashConfigured, env } from "@/lib/env";
import { BillingCycle } from "@/generated/prisma";
import { CheckoutClient } from "./checkout-client";

export const instant = false;

export const metadata = {
  title: "bKash Checkout | MatrimonyOS",
  description: "Complete your membership subscription securely via bKash Tokenized Checkout.",
};

interface CheckoutPageProps {
  searchParams: Promise<{
    planId?: string;
    cycle?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing/checkout");
  }

  const params = await searchParams;

  const plans = await subscriptionService.listPlans({ includeInactive: false });
  const paidPlans = plans
    .filter((p) => p.code !== "FREE")
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      code: plan.code,
      description: plan.description,
      currency: plan.currency,
      priceMonthly: formatCanonicalAmount(plan.priceMonthly),
      priceQuarterly: plan.priceQuarterly
        ? formatCanonicalAmount(plan.priceQuarterly)
        : null,
      priceYearly: plan.priceYearly ? formatCanonicalAmount(plan.priceYearly) : null,
      isPopular: plan.isPopular,
      features: plan.features,
      entitlements: plan.entitlements.map((e) => ({
        key: e.key,
        value: e.value,
      })),
    }));

  const validCycles: BillingCycle[] = [
    BillingCycle.MONTHLY,
    BillingCycle.QUARTERLY,
    BillingCycle.YEARLY,
  ];
  const initialCycle = validCycles.includes(params.cycle as BillingCycle)
    ? (params.cycle as BillingCycle)
    : BillingCycle.MONTHLY;

  return (
    <CheckoutClient
      paidPlans={paidPlans}
      initialPlanId={params.planId}
      initialCycle={initialCycle}
      paymentsEnabled={isBkashConfigured()}
      isSandbox={env.BKASH_IS_SANDBOX}
    />
  );
}
