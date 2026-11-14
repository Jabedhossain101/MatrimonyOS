import { connection } from "next/server";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { hasPermission, Permission } from "@/lib/permissions";
import { paymentService } from "@/server/payments/payment.service";
import { RefundsClient } from "./refunds-client";

export const instant = false;

export const metadata = {
  title: "bKash Refund Administration | MatrimonyOS Admin",
  description: "Review, execute, and verify bKash transaction refunds.",
};

export default async function AdminRefundsPage() {
  await connection();
  const admin = await requireAuthenticatedUser();

  if (!hasPermission(admin.roles, Permission.REFUND_MANAGE)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
        <h2 className="mt-3 font-serif text-xl font-bold text-rose-950">
          Access Restricted
        </h2>
        <p className="mt-1 text-sm text-rose-800">
          Moderators do not have permission to execute or manage financial refunds.
        </p>
      </div>
    );
  }

  const { refunds } = await paymentService.listRefundsForAdmin({ limit: 100 });

  const dtos = refunds.map((r) => ({
    id: r.id,
    paymentId: r.paymentId,
    userId: r.payment.userId,
    userName: r.payment.user.name || "Member",
    userEmail: r.payment.user.email,
    planName: r.payment.plan.name,
    paymentAmount: r.payment.amount.toString(),
    refundAmount: r.amount.toString(),
    currency: r.currency,
    reason: r.reason,
    status: r.status,
    merchantInvoiceNumber: r.payment.internalTransactionId,
    providerPaymentId: r.payment.providerPaymentId,
    providerOriginalTrxId: r.originalTrxId || r.payment.providerTransactionId,
    providerRefundTrxId: r.providerRefundId,
    adminNotes: r.adminNotes,
    reviewedByName: r.reviewedBy?.name ?? null,
    refundedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] sm:text-3xl">
            bKash Refund Queue & Execution
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review member refund requests and execute verified refunds via the official
            bKash API.
          </p>
        </div>

        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-semibold text-[#14243A] shadow-xs transition hover:border-[#B89A63]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Payments
        </Link>
      </div>

      <RefundsClient refunds={dtos} />
    </div>
  );
}
