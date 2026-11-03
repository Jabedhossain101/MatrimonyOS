import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { interestService } from "@/server/services/interest.service";
import { entitlementsService } from "@/server/services/entitlements.service";
import { InterestsClient } from "./interests-client";
import { InterestStatus } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "Matrimonial Interests | MatrimonyOS",
  description: "Manage incoming and outgoing matrimonial interests respectfully.",
};

interface InterestsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InterestsPage({ searchParams }: InterestsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/interests");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const resolvedParams = await searchParams;

  const tab = (resolvedParams.tab as string) === "sent" ? "sent" : "received";
  const statusParam = resolvedParams.status as InterestStatus | undefined;
  const page = Number(resolvedParams.page) || 1;

  const [receivedData, sentData, quota] = await Promise.all([
    interestService.getReceivedInterests(user.id, profile.id, {
      status: statusParam,
      page: tab === "received" ? page : 1,
      limit: 10,
    }),
    interestService.getSentInterests(user.id, profile.id, {
      status: statusParam,
      page: tab === "sent" ? page : 1,
      limit: 10,
    }),
    entitlementsService.getInterestQuota(profile.id, user.roles),
  ]);

  return (
    <InterestsClient
      initialTab={tab}
      initialStatus={statusParam}
      receivedData={receivedData}
      sentData={sentData}
      quota={quota}
    />
  );
}
