import * as React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { env, isBkashConfigured } from "@/lib/env";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { subscriptionService } from "@/server/services/subscription.service";
import { formatCanonicalAmount } from "@/server/payments/payment.types";
import {
  BillingClient,
  type ActiveSubscriptionDto,
  type BillingPlanDto,
} from "./billing-client";

export const instant = false;

export const metadata = {
  title: "Membership & bKash Billing | MatrimonyOS",
  description: "Manage your MatrimonyOS subscription tier and bKash billing.",
};

export default async function DashboardBillingPage() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing");
  }

  const [plans, activeState] = await Promise.all([
    subscriptionService.listPlans({ includeInactive: false }),
    subscriptionService.getUserActiveSubscription(user.id),
  ]);

  const formattedPlans: BillingPlanDto[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    description: p.description,
    priceMonthly: formatCanonicalAmount(p.priceMonthly),
    priceQuarterly: p.priceQuarterly
      ? formatCanonicalAmount(p.priceQuarterly)
      : null,
    priceYearly: p.priceYearly ? formatCanonicalAmount(p.priceYearly) : null,
    currency: p.currency,
    isPopular: p.isPopular,
    features: p.features,
    entitlements: p.entitlements.map((e) => ({
      key: e.key,
      value: e.value,
    })),
  }));

  const activeSubscriptionDto: ActiveSubscriptionDto | null =
    activeState.subscription
      ? {
          id: activeState.subscription.id,
          status: activeState.subscription.status,
          billingCycle: activeState.subscription.billingCycle,
          startDate: activeState.subscription.startDate.toISOString(),
          currentPeriodStart:
            activeState.subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd:
            activeState.subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: activeState.subscription.cancelAtPeriodEnd,
          canceledAt: activeState.subscription.canceledAt
            ? activeState.subscription.canceledAt.toISOString()
            : null,
          paymentProvider: activeState.subscription.paymentProvider,
          plan: {
            id: activeState.subscription.plan.id,
            name: activeState.subscription.plan.name,
            code: activeState.subscription.plan.code,
          },
        }
      : null;

  return (
    <BillingClient
      plans={formattedPlans}
      activeSubscription={activeSubscriptionDto}
      resolvedEntitlements={activeState.entitlements}
      paymentsEnabled={isBkashConfigured()}
      isSandbox={env.BKASH_IS_SANDBOX}
    />
  );
}

