import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { discoveryService } from "@/server/services/discovery.service";
import { discoveryFilterSchema, type DiscoveryFilterInput } from "@/lib/validations/discovery";
import { DiscoverClient } from "./discover-client";

export const instant = false;

export const metadata = {
  title: "Discover Matches | MatrimonyOS",
  description: "Browse verified, eligible matrimonial profiles tailored to your preferences.",
};

interface DiscoverPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/discover");
  }

  const profile = await profileService.getOrCreateProfile(user.id);

  // If user hasn't finished step 1 (Basic), suggest completing onboarding
  if (profile.onboardingStatus === "NOT_STARTED") {
    redirect("/onboarding");
  }

  const resolvedParams = await searchParams;

  // Normalize search params into filter object
  const rawFilters: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(resolvedParams)) {
    if (val === undefined) continue;
    if (key === "maritalStatus") {
      rawFilters[key] = Array.isArray(val) ? val : [val];
    } else {
      rawFilters[key] = Array.isArray(val) ? val[0] : val;
    }
  }

  let parsedFilters: DiscoveryFilterInput;
  try {
    parsedFilters = discoveryFilterSchema.parse(rawFilters);
  } catch {
    parsedFilters = discoveryFilterSchema.parse({});
  }

  const initialResults = await discoveryService.discoverProfiles(
    user.id,
    profile.id,
    parsedFilters
  );

  return (
    <DiscoverClient
      initialResults={initialResults}
      initialFilters={parsedFilters}
      currentUserGender={profile.gender || "MALE"}
    />
  );
}
