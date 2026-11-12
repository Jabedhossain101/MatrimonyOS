import * as React from "react";
import { connection } from "next/server";
import { moderationService } from "@/server/services/moderation.service";
import { ProfilesClient, type ProfileItem } from "./profiles-client";
import { ProfileModerationStatus } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "Profile Moderation | MatrimonyOS Admin",
  description: "Editorial review of matrimonial profiles and photos.",
};

interface ProfilesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function AdminProfilesPage({ searchParams }: ProfilesPageProps) {
  await connection();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const search = params.search;
  const status = params.status as ProfileModerationStatus | undefined;

  const result = await moderationService.listProfilesForModeration({
    page,
    limit,
    status,
    search,
  });

  return (
    <ProfilesClient
      initialProfiles={result.profiles as unknown as ProfileItem[]}
      total={result.total}
      currentPage={result.page}
      limit={result.limit}
    />
  );
}

