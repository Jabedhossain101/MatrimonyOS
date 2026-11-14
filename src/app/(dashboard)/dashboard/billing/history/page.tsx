import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { paymentService } from "@/server/payments/payment.service";
import { db } from "@/server/db";
import { HistoryClient } from "./history-client";

export const instant = false;

export const metadata = {
  title: "Payment History | MatrimonyOS",
  description: "View your bKash payment transactions, refund requests, and subscription history.",
};

export default async function BillingHistoryPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing/history");
  }

  const [{ payments }, subscriptions] = await Promise.all([
    paymentService.listUserPayments({ userId: user.id }),
    db.userSubscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const paymentDtos = payments.map((p) => ({
    id: p.id,
    planName: p.plan.name,
    planTier: p.plan.code,
    billingCycle: p.billingCycle,
    amount: p.amount.toString(),
    currency: p.currency,
    status: p.status,
    merchantInvoiceNumber: p.internalTransactionId,
    invoiceNumber: p.invoiceNumber,
    providerPaymentId: p.providerPaymentId,
    providerTrxId: p.providerTransactionId,
    failureReason: p.failureReason,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    refunds: p.refunds.map((r) => ({
      id: r.id,
      amount: r.amount.toString(),
      status: r.status,
      reason: r.reason,
      providerRefundTrxId: r.providerRefundId,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  const subscriptionDtos = subscriptions.map((s) => ({
    id: s.id,
    planName: s.plan.name,
    planTier: s.plan.code,
    billingCycle: s.billingCycle,
    status: s.status,
    currentPeriodStart: s.currentPeriodStart.toISOString(),
    currentPeriodEnd: s.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    createdAt: s.createdAt.toISOString(),
  }));

  return <HistoryClient payments={paymentDtos} subscriptions={subscriptionDtos} />;
}
