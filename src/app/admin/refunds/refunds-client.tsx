"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { RefundStatus } from "@/generated/prisma";
import { adminProcessRefundAction } from "@/server/actions/payment.actions";
import { Button } from "@/components/ui/button";

export interface AdminRefundItemDto {
  id: string;
  paymentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  paymentAmount: string;
  refundAmount: string;
  currency: string;
  reason: string;
  status: RefundStatus;
  merchantInvoiceNumber: string;
  providerPaymentId: string | null;
  providerOriginalTrxId: string | null;
  providerRefundTrxId: string | null;
  adminNotes: string | null;
  reviewedByName: string | null;
  refundedAt: string | null;
  createdAt: string;
}

interface RefundsClientProps {
  refunds: AdminRefundItemDto[];
}

export function RefundsClient({ refunds }: RefundsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedRefund, setSelectedRefund] =
    React.useState<AdminRefundItemDto | null>(null);
  const [actionType, setActionType] = React.useState<
    "EXECUTE_PROVIDER_REFUND" | "QUERY_STATUS" | "REJECT"
  >("EXECUTE_PROVIDER_REFUND");
  const [adminNotes, setAdminNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return refunds;
    return refunds.filter((r) => r.status === statusFilter);
  }, [refunds, statusFilter]);

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await adminProcessRefundAction({
        refundId: selectedRefund.id,
        action: actionType,
        adminNotes,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error || res.message || "Refund operation failed.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Refund #${selectedRefund.id.slice(-6)} updated. ${res.message || ""}`,
        });
        setSelectedRefund(null);
        setAdminNotes("");
        router.refresh();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Unexpected error while processing refund action.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Status Filter Bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E8E2D5] bg-white p-4">
        {[
          { key: "ALL", label: "All Requests" },
          { key: RefundStatus.REQUESTED, label: "Requested" },
          { key: RefundStatus.PROCESSING, label: "Processing" },
          { key: RefundStatus.COMPLETED, label: "Completed" },
          { key: RefundStatus.FAILED, label: "Failed" },
          { key: RefundStatus.REJECTED, label: "Rejected" },
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

      {/* Table */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8E2D5] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Requested</th>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Refund Amount</th>
                <th className="px-5 py-3.5">Reason & Notes</th>
                <th className="px-5 py-3.5">bKash References</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No refund requests found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-semibold text-slate-900">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      <div>{new Date(r.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{r.userName}</div>
                      <div className="text-xs text-slate-500">{r.userEmail}</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Plan: {r.planName}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        ৳{Number(r.refundAmount).toLocaleString("en-BD")} {r.currency}
                      </div>
                      <div className="text-xs text-slate-500">
                        of ৳{Number(r.paymentAmount).toLocaleString("en-BD")} paid
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-xs font-medium text-slate-800">{r.reason}</p>
                      {r.adminNotes && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Admin: {r.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Orig TrxID:</span>{" "}
                        {r.providerOriginalTrxId || "—"}
                      </div>
                      {r.providerRefundTrxId && (
                        <div className="text-emerald-700 font-semibold">
                          <span className="text-slate-400 font-normal">Refund TrxID:</span>{" "}
                          {r.providerRefundTrxId}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/payments/${r.paymentId}`}
                          className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-[#be123c] hover:underline"
                        >
                          View Payment <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.status === RefundStatus.COMPLETED
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === RefundStatus.REQUESTED ||
                                r.status === RefundStatus.PROCESSING
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {r.status === RefundStatus.COMPLETED ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : r.status === RefundStatus.REQUESTED ||
                          r.status === RefundStatus.PROCESSING ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {r.status !== RefundStatus.COMPLETED &&
                      r.status !== RefundStatus.REJECTED ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedRefund(r);
                            setActionType("EXECUTE_PROVIDER_REFUND");
                            setAdminNotes(r.adminNotes || "");
                          }}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Review / Execute
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRefund(r);
                            setActionType("QUERY_STATUS");
                            setAdminNotes(r.adminNotes || "");
                          }}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Query Status
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#14243A]">
              Process bKash Refund Request
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Member: <span className="font-semibold">{selectedRefund.userName}</span> |
              Amount:{" "}
              <span className="font-semibold">
                ৳{Number(selectedRefund.refundAmount).toLocaleString("en-BD")} BDT
              </span>{" "}
              | Original TrxID:{" "}
              <span className="font-mono font-semibold">
                {selectedRefund.providerOriginalTrxId}
              </span>
            </p>

            <form onSubmit={handleProcessAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Administrative Action
                </label>

                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="refundAction"
                    checked={actionType === "EXECUTE_PROVIDER_REFUND"}
                    onChange={() => setActionType("EXECUTE_PROVIDER_REFUND")}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">
                      Execute Official bKash Refund API
                    </p>
                    <p className="text-slate-500">
                      Calls bKash <code>/tokenized/checkout/payment/refund</code>. Marks
                      COMPLETED only if bKash returns <code>0000</code> and{" "}
                      <code>refundTrxID</code>, then revokes active subscription.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="refundAction"
                    checked={actionType === "QUERY_STATUS"}
                    onChange={() => setActionType("QUERY_STATUS")}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">
                      Query bKash Refund Status
                    </p>
                    <p className="text-slate-500">
                      Checks whether a previously submitted refund has settled on bKash.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/40 p-3 cursor-pointer hover:bg-rose-50">
                  <input
                    type="radio"
                    name="refundAction"
                    checked={actionType === "REJECT"}
                    onChange={() => setActionType("REJECT")}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-rose-900">Reject Refund Request</p>
                    <p className="text-rose-700">
                      Declines the member&apos;s refund request without calling bKash and logs
                      the decision in the AuditLog.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Mandatory Audit Notes (minimum 5 characters)
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter audit reason / ticket reference..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#14243A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedRefund(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || adminNotes.trim().length < 5}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Execute"
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
