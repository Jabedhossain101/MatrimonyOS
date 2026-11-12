import * as React from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { moderationService } from "@/server/services/moderation.service";
import { ReportsClient, type ReportItem } from "./reports-client";
import { ReportStatus, ReportReason } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "Safety Reports | MatrimonyOS Admin",
  description: "Community moderation and incident response queue.",
};

interface ReportsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    reason?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  await connection();
  const user = await getCurrentUser();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const status = params.status as ReportStatus | undefined;
  const reason = params.reason as ReportReason | undefined;

  const result = await moderationService.listReports({
    page,
    limit,
    status,
    reason,
  });

  return (
    <ReportsClient
      initialReports={result.reports as unknown as ReportItem[]}
      total={result.total}
      currentPage={result.page}
      limit={result.limit}
      currentUserId={user!.id}
    />
  );
}

