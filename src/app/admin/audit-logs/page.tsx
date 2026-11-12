import * as React from "react";
import { connection } from "next/server";
import { auditService } from "@/server/services/audit.service";
import { AuditLogsClient, type AuditLogItem } from "./audit-logs-client";

export const instant = false;

export const metadata = {
  title: "Audit Logs | MatrimonyOS Admin",
  description: "Immutable compliance and administrative action ledger.",
};

interface AuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    entityType?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await connection();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const search = params.search;
  const entityType = params.entityType;

  const result = await auditService.list({
    page,
    limit,
    search,
    entityType,
  });

  return (
    <AuditLogsClient
      initialLogs={result.logs as unknown as AuditLogItem[]}
      total={result.total}
      currentPage={result.page}
      limit={result.limit}
    />
  );
}

