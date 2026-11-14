import { connection } from "next/server";
import Link from "next/link";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { hasPermission, Permission } from "@/lib/permissions";
import { paymentService } from "@/server/payments/payment.service";
import { PaymentStatus } from "@/generated/prisma";
import { PaymentsClient } from "./payments-client";

export const instant = false;

export const metadata = {
  title: "bKash Payment Administration | MatrimonyOS Admin",
  description: "Monitor, reconcile, and audit bKash Tokenized Checkout transactions.",
};

export default async function AdminPaymentsPage() {
  await connection();
  const admin = await requireAuthenticatedUser();

  if (!hasPermission(admin.roles, Permission.PAYMENT_MANAGE)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
        <h2 className="mt-3 font-serif text-xl font-bold text-rose-950">
          Access Restricted
        </h2>
        <p className="mt-1 text-sm text-rose-800">
          Moderators do not have permission to access financial and bKash payment
          administration.
        </p>
      </div>
    );
  }

  const { payments, summary } = await paymentService.listPaymentsForAdmin({
    limit: 100,
  });

  const paymentDtos = payments.map((p) => ({
    id: p.id,
    userId: p.userId,
    userName: p.user.name || "Member",
    userEmail: p.user.email,
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
    customerMsisdn: p.customerMsisdn,
    failureReason: p.failureReason,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    refundCount: p.refunds.length,
  }));

  const refundedCount = payments.filter(
    (p) =>
      p.status === PaymentStatus.REFUNDED ||
      p.status === PaymentStatus.PARTIALLY_REFUNDED
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
            bKash Payments & Reconciliation
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Official bKash Tokenized Checkout transaction ledger, status verification, and
            revenue metrics.
          </p>
        </div>

        <Link
          href="/admin/refunds"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-semibold text-[#14243A] shadow-xs transition hover:border-[#B89A63]"
        >
          <RotateCcw className="h-4 w-4 text-[#B89A63]" />
          Manage Refund Queue
        </Link>
      </div>

      <PaymentsClient
        payments={paymentDtos}
        summary={{
          totalSucceededCount: summary.succeededCount,
          totalPendingCount: summary.pendingCount,
          totalFailedCount: summary.failedCount,
          totalRefundedCount: refundedCount,
          totalRevenueBdt: summary.totalVerifiedRevenueBdt,
        }}
      />
    </div>
  );
}
