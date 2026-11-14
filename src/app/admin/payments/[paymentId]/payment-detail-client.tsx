"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  User,
  CreditCard,
  RotateCcw,
  Code2,
} from "lucide-react";
import { PaymentStatus, RefundStatus } from "@/generated/prisma";
import { reconcilePaymentAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

export interface AdminPaymentDetailDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  merchantInvoiceNumber: string;
  invoiceNumber: string | null;
  providerPaymentId: string | null;
  providerTrxId: string | null;
  customerMsisdn: string | null;
  failureCode: string | null;
  failureReason: string | null;
  paidAt: string | null;
  failedAt: string | null;
  canceledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  providerMetadataJson: string;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  refunds: {
    id: string;
    amount: string;
    currency: string;
    reason: string;
    status: RefundStatus;
    providerRefundTrxId: string | null;
    adminNotes: string | null;
    createdAt: string;
    refundedAt: string | null;
  }[];
}

interface PaymentDetailClientProps {
  payment: AdminPaymentDetailDto;
}

export function PaymentDetailClient({ payment }: PaymentDetailClientProps) {
  const router = useRouter();
  const [reconciling, setReconciling] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleReconcile = async () => {
    setReconciling(true);
    setFeedback(null);
    try {
      const res = await reconcilePaymentAction({ paymentId: payment.id });
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error || res.message || "Failed to query bKash API.",
        });
      } else {
        setFeedback({
          type: "success",
          text:
            res.message ||
            "bKash API Reconciliation complete. Payment verified and synchronized.",
        });
      }
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error during bKash reconciliation.",
      });
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/payments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All Payments
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#14243A] sm:text-2xl">
              Payment Record #{payment.merchantInvoiceNumber}
            </h1>
            <p className="font-mono text-xs text-slate-500">Internal ID: {payment.id}</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleReconcile}
          disabled={reconciling}
        >
          {reconciling ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Querying bKash...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Reconcile with bKash API
            </>
          )}
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#B89A63]" />
                <h2 className="font-serif text-lg font-bold text-[#14243A]">
                  bKash Verification & Settlement Details
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  payment.status === PaymentStatus.SUCCEEDED
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : payment.status === PaymentStatus.PENDING ||
                        payment.status === PaymentStatus.INITIATED
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {payment.status}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Amount & Currency</dt>
                <dd className="mt-1 font-serif text-xl font-bold text-slate-900">
                  ৳{Number(payment.amount).toLocaleString("en-BD")} {payment.currency}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">bKash TrxID</dt>
                <dd className="mt-1 font-mono text-sm font-bold text-emerald-700">
                  {payment.providerTrxId || "Not assigned / Unsettled"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">bKash PaymentID</dt>
                <dd className="mt-1 font-mono text-xs text-slate-800 break-all">
                  {payment.providerPaymentId || "—"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Receipt / Invoice Number</dt>
                <dd className="mt-1 font-mono text-xs font-semibold text-slate-800">
                  {payment.invoiceNumber || "Generated only on SUCCEEDED"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Merchant Invoice Number</dt>
                <dd className="mt-1 font-mono text-xs text-slate-800">
                  {payment.merchantInvoiceNumber}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Customer Wallet (MSISDN)</dt>
                <dd className="mt-1 font-mono text-xs text-slate-800">
                  {payment.customerMsisdn || "—"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Idempotency Key</dt>
                <dd className="mt-1 font-mono text-xs text-slate-600 break-all">
                  {payment.idempotencyKey}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-xs text-slate-500">Timestamps</dt>
                <dd className="mt-1 text-xs text-slate-700 space-y-0.5">
                  <div>Created: {new Date(payment.createdAt).toLocaleString()}</div>
                  {payment.paidAt && (
                    <div className="text-emerald-700 font-medium">
                      Paid: {new Date(payment.paidAt).toLocaleString()}
                    </div>
                  )}
                  {payment.failedAt && (
                    <div className="text-rose-700">
                      Failed: {new Date(payment.failedAt).toLocaleString()}
                    </div>
                  )}
                </dd>
              </div>
            </dl>

            {(payment.failureCode || payment.failureReason) && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                <span className="font-bold">Provider Failure Details:</span>{" "}
                {payment.failureCode ? `[Code ${payment.failureCode}] ` : ""}
                {payment.failureReason}
              </div>
            )}
          </div>

          {/* Refunds Section */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <h2 className="font-serif text-lg font-bold text-[#14243A]">
                  Refund Records ({payment.refunds.length})
                </h2>
              </div>
              <Link href="/admin/refunds">
                <Button variant="outline" size="sm">
                  Go to Refund Queue
                </Button>
              </Link>
            </div>

            {payment.refunds.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No refund requests or completed refunds associated with this payment.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {payment.refunds.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        ৳{Number(r.amount).toLocaleString("en-BD")} {r.currency}
                      </span>
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-semibold text-purple-800">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-700">Reason: {r.reason}</p>
                    {r.providerRefundTrxId && (
                      <p className="font-mono text-emerald-700 font-semibold">
                        bKash RefundTrxID: {r.providerRefundTrxId}
                      </p>
                    )}
                    {r.adminNotes && (
                      <p className="text-slate-500">Admin Notes: {r.adminNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provider Metadata Audit */}
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Code2 className="h-4 w-4 text-slate-500" />
              <h3 className="font-serif text-sm font-bold text-[#14243A]">
                Sanitized Provider Verification Metadata
              </h3>
            </div>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100">
              {payment.providerMetadataJson}
            </pre>
          </div>
        </div>

        {/* Right Column: Member & Subscription Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <User className="h-4 w-4 text-[#B89A63]" />
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Member Account
              </h3>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">{payment.userName}</p>
              <p className="text-xs text-slate-600">{payment.userEmail}</p>
              <p className="font-mono text-[11px] text-slate-400">
                User ID: {payment.userId}
              </p>
              <div className="pt-2">
                <Link
                  href={`/admin/users/${payment.userId}`}
                  className="text-xs font-semibold text-[#be123c] hover:underline"
                >
                  View Member in Admin →
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-xs">
            <h3 className="font-serif text-base font-bold text-[#14243A] border-b border-slate-200 pb-3">
              Plan & Subscription Link
            </h3>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Plan</span>
                <span className="font-semibold text-slate-900">
                  {payment.planName} ({payment.planTier})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Cycle</span>
                <span className="font-semibold text-slate-900">
                  {payment.billingCycle}
                </span>
              </div>
              {payment.subscription ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Status</span>
                    <span className="font-semibold text-emerald-700">
                      {payment.subscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period Start</span>
                    <span className="text-slate-700">
                      {new Date(
                        payment.subscription.currentPeriodStart
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period End</span>
                    <span className="text-slate-700">
                      {new Date(
                        payment.subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                <p className="pt-2 text-slate-500 italic">
                  No active subscription linked to this payment attempt.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
