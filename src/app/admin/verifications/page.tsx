import * as React from "react";
import { connection } from "next/server";
import { moderationService } from "@/server/services/moderation.service";
import { VerificationsClient, type VerificationItem } from "./verifications-client";
import { VerificationStatus, VerificationType } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "Identity Verifications | MatrimonyOS Admin",
  description: "Official credential verification queue.",
};

interface VerificationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    type?: string;
  }>;
}

export default async function AdminVerificationsPage({
  searchParams,
}: VerificationsPageProps) {
  await connection();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const status = params.status as VerificationStatus | undefined;
  const verificationType = params.type as VerificationType | undefined;

  const result = await moderationService.listVerificationRequests({
    page,
    limit,
    status,
    verificationType,
  });

  return (
    <VerificationsClient
      initialVerifications={result.verifications as unknown as VerificationItem[]}
      total={result.total}
      currentPage={result.page}
      limit={result.limit}
    />
  );
}

