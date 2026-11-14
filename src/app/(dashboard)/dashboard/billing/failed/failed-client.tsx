"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { reconcilePaymentAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

interface FailedClientProps {
  paymentId?: string;
  status?: string;
  reason?: string;
  planId?: string;
  billingCycle?: string;
  merchantInvoiceNumber?: string;
  providerPaymentId?: string | null;
}

export function FailedClient({
  paymentId,
  status = "FAILED",
  reason,
  planId,
  billingCycle,
  merchantInvoiceNumber,
  providerPaymentId,
}: FailedClientProps) {
  const router = useRouter();
  const [reconciling, setReconciling] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);

  const normalizedStatus = status.toUpperCase();
  const isPending = normalizedStatus === "PENDING" || normalizedStatus === "INITIATED";
  const isCanceled =
    normalizedStatus === "CANCELED" || normalizedStatus === "CANCELLED";

  const handleReconcile = async () => {
    if (!paymentId) return;
    setReconciling(true);
    setFeedback(null);

    try {
      const result = await reconcilePaymentAction({ paymentId });
      if (result.success) {
        setFeedback({
          type: "success",
          text: "Payment verified as Completed! Redirecting to confirmation...",
        });
        router.push(`/dashboard/billing/success?paymentId=${encodeURIComponent(paymentId)}`);
        return;
      }

      setFeedback({
        type: "info",
        text:
          result.message ||
          result.error ||
          "bKash status checked: No completed charge found.",
      });
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error while checking payment status.",
      });
    } finally {
      setReconciling(false);
    }
  };

  const retryHref = planId
    ? `/dashboard/billing/checkout?planId=${encodeURIComponent(planId)}${
        billingCycle ? `&cycle=${encodeURIComponent(billingCycle)}` : ""
      }`
    : "/dashboard/billing/checkout";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isPending
                ? "bg-amber-100 text-amber-700"
                : isCanceled
                  ? "bg-slate-100 text-slate-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {isPending ? (
              <Clock className="h-9 w-9" />
            ) : isCanceled ? (
              <AlertTriangle className="h-9 w-9" />
            ) : (
              <XCircle className="h-9 w-9" />
            )}
          </div>

          <span
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
              isPending
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : isCanceled
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            Status: {normalizedStatus}
          </span>

          <h2 className="mt-3 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            {isPending
              ? "Payment Verification Pending"
              : isCanceled
                ? "bKash Checkout Cancelled"
                : "Payment Could Not Be Completed"}
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-600">
            {reason ||
              (isPending
                ? "Your bKash transaction has not yet been confirmed as completed. No paid membership has been activated yet."
                : isCanceled
                  ? "You cancelled the bKash payment window before authorizing the transaction. Your account was not charged."
                  : "The bKash payment was declined, expired, or did not pass verification. No paid membership was activated.")}
          </p>
        </div>

        {(merchantInvoiceNumber || providerPaymentId) && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
            {merchantInvoiceNumber && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Merchant Invoice Ref</span>
                <span className="font-mono font-medium text-slate-800">
                  {merchantInvoiceNumber}
                </span>
              </div>
            )}
            {providerPaymentId && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">bKash Payment ID</span>
                <span className="font-mono text-slate-700">{providerPaymentId}</span>
              </div>
            )}
          </div>
        )}

        {feedback && (
          <div
            className={`mt-5 flex items-center gap-2.5 rounded-xl border p-3.5 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : feedback.type === "info"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {paymentId && (
            <Button
              variant="outline"
              onClick={handleReconcile}
              disabled={reconciling}
              className="w-full sm:w-auto"
            >
              {reconciling ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Querying bKash...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Re-check bKash Status
                </>
              )}
            </Button>
          )}
          <Link href={retryHref}>
            <Button variant="primary" className="w-full sm:w-auto">
              <CreditCard className="mr-1.5 h-4 w-4" />
              Try Checkout Again
            </Button>
          </Link>
          <Link href="/dashboard/billing">
            <Button variant="ghost" className="w-full sm:w-auto">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
