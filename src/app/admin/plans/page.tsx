import * as React from "react";
import { connection } from "next/server";
import { subscriptionService } from "@/server/services/subscription.service";
import { PlansClient, type PlanItem } from "./plans-client";

export const instant = false;

export const metadata = {
  title: "Subscription Plans | MatrimonyOS Admin",
  description: "Pricing tiers and server-side feature entitlements.",
};

export default async function AdminPlansPage() {
  await connection();
  const plans = await subscriptionService.listPlans({ includeInactive: true });

  return <PlansClient initialPlans={plans as unknown as PlanItem[]} />;
}

