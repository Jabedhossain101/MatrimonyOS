import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { paymentService } from "@/server/payments/payment.service";
import { InvoicesClient } from "./invoices-client";

export const instant = false;

export const metadata = {
  title: "Paid Receipts & Invoices | MatrimonyOS",
  description: "View and print your official verified bKash payment receipts.",
};

export default async function BillingInvoicesPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing/invoices");
  }

  const verifiedPayments = await paymentService.listUserInvoices(user.id);

  const receipts = verifiedPayments.map((p) => ({
    id: p.id,
    invoiceNumber: p.invoiceNumber || p.internalTransactionId,
    merchantInvoiceNumber: p.internalTransactionId,
    providerPaymentId: p.providerPaymentId,
    providerTrxId: p.providerTransactionId,
    customerMsisdn: p.customerMsisdn,
    amount: p.amount.toString(),
    currency: p.currency,
    status: p.status,
    billingCycle: p.billingCycle,
    planName: p.plan.name,
    planTier: p.plan.code,
    paidAt: (p.paidAt || p.createdAt).toISOString(),
    periodStart: p.subscription
      ? p.subscription.currentPeriodStart.toISOString()
      : null,
    periodEnd: p.subscription
      ? p.subscription.currentPeriodEnd.toISOString()
      : null,
    customerName: user.name || "MatrimonyOS Member",
    customerEmail: user.email,
  }));

  return <InvoicesClient receipts={receipts} />;
}
