"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileCheck2,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { VerificationStatus, VerificationType } from "@/generated/prisma";
import { reviewVerificationAction } from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface VerificationItem {
  id: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  documentUrl: string | null;
  documentType: string | null;
  rejectionReason: string | null;
  notes: string | null;
  submittedAt: Date;
  verifiedAt: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: {
    id: string;
    slug: string;
    fullName: string | null;
    isVerified: boolean;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface VerificationsClientProps {
  initialVerifications: VerificationItem[];
  total: number;
  currentPage: number;
  limit: number;
}

export function VerificationsClient({
  initialVerifications,
  total,
}: VerificationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [verifications, setVerifications] = React.useState<VerificationItem[]>(initialVerifications);
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || "");
  const [typeFilter, setTypeFilter] = React.useState(searchParams.get("type") || "");

  // Review & preview modals
  const [selectedDoc, setSelectedDoc] = React.useState<VerificationItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = React.useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [reviewNotes, setReviewNotes] = React.useState("");

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    params.set("page", "1");
    router.push(`/admin/verifications?${params.toString()}`);
  };

  const handleApprove = async (item: VerificationItem) => {
    setLoadingAction(`approve_${item.id}`);
    setFeedback(null);

    const res = await reviewVerificationAction({
      verificationId: item.id,
      action: "APPROVE",
      notes: "Identity documents verified against official parameters.",
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: `Verification for ${item.profile.fullName || item.user.name} approved.` });
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === item.id
            ? { ...v, status: VerificationStatus.APPROVED, verifiedAt: new Date() }
            : v
        )
      );
    } else {
      setFeedback({ type: "error", message: res.error || "Approval failed." });
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem || rejectionReason.trim().length < 5) return;

    setLoadingAction(`reject_${rejectModalItem.id}`);
    setFeedback(null);

    const res = await reviewVerificationAction({
      verificationId: rejectModalItem.id,
      action: "REJECT",
      rejectionReason,
      notes: reviewNotes,
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: "Verification rejected and notice dispatched." });
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === rejectModalItem.id
            ? {
                ...v,
                status: VerificationStatus.REJECTED,
                rejectionReason,
                notes: reviewNotes,
              }
            : v
        )
      );
      setRejectModalItem(null);
      setRejectionReason("");
      setReviewNotes("");
    } else {
      setFeedback({ type: "error", message: res.error || "Rejection failed." });
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Trust & Safety
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Identity Verifications
          </h1>
          <p className="text-xs text-[#777777]">
            Review government-issued identification, credentials, and verification submissions with strict privacy controls.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#14243A]">{total} submissions</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Statuses</option>
          {Object.values(VerificationStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Document Types</option>
          {Object.values(VerificationType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <Button
          onClick={applyFilters}
          size="sm"
          className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] px-4 text-xs font-semibold"
        >
          Apply Filters
        </Button>
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E8E2D5] bg-[#FAF8F3] text-[11px] font-bold text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4">Reviewer</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5]/50 text-[#14243A]">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#777777]">
                    No verification submissions matching criteria.
                  </td>
                </tr>
              ) : (
                verifications.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{item.profile.fullName || item.user.name}</span>
                        {item.profile.isVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#777777]">{item.user.email}</div>
                      <div className="text-[10px] text-[#777777]">/{item.profile.slug}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                        {item.verificationType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === VerificationStatus.APPROVED
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === VerificationStatus.REJECTED
                            ? "bg-rose-100 text-rose-800"
                            : item.status === VerificationStatus.RESUBMITTED
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{item.status}</span>
                      </span>
                      {item.rejectionReason && (
                        <p className="text-[10px] text-rose-700 mt-0.5 max-w-xs truncate">
                          Reason: {item.rejectionReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#777777] text-[11px]">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-[#777777] text-[11px]">
                      {item.reviewer ? item.reviewer.name || item.reviewer.email : "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {item.documentUrl && (
                        <button
                          onClick={() => setSelectedDoc(item)}
                          className="rounded-lg border border-[#E8E2D5] px-2.5 py-1 text-[11px] font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63]"
                        >
                          <Eye className="h-3.5 w-3.5 inline mr-1" />
                          <span>View Doc</span>
                        </button>
                      )}

                      {item.status !== VerificationStatus.APPROVED && (
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={loadingAction === `approve_${item.id}`}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          Approve
                        </button>
                      )}

                      {item.status !== VerificationStatus.REJECTED && (
                        <button
                          onClick={() => {
                            setRejectModalItem(item);
                            setRejectionReason(item.rejectionReason || "");
                          }}
                          className="rounded-lg border border-rose-300 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Inspection Lightbox Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#E8E2D5] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Confidential Verification Document
                </h3>
                <p className="text-xs text-[#777777]">
                  {selectedDoc.profile.fullName || selectedDoc.user.name} • {selectedDoc.verificationType}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl bg-gray-100 overflow-hidden border border-[#E8E2D5] flex items-center justify-center">
              {selectedDoc.documentUrl ? (
                <Image
                  src={selectedDoc.documentUrl}
                  alt="Identity Document"
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="text-xs text-[#777777]">No preview available</div>
              )}
            </div>

            <p className="text-[11px] text-[#777777] bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E2D5]">
              <strong>Security Protocol:</strong> Document displayed exclusively to authorized verification personnel. Do not download, redistribute, or capture screenshots.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Reject Verification Request
                </h3>
                <p className="text-xs text-[#777777]">
                  Candidate: {rejectModalItem.profile.fullName || rejectModalItem.user.name}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Mandatory Rejection Rationale (sent to user, min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document image is blurry, expired ID card, name mismatch..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Internal Staff Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notes for internal moderation records..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectModalItem(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={rejectionReason.trim().length < 5}
                className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

