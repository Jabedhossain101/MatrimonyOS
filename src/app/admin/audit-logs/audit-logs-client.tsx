"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  History,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AuditLogItem {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
    roles: Array<{ role: string }>;
  };
}

interface AuditLogsClientProps {
  initialLogs: AuditLogItem[];
  total: number;
  currentPage: number;
  limit: number;
}

export function AuditLogsClient({
  initialLogs,
  total,
  currentPage,
  limit,
}: AuditLogsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs] = React.useState<AuditLogItem[]>(initialLogs);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [entityFilter, setEntityFilter] = React.useState(searchParams.get("entityType") || "");
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (entityFilter) params.set("entityType", entityFilter);
    params.set("page", "1");
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Compliance Ledger
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-[#777777]">
            Append-only historical ledger capturing sensitive administrative operations, role modifications, and moderation decisions.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#14243A]">{total} ledger records</span>
          <p className="text-[10px] text-[#777777]">Immutable • Read-Only</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
          <input
            type="text"
            placeholder="Search action, actor, target entity, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 pl-9 pr-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Entity Types</option>
          <option value="USER">USER</option>
          <option value="USER_ROLE">USER_ROLE</option>
          <option value="PROFILE">PROFILE</option>
          <option value="PHOTO">PHOTO</option>
          <option value="VERIFICATION">VERIFICATION</option>
          <option value="REPORT">REPORT</option>
          <option value="SUBSCRIPTION_PLAN">SUBSCRIPTION_PLAN</option>
          <option value="USER_SUBSCRIPTION">USER_SUBSCRIPTION</option>
          <option value="SETTING">SETTING</option>
        </select>

        <Button
          onClick={applyFilters}
          size="sm"
          className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] px-4 text-xs font-semibold"
        >
          Apply Filters
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E8E2D5] bg-[#FAF8F3] text-[11px] font-bold text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5]/50 text-[#14243A]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#777777]">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F3]/60 transition">
                    <td className="py-3.5 px-4 text-[#777777] font-mono text-[11px] shrink-0">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-xs">{log.actor.name}</div>
                      <div className="text-[11px] text-[#777777]">{log.actor.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs">{log.entityType}</div>
                      <div className="text-[10px] text-[#777777] font-mono truncate max-w-[120px]">
                        ID: {log.entityId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs max-w-xs">
                      {log.reason ? (
                        <p className="truncate text-[#14243A]">{log.reason}</p>
                      ) : (
                        <span className="text-[11px] text-[#777777] italic">No reason logged</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg border border-[#E8E2D5] px-2.5 py-1 text-[11px] font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63]"
                      >
                        <Eye className="h-3.5 w-3.5 inline mr-1" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="border-t border-[#E8E2D5] p-4 flex items-center justify-between text-xs text-[#777777]">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="rounded-lg border border-[#E8E2D5] p-1.5 hover:bg-[#FAF8F3] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="rounded-lg border border-[#E8E2D5] p-1.5 hover:bg-[#FAF8F3] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Audit Record #{selectedLog.id.slice(0, 10)}
                </h3>
                <span className="text-xs font-mono text-[#B89A63]">{selectedLog.action}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF8F3] p-3 border border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold">Actor:</span>
                  <div className="font-bold">{selectedLog.actor.name}</div>
                  <div className="text-[11px] text-[#777777]">{selectedLog.actor.email}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold">Target:</span>
                  <div className="font-bold">{selectedLog.entityType}</div>
                  <div className="text-[11px] font-mono">{selectedLog.entityId}</div>
                </div>
              </div>

              {selectedLog.reason && (
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold block mb-1">
                    Logged Reason:
                  </span>
                  <p className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E2D5] text-[#14243A]">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {Boolean(selectedLog.metadata) && (
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold block mb-1">
                    Metadata Payload:
                  </span>
                  <pre className="p-3 rounded-xl bg-[#14243A] text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-between text-[10px] text-[#777777] pt-2 border-t border-[#E8E2D5]">
                <span>IP: {selectedLog.ipAddress || "Internal"}</span>
                <span>Timestamp: {new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

