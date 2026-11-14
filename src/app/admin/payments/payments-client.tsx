"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PaymentStatus } from "@/generated/prisma";
import { reconcilePaymentAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

export interface AdminPaymentDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
  customerMsisdn: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  refundCount: number;
}

export interface AdminPaymentSummary {
  totalSucceededCount: number;
  totalPendingCount: number;
  totalFailedCount: number;
  totalRefundedCount: number;
  totalRevenueBdt: string;
}

interface PaymentsClientProps {
  payments: AdminPaymentDto[];
  summary: AdminPaymentSummary;
}

export function PaymentsClient({ payments, summary }: PaymentsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter === "SUCCEEDED" && p.status !== PaymentStatus.SUCCEEDED) {
        return false;
      }
      if (
        statusFilter === "PENDING" &&
        p.status !== PaymentStatus.PENDING &&
        p.status !== PaymentStatus.INITIATED
      ) {
        return false;
      }
      if (
        statusFilter === "FAILED" &&
        p.status !== PaymentStatus.FAILED &&
        p.status !== PaymentStatus.CANCELED &&
        p.status !== PaymentStatus.EXPIRED
      ) {
        return false;
      }
      if (
        statusFilter === "REFUNDED" &&
        p.status !== PaymentStatus.REFUNDED &&
        p.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          p.merchantInvoiceNumber.toLowerCase().includes(q) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
          (p.providerPaymentId && p.providerPaymentId.toLowerCase().includes(q)) ||
          (p.providerTrxId && p.providerTrxId.toLowerCase().includes(q)) ||
          p.userEmail.toLowerCase().includes(q) ||
          p.userName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const handleQuickReconcile = async (paymentId: string) => {
    setReconcilingId(paymentId);
    setFeedback(null);
    try {
      const res = await reconcilePaymentAction({ paymentId });
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error || res.message || "Reconciliation with bKash failed.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Payment ${paymentId.slice(-8)} reconciled: ${res.message || "Verified"}`,
        });
      }
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error during payment reconciliation.",
      });
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Verified BDT Revenue</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-[#14243A]">
            ৳{Number(summary.totalRevenueBdt).toLocaleString("en-BD")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Settled bKash payments</p>
        </div>

        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Succeeded</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-emerald-700">
            {summary.totalSucceededCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Verified TrxIDs</p>
        </div>

        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Pending / Initiated</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-amber-700">
            {summary.totalPendingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Awaiting execution/query</p>
        </div>

        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Failed / Cancelled</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-rose-700">
            {summary.totalFailedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Declined or expired</p>
        </div>

        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Refunded</span>
            <RotateCcw className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-purple-700">
            {summary.totalRefundedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Completed bKash refunds</p>
        </div>
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E2D5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "ALL", label: "All Transactions" },
            { key: "SUCCEEDED", label: "Succeeded" },
            { key: "PENDING", label: "Pending" },
            { key: "FAILED", label: "Failed / Cancelled" },
            { key: "REFUNDED", label: "Refunded" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? "bg-[#14243A] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TrxID, PaymentID, Invoice, Email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#14243A] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8E2D5] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Plan & Cycle</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">bKash References</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No bKash payment transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-semibold text-slate-900">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                      <div>{new Date(p.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.userName}</div>
                      <div className="text-xs text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.planName}</div>
                      <div className="text-xs text-slate-500">{p.billingCycle}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">
                      ৳{Number(p.amount).toLocaleString("en-BD")}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        {p.currency}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.status === PaymentStatus.SUCCEEDED
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === PaymentStatus.PENDING ||
                                p.status === PaymentStatus.INITIATED
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : p.status === PaymentStatus.REFUNDED ||
                                  p.status === PaymentStatus.PARTIALLY_REFUNDED
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.failureReason && p.status !== PaymentStatus.SUCCEEDED && (
                        <div className="mt-1 max-w-[180px] truncate text-[11px] text-rose-600">
                          {p.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 space-y-0.5">
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
                        <div className="truncate max-w-[160px]">
                          <span className="text-slate-400">PID:</span>{" "}
                          {p.providerPaymentId}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      {(p.status === PaymentStatus.PENDING ||
                        p.status === PaymentStatus.INITIATED) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReconcile(p.id)}
                          disabled={reconcilingId === p.id}
                        >
                          {reconcilingId === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3.5 w-3.5" />
                              Reconcile
                            </>
                          )}
                        </Button>
                      )}
                      <Link href={`/admin/payments/${p.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
