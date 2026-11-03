import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { interestService } from "@/server/services/interest.service";
import { MatchesClient } from "./matches-client";

export const instant = false;

export const metadata = {
  title: "Mutual Matches | MatrimonyOS",
  description: "Your confirmed mutual matrimonial matches and connections.",
};

interface MatchesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/matches");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const resolvedParams = await searchParams;

  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 12;

  const initialData = await interestService.getMutualMatches(
    user.id,
    profile.id,
    { page, limit }
  );

  return <MatchesClient initialData={initialData} currentPage={page} />;
}
