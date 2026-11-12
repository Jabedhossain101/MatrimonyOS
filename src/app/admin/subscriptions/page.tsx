import * as React from "react";
import { connection } from "next/server";
import { subscriptionService } from "@/server/services/subscription.service";
import { SubscriptionsClient, type SubscriptionItem } from "./subscriptions-client";
import { SubscriptionStatus } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "Subscriptions | MatrimonyOS Admin",
  description: "Subscription registry and manual override controls.",
};

interface SubscriptionsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    planId?: string;
    search?: string;
  }>;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: SubscriptionsPageProps) {
  await connection();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const status = params.status as SubscriptionStatus | undefined;
  const planId = params.planId;
  const search = params.search;

  const [subscriptionsResult, plans] = await Promise.all([
    subscriptionService.listSubscriptions({
      page,
      limit,
      status,
      planId,
      search,
    }),
    subscriptionService.listPlans({ includeInactive: true }),
  ]);

  return (
    <SubscriptionsClient
      initialSubscriptions={subscriptionsResult.subscriptions as unknown as SubscriptionItem[]}
      availablePlans={plans.map((p) => ({ id: p.id, name: p.name, code: p.code }))}
      total={subscriptionsResult.total}
      currentPage={subscriptionsResult.page}
      limit={subscriptionsResult.limit}
    />
  );
}

