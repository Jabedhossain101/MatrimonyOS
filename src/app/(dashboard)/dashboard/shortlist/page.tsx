import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { shortlistService } from "@/server/services/shortlist.service";
import { ShortlistClient } from "./shortlist-client";

export const instant = false;

export const metadata = {
  title: "My Shortlist | MatrimonyOS",
  description: "View and manage your saved matrimonial profiles.",
};

interface ShortlistPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShortlistPage({ searchParams }: ShortlistPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/shortlist");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const resolvedParams = await searchParams;

  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 12;
  const query = typeof resolvedParams.query === "string" ? resolvedParams.query : undefined;

  const initialData = await shortlistService.getMemberShortlist(
    user.id,
    profile.id,
    { page, limit, query }
  );

  return (
    <ShortlistClient
      initialData={initialData}
      currentPage={page}
      initialQuery={query || ""}
    />
  );
}
