import "server-only";
import { db } from "@/server/db";
import type { Prisma, Gender, MaritalStatus, FamilyType } from "@/generated/prisma";
import type { DiscoveryFilterInput } from "@/lib/validations/discovery";
import { redactProfileForViewer, type RedactedPublicProfile } from "@/server/utils/privacy";
import { calculateCompatibilityScore, type CompatibilityScore } from "./compatibility.service";
import { shortlistService } from "./shortlist.service";
import { interestService } from "./interest.service";

export interface DiscoveryCardItem {
  profile: RedactedPublicProfile;
  compatibility: CompatibilityScore;
  isShortlisted: boolean;
  interestState?: {
    status: string;
    isSender: boolean;
    interestId: string;
  } | null;
}

export interface DiscoverySearchResult {
  items: DiscoveryCardItem[];
  total: number;
  page: number;
  totalPages: number;
  filters: DiscoveryFilterInput;
}

export const discoveryService = {
  /**
   * Execute advanced member discovery query with strict safety, visibility, and privacy rules.
   */
  async discoverProfiles(
    currentUserId: string,
    currentProfileId: string,
    filters: DiscoveryFilterInput
  ): Promise<DiscoverySearchResult> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    // 1. Fetch current viewer's profile & partner preference for compatibility matching
    const viewerProfile = await db.matrimonialProfile.findUnique({
      where: { id: currentProfileId },
      include: {
        partnerPreference: true,
      },
    });

    const viewerGender = viewerProfile?.gender;
    const defaultSearchGender =
      filters.gender ??
      (viewerGender === "MALE"
        ? ("FEMALE" as Gender)
        : viewerGender === "FEMALE"
          ? ("MALE" as Gender)
          : undefined);

    // 2. Build Prisma Where Clause
    const where: Prisma.MatrimonialProfileWhereInput = {
      // Exclude self
      userId: { not: currentUserId },
      // Exclude inactive, suspended, or deactivated accounts
      user: {
        accountStatus: "ACTIVE",
        ...(filters.isVerified ? { emailVerified: true } : {}),
      },
      // Exclude PRIVATE profiles (members-only is permitted since viewer is authenticated member)
      privacySettings: {
        profileVisibility: { not: "PRIVATE" },
      },
      // Enforce Gender
      ...(defaultSearchGender ? { gender: defaultSearchGender } : {}),
    };

    // Age bounds to Date of Birth range
    const now = new Date();
    if (filters.minAge || filters.maxAge) {
      const minAge = filters.minAge ?? 18;
      const maxAge = filters.maxAge ?? 100;

      // candidate born on or before (now - minAge years)
      const maxDob = new Date(
        now.getFullYear() - minAge,
        now.getMonth(),
        now.getDate()
      );
      // candidate born on or after (now - (maxAge + 1) years)
      const minDob = new Date(
        now.getFullYear() - (maxAge + 1),
        now.getMonth(),
        now.getDate()
      );

      where.dateOfBirth = {
        gte: minDob,
        lte: maxDob,
      };
    }

    // Height range
    if (filters.minHeightCm || filters.maxHeightCm) {
      where.heightCm = {
        ...(filters.minHeightCm ? { gte: filters.minHeightCm } : {}),
        ...(filters.maxHeightCm ? { lte: filters.maxHeightCm } : {}),
      };
    }

    // Marital Status
    if (filters.maritalStatus && filters.maritalStatus.length > 0) {
      where.maritalStatus = {
        in: filters.maritalStatus as MaritalStatus[],
      };
    }

    // Country
    if (filters.country && filters.country.trim()) {
      where.countryOfResidence = {
        equals: filters.country.trim(),
        mode: "insensitive",
      };
    }

    // City
    if (filters.city && filters.city.trim()) {
      where.cityOfResidence = {
        contains: filters.city.trim(),
        mode: "insensitive",
      };
    }

    // Nationality
    if (filters.nationality && filters.nationality.trim()) {
      where.nationality = {
        equals: filters.nationality.trim(),
        mode: "insensitive",
      };
    }

    // Religion
    if (filters.religion && filters.religion.trim()) {
      where.religion = {
        equals: filters.religion.trim(),
        mode: "insensitive",
      };
    }

    // Profession
    if (filters.profession && filters.profession.trim()) {
      where.profession = {
        contains: filters.profession.trim(),
        mode: "insensitive",
      };
    }

    // Employment Status
    if (filters.employmentStatus && filters.employmentStatus.trim()) {
      where.employmentStatus = {
        equals: filters.employmentStatus.trim(),
        mode: "insensitive",
      };
    }

    // Family Type
    if (filters.familyType) {
      where.familyType = filters.familyType as FamilyType;
    }

    // Lifestyle filters
    if (filters.dietaryHabits && filters.dietaryHabits.trim()) {
      where.dietaryHabits = {
        equals: filters.dietaryHabits.trim(),
        mode: "insensitive",
      };
    }
    if (filters.smokingHabits && filters.smokingHabits.trim()) {
      where.smokingHabits = {
        equals: filters.smokingHabits.trim(),
        mode: "insensitive",
      };
    }
    if (filters.drinkingHabits && filters.drinkingHabits.trim()) {
      where.drinkingHabits = {
        equals: filters.drinkingHabits.trim(),
        mode: "insensitive",
      };
    }

    // Must have approved photo filter
    if (filters.hasPhoto) {
      where.photos = {
        some: {
          moderationStatus: "APPROVED",
        },
      };
    }

    // Minimum completion score threshold
    if (filters.minCompletion && filters.minCompletion > 0) {
      where.completionPercentage = {
        gte: filters.minCompletion,
      };
    }

    // Education Level search
    if (filters.educationLevel && filters.educationLevel.trim()) {
      where.educations = {
        some: {
          educationLevel: {
            contains: filters.educationLevel.trim(),
            mode: "insensitive",
          },
        },
      };
    }

    // 3. Build Deterministic Ordering
    const orderBy: Prisma.MatrimonialProfileOrderByWithRelationInput[] = [];

    switch (filters.sort) {
      case "newest":
        orderBy.push({ createdAt: "desc" }, { id: "desc" });
        break;
      case "updated":
        orderBy.push({ updatedAt: "desc" }, { id: "desc" });
        break;
      case "age_asc":
        // Youngest first -> highest dateOfBirth first
        orderBy.push({ dateOfBirth: "desc" }, { id: "desc" });
        break;
      case "age_desc":
        // Oldest first -> lowest dateOfBirth first
        orderBy.push({ dateOfBirth: "asc" }, { id: "desc" });
        break;
      case "completion":
        orderBy.push({ completionPercentage: "desc" }, { id: "desc" });
        break;
      case "recommended":
      default:
        // Priority to higher completion and fresh profiles
        orderBy.push(
          { completionPercentage: "desc" },
          { createdAt: "desc" },
          { id: "desc" }
        );
        break;
    }

    // 4. Fetch Candidates & Total in parallel
    const [total, rawCandidates, shortlistedSet, interestsMap] =
      await Promise.all([
        db.matrimonialProfile.count({ where }),
        db.matrimonialProfile.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            educations: { orderBy: { graduationYear: "desc" } },
            photos: { orderBy: { orderIndex: "asc" } },
            partnerPreference: true,
            privacySettings: true,
            user: { select: { name: true, email: true } },
          },
        }),
        shortlistService.getShortlistedProfileIds(currentProfileId),
        interestService.getInterestsMap(currentProfileId),
      ]);

    // 5. Redact & Enrich candidate cards
    const items: DiscoveryCardItem[] = [];

    for (const candidate of rawCandidates) {
      const redacted = redactProfileForViewer(
        candidate,
        currentUserId,
        true // viewer is logged-in verified member
      );

      if (!redacted || !redacted.viewerCanAccess) {
        continue;
      }

      const compatibility = calculateCompatibilityScore(
        candidate,
        viewerProfile?.partnerPreference || null
      );

      items.push({
        profile: redacted,
        compatibility,
        isShortlisted: shortlistedSet.has(candidate.id),
        interestState: interestsMap[candidate.id] || null,
      });
    }

    // If sorting by recommended, re-sort current page items by compatibility percentage
    if (filters.sort === "recommended") {
      items.sort(
        (a, b) => b.compatibility.percentage - a.compatibility.percentage
      );
    }

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters,
    };
  },
};
