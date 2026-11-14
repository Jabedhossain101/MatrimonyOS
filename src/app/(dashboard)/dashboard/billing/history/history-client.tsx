"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  RefreshCw,
  RotateCcw,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import { PaymentStatus, RefundStatus, SubscriptionStatus } from "@/generated/prisma";
import {
  reconcilePaymentAction,
  requestPaymentRefundAction,
} from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

export interface UserPaymentHistoryDto {
  id: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  merchantInvoiceNumber: string;
  invoiceNumber: string | null;
  providerPaymentId: string | null;
  providerTrxId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  refunds: {
    id: string;
    amount: string;
    status: RefundStatus;
    reason: string;
    providerRefundTrxId: string | null;
    createdAt: string;
  }[];
}

export interface UserSubscriptionHistoryDto {
  id: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface HistoryClientProps {
  payments: UserPaymentHistoryDto[];
  subscriptions: UserSubscriptionHistoryDto[];
}

export function HistoryClient({ payments, subscriptions }: HistoryClientProps) {
  const router = useRouter();
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [refundModalPayment, setRefundModalPayment] =
    React.useState<UserPaymentHistoryDto | null>(null);
  const [refundReason, setRefundReason] = React.useState("");
  const [submittingRefund, setSubmittingRefund] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleReconcile = async (paymentId: string) => {
    setReconcilingId(paymentId);
    setFeedback(null);
    try {
      const res = await reconcilePaymentAction({ paymentId });
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error || res.message || "Unable to verify payment status with bKash.",
        });
      } else {
        setFeedback({
          type: "success",
          text: res.message || "bKash payment verified and synchronized!",
        });
      }
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error while synchronizing payment status.",
      });
    } finally {
      setReconcilingId(null);
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalPayment) return;
    setSubmittingRefund(true);
    setFeedback(null);

    try {
      const res = await requestPaymentRefundAction({
        paymentId: refundModalPayment.id,
        amount: refundModalPayment.amount,
        reason: refundReason,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error || "Could not submit refund request.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "Refund request submitted for administrative review.",
        });
        setRefundModalPayment(null);
        setRefundReason("");
        router.refresh();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error while submitting refund request.",
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.SUCCEEDED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            SUCCEEDED
          </span>
        );
      case PaymentStatus.PENDING:
      case PaymentStatus.INITIATED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
      case PaymentStatus.REFUNDED:
      case PaymentStatus.PARTIALLY_REFUNDED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            <RotateCcw className="h-3 w-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Payment Transactions */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              bKash Payment Transactions
            </h2>
            <p className="text-xs text-slate-500">
              Complete log of your payment attempts, verified bKash TrxIDs, and refund status.
            </p>
          </div>
          <History className="h-5 w-5 text-slate-400" />
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No payment transactions recorded yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              When you upgrade your membership via bKash, your transaction records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Plan & Cycle</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">bKash References</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((p) => {
                  const hasActiveOrCompletedRefund = p.refunds.some(
                    (r) =>
                      r.status === RefundStatus.REQUESTED ||
                      r.status === RefundStatus.PROCESSING ||
                      r.status === RefundStatus.COMPLETED
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-medium text-slate-900">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                        <div>{new Date(p.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.planName}</div>
                        <div className="text-xs text-slate-500">{p.billingCycle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        ৳{Number(p.amount).toLocaleString("en-BD")}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          {p.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(p.status)}
                        {p.failureReason && p.status !== PaymentStatus.SUCCEEDED && (
                          <p className="mt-1 max-w-xs truncate text-xs text-rose-600">
                            {p.failureReason}
                          </p>
                        )}
                        {p.refunds.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {p.refunds.map((r) => (
                              <div
                                key={r.id}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                Refund: {r.status}
                                {r.providerRefundTrxId
                                  ? ` (${r.providerRefundTrxId})`
                                  : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600 space-y-0.5">
                        <div>
                          <span className="text-slate-400">Inv:</span>{" "}
                          {p.invoiceNumber || p.merchantInvoiceNumber}
                        </div>
                        {p.providerTrxId && (
                          <div className="text-emerald-700 font-semibold">
                            <span className="text-slate-400 font-normal">TrxID:</span>{" "}
                            {p.providerTrxId}
                          </div>
                        )}
                        {p.providerPaymentId && (
                          <div className="truncate max-w-[180px]">
                            <span className="text-slate-400">PID:</span>{" "}
                            {p.providerPaymentId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {(p.status === PaymentStatus.PENDING ||
                          p.status === PaymentStatus.INITIATED) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconcile(p.id)}
                            disabled={reconcilingId === p.id}
                          >
                            {reconcilingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                Verify
                              </>
                            )}
                          </Button>
                        )}
                        {p.status === PaymentStatus.SUCCEEDED && (
                          <>
                            <Link href="/dashboard/billing/invoices">
                              <Button variant="outline" size="sm">
                                <Receipt className="mr-1 h-3.5 w-3.5" />
                                Receipt
                              </Button>
                            </Link>
                            {!hasActiveOrCompletedRefund && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-rose-700"
                                onClick={() => {
                                  setRefundModalPayment(p);
                                  setRefundReason("");
                                }}
                              >
                                Request Refund
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Lifecycle History */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Subscription Periods
            </h2>
            <p className="text-xs text-slate-500">
              Historical record of your membership plans and billing cycles.
            </p>
          </div>
          <Calendar className="h-5 w-5 text-slate-400" />
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No paid subscription history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Period Start</th>
                  <th className="px-6 py-3">Period End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {sub.planName}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {sub.billingCycle}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sub.status === SubscriptionStatus.ACTIVE
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {sub.status}
                        {sub.cancelAtPeriodEnd ? " (Cancels at end)" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {new Date(sub.currentPeriodStart).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Request Modal */}
      {refundModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Request bKash Refund
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Transaction{" "}
              <span className="font-mono font-semibold text-slate-800">
                {refundModalPayment.providerTrxId}
              </span>{" "}
              for ৳{Number(refundModalPayment.amount).toLocaleString("en-BD")} BDT (
              {refundModalPayment.planName}).
            </p>

            <form onSubmit={handleRequestRefund} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Reason for Refund Request
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you are requesting a refund..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#be123c] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRefundModalPayment(null)}
                  disabled={submittingRefund}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingRefund || refundReason.trim().length < 5}
                >
                  {submittingRefund ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Refund Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
