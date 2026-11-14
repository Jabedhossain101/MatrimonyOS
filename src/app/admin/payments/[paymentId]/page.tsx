import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { hasPermission, Permission } from "@/lib/permissions";
import { paymentService } from "@/server/payments/payment.service";
import { PaymentDetailClient } from "./payment-detail-client";

export const instant = false;

export const metadata = {
  title: "bKash Payment Details | MatrimonyOS Admin",
  description: "Detailed verification metadata, audit trail, and reconciliation for a bKash payment.",
};

interface AdminPaymentDetailPageProps {
  params: Promise<{
    paymentId: string;
  }>;
}

export default async function AdminPaymentDetailPage({
  params,
}: AdminPaymentDetailPageProps) {
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
          Moderators do not have permission to view detailed payment records.
        </p>
      </div>
    );
  }

  const { paymentId } = await params;

  let payment;
  try {
    payment = await paymentService.getPaymentForViewer({
      paymentId,
      viewerUserId: admin.id,
      isAdmin: true,
    });
  } catch {
    notFound();
  }

  const dto = {
    id: payment.id,
    userId: payment.userId,
    userName: payment.user.name || "Member",
    userEmail: payment.user.email,
    planId: payment.planId,
    planName: payment.plan.name,
    planTier: payment.plan.code,
    billingCycle: payment.billingCycle,
    amount: payment.amount.toString(),
    currency: payment.currency,
    status: payment.status,
    idempotencyKey: payment.idempotencyKey,
    merchantInvoiceNumber: payment.internalTransactionId,
    invoiceNumber: payment.invoiceNumber,
    providerPaymentId: payment.providerPaymentId,
    providerTrxId: payment.providerTransactionId,
    customerMsisdn: payment.customerMsisdn,
    failureCode: null,
    failureReason: payment.failureReason,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    failedAt: payment.failedAt ? payment.failedAt.toISOString() : null,
    canceledAt: payment.canceledAt ? payment.canceledAt.toISOString() : null,
    expiredAt: payment.expiresAt ? payment.expiresAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    providerMetadataJson: JSON.stringify(payment.metadata ?? {}, null, 2),
    subscription: payment.subscription
      ? {
          id: payment.subscription.id,
          status: payment.subscription.status,
          currentPeriodStart: payment.subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: payment.subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: payment.subscription.cancelAtPeriodEnd,
        }
      : null,
    refunds: payment.refunds.map((r) => ({
      id: r.id,
      amount: r.amount.toString(),
      currency: r.currency,
      reason: r.reason,
      status: r.status,
      providerRefundTrxId: r.providerRefundId,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
      refundedAt: r.completedAt ? r.completedAt.toISOString() : null,
    })),
  };

  return <PaymentDetailClient payment={dto} />;
}
