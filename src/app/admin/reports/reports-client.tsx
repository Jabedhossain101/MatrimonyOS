"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { ReportStatus, ReportReason } from "@/generated/prisma";
import {
  resolveReportAction,
  assignReportAction,
} from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface ReportItem {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  reporter: {
    id: string;
    slug: string;
    fullName: string | null;
  };
  reportedProfile: {
    id: string;
    slug: string;
    fullName: string | null;
    userId: string;
    user: {
      id: string;
      email: string;
      accountStatus: string;
    };
  };
  reportedMessage: {
    id: string;
    content: string | null;
    createdAt: Date;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ReportsClientProps {
  initialReports: ReportItem[];
  total: number;
  currentPage: number;
  limit: number;
  currentUserId: string;
}

export function ReportsClient({
  initialReports,
  total,
  currentUserId,
}: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reports, setReports] = React.useState<ReportItem[]>(initialReports);
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || "");
  const [reasonFilter, setReasonFilter] = React.useState(searchParams.get("reason") || "");

  // Resolve modal state
  const [selectedReport, setSelectedReport] = React.useState<ReportItem | null>(null);
  const [resolveStatus, setResolveStatus] = React.useState<ReportStatus>(ReportStatus.RESOLVED);
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [suspendUser, setSuspendUser] = React.useState(false);
  const [suspensionReason, setSuspensionReason] = React.useState("");

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (reasonFilter) params.set("reason", reasonFilter);
    params.set("page", "1");
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleSelfAssign = async (reportId: string) => {
    setLoadingAction(`assign_${reportId}`);
    setFeedback(null);

    const res = await assignReportAction({
      reportId,
      assignedToUserId: currentUserId,
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: "Report assigned to you." });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: ReportStatus.UNDER_REVIEW,
                assignedTo: { id: currentUserId, name: "You", email: "" },
              }
            : r
        )
      );
    } else {
      setFeedback({ type: "error", message: res.error || "Assignment failed." });
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || resolutionNotes.trim().length < 5) return;

    setLoadingAction(`resolve_${selectedReport.id}`);
    setFeedback(null);

    const res = await resolveReportAction({
      reportId: selectedReport.id,
      status: resolveStatus,
      resolutionNotes,
      suspendUser,
      suspensionReason: suspendUser ? suspensionReason : undefined,
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({
        type: "success",
        message: `Report marked as ${resolveStatus}${suspendUser ? " and user suspended" : ""}.`,
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                status: resolveStatus,
                resolutionNotes,
                resolvedAt: new Date(),
              }
            : r
        )
      );
      setSelectedReport(null);
      setResolutionNotes("");
      setSuspendUser(false);
      setSuspensionReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Action failed." });
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
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Safety Moderation
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Community Safety Reports
          </h1>
          <p className="text-xs text-[#777777]">
            Investigate member harassment, fake profile alerts, and inappropriate content. Reporter confidentiality strictly maintained.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#14243A]">{total} reports in registry</span>
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
          {Object.values(ReportStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Reasons</option>
          {Object.values(ReportReason).map((r) => (
            <option key={r} value={r}>
              {r}
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

      {/* Reports Feed */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-[#E8E2D5] bg-white text-xs text-[#777777]">
            No safety reports match your query.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#E8E2D5]/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200 uppercase">
                      {report.reason}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        report.status === ReportStatus.RESOLVED
                          ? "bg-emerald-100 text-emerald-800"
                          : report.status === ReportStatus.DISMISSED
                          ? "bg-gray-100 text-gray-700"
                          : report.status === ReportStatus.UNDER_REVIEW
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      Filed on {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#14243A] mt-2">
                    Target: {report.reportedProfile.fullName || "Member"} (
                    {report.reportedProfile.user.email})
                  </h3>
                  <div className="text-xs text-[#777777] flex items-center gap-3 mt-0.5">
                    <span>
                      Account Status:{" "}
                      <strong>{report.reportedProfile.user.accountStatus}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Assigned To:{" "}
                      <strong>
                        {report.assignedTo ? report.assignedTo.name : "Unassigned"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!report.assignedTo && report.status === ReportStatus.PENDING && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelfAssign(report.id)}
                      disabled={loadingAction === `assign_${report.id}`}
                      className="rounded-xl border-[#E8E2D5] text-xs font-semibold"
                    >
                      {loadingAction === `assign_${report.id}` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      <span>Claim Report</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setResolveStatus(ReportStatus.RESOLVED);
                      setResolutionNotes(report.resolutionNotes || "");
                      setSuspendUser(false);
                      setSuspensionReason("");
                    }}
                    className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold"
                  >
                    Take Action
                  </Button>
                </div>
              </div>

              {/* Description & Message Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-2xl bg-[#FAF8F3] p-3.5 border border-[#E8E2D5]/60 space-y-1">
                  <span className="font-bold text-[#777777] text-[10px] uppercase">
                    Reporter Confidential Narrative:
                  </span>
                  <p className="text-[#14243A] leading-relaxed">
                    {report.description || "No written narrative provided."}
                  </p>
                  <span className="text-[10px] text-[#777777]/80 block pt-1">
                    Filed by: {report.reporter.fullName} (/{report.reporter.slug})
                  </span>
                </div>

                {report.reportedMessage ? (
                  <div className="rounded-2xl bg-rose-50/60 p-3.5 border border-rose-200/60 space-y-1">
                    <span className="font-bold text-rose-800 text-[10px] uppercase flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Flagged Direct Message:
                    </span>
                    <p className="text-[#14243A] italic bg-white p-2 rounded-lg border border-rose-200">
                      &ldquo;{report.reportedMessage.content}&rdquo;
                    </p>
                    <span className="text-[10px] text-[#777777] block">
                      Sent at: {new Date(report.reportedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FAF8F3] p-3.5 border border-[#E8E2D5]/60 flex items-center justify-center text-[#777777]">
                    No specific chat message attached (General profile report)
                  </div>
                )}
              </div>

              {report.resolutionNotes && (
                <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
                  <strong>Resolution Notes:</strong> {report.resolutionNotes} (Resolved on{" "}
                  {report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : "—"})
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Take Action / Resolve Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleResolveSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#14243A] text-[#B89A63]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Resolve Safety Report #{selectedReport.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-[#777777]">
                  Against: {selectedReport.reportedProfile.fullName}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">Resolution Status</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value as ReportStatus)}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              >
                <option value={ReportStatus.RESOLVED}>RESOLVED (Action taken or warning issued)</option>
                <option value={ReportStatus.DISMISSED}>DISMISSED (Invalid report or no policy breach)</option>
                <option value={ReportStatus.UNDER_REVIEW}>KEEP UNDER REVIEW</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Resolution Notes (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the findings and actions taken for audit records..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A]"
              />
            </div>

            {/* Account Restriction Toggle */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-900">
                <input
                  type="checkbox"
                  checked={suspendUser}
                  onChange={(e) => setSuspendUser(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span>Suspend reported member&apos;s account immediately</span>
              </label>

              {suspendUser && (
                <div className="pt-2 space-y-1">
                  <label className="text-[11px] font-semibold text-rose-800">
                    Suspension Audit Reason
                  </label>
                  <input
                    type="text"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Violation of safety policy..."
                    className="w-full rounded-lg border border-rose-300 bg-white p-2 text-xs text-[#14243A]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={resolutionNotes.trim().length < 5}
                className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] text-xs font-semibold"
              >
                Confirm Resolution
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

