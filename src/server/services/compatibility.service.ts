import "server-only";
import type {
  MatrimonialProfile,
  PartnerPreference,
  ProfileEducation,
} from "@/generated/prisma";
import { calculateAge } from "@/lib/validations/profile";

export interface CompatibilityScore {
  percentage: number;
  matchGrade: "EXCELLENT" | "STRONG" | "MODERATE" | "FAIR";
  matchingTags: string[];
  evaluatedDimensionsCount: number;
}

/**
 * Rule-Based Explainable Compatibility Engine.
 * Evaluates candidate profile against the viewer's explicit partner preferences.
 */
export function calculateCompatibilityScore(
  candidate: MatrimonialProfile & {
    educations?: ProfileEducation[];
  },
  viewerPreferences: PartnerPreference | null
): CompatibilityScore {
  // If the viewer has configured no preferences, return a friendly neutral baseline
  if (!viewerPreferences) {
    return {
      percentage: 75,
      matchGrade: "MODERATE",
      matchingTags: ["Open Preferences"],
      evaluatedDimensionsCount: 0,
    };
  }

  let totalWeight = 0;
  let earnedScore = 0;
  const matchingTags: string[] = [];

  // 1. Age Compatibility (Weight: 20)
  if (
    (viewerPreferences.minAge || viewerPreferences.maxAge) &&
    candidate.dateOfBirth
  ) {
    totalWeight += 20;
    const candidateAge = calculateAge(new Date(candidate.dateOfBirth));
    const minAge = viewerPreferences.minAge ?? 18;
    const maxAge = viewerPreferences.maxAge ?? 100;

    if (candidateAge >= minAge && candidateAge <= maxAge) {
      earnedScore += 20;
      matchingTags.push("Age Preference");
    } else {
      // Small graceful buffer: if within 2 years, award partial points
      const diff = Math.min(
        Math.abs(candidateAge - minAge),
        Math.abs(candidateAge - maxAge)
      );
      if (diff <= 2) {
        earnedScore += 10;
      }
    }
  }

  // 2. Height Compatibility (Weight: 15)
  if (
    (viewerPreferences.minHeightCm || viewerPreferences.maxHeightCm) &&
    candidate.heightCm
  ) {
    totalWeight += 15;
    const minH = viewerPreferences.minHeightCm ?? 120;
    const maxH = viewerPreferences.maxHeightCm ?? 220;

    if (candidate.heightCm >= minH && candidate.heightCm <= maxH) {
      earnedScore += 15;
      matchingTags.push("Height Preference");
    } else if (
      Math.abs(candidate.heightCm - minH) <= 3 ||
      Math.abs(candidate.heightCm - maxH) <= 3
    ) {
      earnedScore += 8;
    }
  }

  // 3. Location / Country Compatibility (Weight: 15)
  if (
    viewerPreferences.countries &&
    viewerPreferences.countries.length > 0 &&
    candidate.countryOfResidence
  ) {
    totalWeight += 15;
    const countryMatch = viewerPreferences.countries.some(
      (c) => c.toLowerCase() === candidate.countryOfResidence?.toLowerCase()
    );
    if (countryMatch) {
      earnedScore += 15;
      matchingTags.push("Location Match");
    }
  }

  // 4. Marital Status Compatibility (Weight: 15)
  if (
    viewerPreferences.maritalStatus &&
    viewerPreferences.maritalStatus.length > 0 &&
    candidate.maritalStatus
  ) {
    totalWeight += 15;
    const maritalMatch = viewerPreferences.maritalStatus.includes(
      candidate.maritalStatus
    );
    if (maritalMatch) {
      earnedScore += 15;
      matchingTags.push("Marital Status");
    }
  }

  // 5. Education Compatibility (Weight: 15)
  if (
    viewerPreferences.educationLevels &&
    viewerPreferences.educationLevels.length > 0
  ) {
    totalWeight += 15;
    const highestEdu =
      candidate.educations?.find((e) => e.isHighest)?.educationLevel ||
      candidate.educations?.[0]?.educationLevel;

    if (
      highestEdu &&
      viewerPreferences.educationLevels.some((lvl) =>
        highestEdu.toLowerCase().includes(lvl.toLowerCase())
      )
    ) {
      earnedScore += 15;
      matchingTags.push("Education Criteria");
    } else if (highestEdu) {
      earnedScore += 7; // Partial for holding tertiary education
    }
  }

  // 6. Religion Compatibility (Weight: 10)
  if (
    viewerPreferences.religions &&
    viewerPreferences.religions.length > 0 &&
    candidate.religion
  ) {
    totalWeight += 10;
    const religionMatch = viewerPreferences.religions.some(
      (r) => r.toLowerCase() === candidate.religion?.toLowerCase()
    );
    if (religionMatch) {
      earnedScore += 10;
      matchingTags.push("Religious Harmony");
    }
  }

  // 7. Profession Compatibility (Weight: 10)
  if (
    viewerPreferences.professions &&
    viewerPreferences.professions.length > 0 &&
    candidate.profession
  ) {
    totalWeight += 10;
    const profMatch = viewerPreferences.professions.some(
      (p) =>
        candidate.profession?.toLowerCase().includes(p.toLowerCase()) ||
        p.toLowerCase().includes(candidate.profession?.toLowerCase() || "")
    );
    if (profMatch) {
      earnedScore += 10;
      matchingTags.push("Career Match");
    }
  }

  // Normalize final score:
  // If few dimensions were configured, normalize against configured weights with a gentle default
  const calculatedPercentage =
    totalWeight > 0 ? Math.round((earnedScore / totalWeight) * 100) : 75;

  let matchGrade: CompatibilityScore["matchGrade"] = "FAIR";
  if (calculatedPercentage >= 85) matchGrade = "EXCELLENT";
  else if (calculatedPercentage >= 70) matchGrade = "STRONG";
  else if (calculatedPercentage >= 50) matchGrade = "MODERATE";

  return {
    percentage: calculatedPercentage,
    matchGrade,
    matchingTags,
    evaluatedDimensionsCount: Math.round(totalWeight / 15),
  };
}

