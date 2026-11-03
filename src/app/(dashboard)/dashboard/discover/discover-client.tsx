"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Briefcase,
  Search,
  RotateCcw,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DiscoverySearchResult,
  DiscoveryCardItem,
} from "@/server/services/discovery.service";
import type { DiscoveryFilterInput } from "@/lib/validations/discovery";
import {
  toggleShortlistAction,
  sendInterestAction,
} from "@/server/actions/discovery.actions";

interface DiscoverClientProps {
  initialResults: DiscoverySearchResult;
  initialFilters: DiscoveryFilterInput;
  currentUserGender: string;
}

const COUNTRIES = [
  "Bangladesh",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Germany",
  "Sweden",
];

const RELIGIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Sikhism",
  "Buddhism",
  "Other",
];

const PROFESSIONS = [
  "Software Engineer / Tech",
  "Doctor / Physician",
  "Chartered Accountant / Finance",
  "Business Owner / Entrepreneur",
  "Civil / Mechanical Engineer",
  "Architect",
  "University Professor / Lecturer",
  "School Teacher / Educator",
  "Lawyer / Legal Professional",
  "Civil Servant / Government Official",
  "Banking Executive",
  "Other",
];

const EDUCATION_LEVELS = [
  "Doctorate / PhD",
  "Master's Degree (MS/MA/MBA/MSc)",
  "Bachelor's Degree (BS/BA/BSc/BBA)",
  "Medical Degree (MBBS/MD/BDS)",
  "Law Degree (LLB/JD/LLM)",
  "Engineering Degree (BEng/BTech)",
  "Other Professional Qualification",
];

export function DiscoverClient({
  initialResults,
  initialFilters,
  currentUserGender,
}: DiscoverClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = React.useState<DiscoveryFilterInput>(initialFilters);
  const [showFiltersMobile, setShowFiltersMobile] = React.useState(false);

  // Optimistic Shortlist & Interest states
  const [shortlistMap, setShortlistMap] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const item of initialResults.items) {
      map[item.profile.id] = item.isShortlisted;
    }
    return map;
  });

  const [interestMap, setInterestMap] = React.useState<
    Record<string, { status: string; isSender: boolean; interestId: string } | null>
  >(() => {
    const map: Record<string, { status: string; isSender: boolean; interestId: string } | null> = {};
    for (const item of initialResults.items) {
      map[item.profile.id] = item.interestState || null;
    }
    return map;
  });

  // Sync state if initialResults change
  const [prevResults, setPrevResults] = React.useState(initialResults);
  if (prevResults !== initialResults) {
    setPrevResults(initialResults);
    const sMap: Record<string, boolean> = {};
    const iMap: Record<string, { status: string; isSender: boolean; interestId: string } | null> = {};
    for (const item of initialResults.items) {
      sMap[item.profile.id] = item.isShortlisted;
      iMap[item.profile.id] = item.interestState || null;
    }
    setShortlistMap(sMap);
    setInterestMap(iMap);
  }

  // Modal State for Sending Interest
  const [selectedTarget, setSelectedTarget] = React.useState<DiscoveryCardItem | null>(null);
  const [interestMessage, setInterestMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [interestModalMsg, setInterestModalMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Apply filters via URL query push
  const applyFilters = (newFilters: DiscoveryFilterInput) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        if (Array.isArray(val)) {
          if (val.length > 0) params.set(key, val.join(","));
        } else {
          params.set(key, String(val));
        }
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    const emptyFilters: DiscoveryFilterInput = {
      gender: currentUserGender === "MALE" ? "FEMALE" : "MALE",
      sort: "recommended",
      page: 1,
      limit: 12,
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  const handleToggleShortlist = async (targetProfileId: string) => {
    const currentStatus = shortlistMap[targetProfileId] ?? false;
    // Optimistic update
    setShortlistMap((prev) => ({ ...prev, [targetProfileId]: !currentStatus }));

    const res = await toggleShortlistAction(targetProfileId);
    if (!res.success) {
      // Rollback
      setShortlistMap((prev) => ({ ...prev, [targetProfileId]: currentStatus }));
    }
  };

  const handleOpenInterestModal = (item: DiscoveryCardItem) => {
    setSelectedTarget(item);
    setInterestMessage("");
    setInterestModalMsg(null);
  };

  const handleSendInterest = async () => {
    if (!selectedTarget) return;
    setIsSending(true);
    setInterestModalMsg(null);

    try {
      const res = await sendInterestAction({
        recipientProfileId: selectedTarget.profile.id,
        message: interestMessage.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to send interest.");
      }

      setInterestMap((prev) => ({
        ...prev,
        [selectedTarget.profile.id]: {
          status: res.data?.isMutualMatch ? "ACCEPTED" : "PENDING",
          isSender: true,
          interestId: res.data?.interestId || "pending",
        },
      }));

      setInterestModalMsg({
        type: "success",
        text: res.data?.isMutualMatch
          ? "Instant Match! You both showed mutual interest."
          : "Interest sent respectfully to candidate.",
      });

      setTimeout(() => {
        setSelectedTarget(null);
      }, 1500);
    } catch (err: unknown) {
      setInterestModalMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send interest.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.minAge || filters.maxAge) count++;
    if (filters.minHeightCm || filters.maxHeightCm) count++;
    if (filters.country) count++;
    if (filters.city) count++;
    if (filters.religion) count++;
    if (filters.educationLevel) count++;
    if (filters.profession) count++;
    if (filters.hasPhoto) count++;
    if (filters.isVerified) count++;
    if (filters.maritalStatus && filters.maritalStatus.length > 0) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Top Header */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#B89A63]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase tracking-wider">
                Phase 5 Discovery
              </span>
              <span className="text-xs text-[#777777]">
                {initialResults.total} Verified Profiles Available
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
              Member Discovery & Matching
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="relative rounded-xl border-[#E8E2D5] bg-white text-xs text-[#14243A] hover:bg-[#FAF8F3] lg:hidden"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B89A63] text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Quick Navigation to Shortlist & Interests */}
            <Link
              href="/dashboard/shortlist"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63] hover:text-[#B89A63]"
            >
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              <span className="hidden sm:inline">Shortlist</span>
            </Link>

            <Link
              href="/dashboard/interests"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63] hover:text-[#B89A63]"
            >
              <Send className="h-3.5 w-3.5 text-[#B89A63]" />
              <span className="hidden sm:inline">Interests</span>
            </Link>

            <Link
              href="/dashboard/matches"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1e3452]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
              <span>Matches</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside
            className={`space-y-6 rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-sm lg:block ${
              showFiltersMobile ? "block" : "hidden"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#B89A63]" />
                <h2 className="font-serif text-sm font-bold text-[#14243A]">
                  Advanced Search
                </h2>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#B89A63] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset ({activeFilterCount})</span>
                </button>
              )}
            </div>

            {/* Filter: Target Gender */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Seeking
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...filters, gender: "FEMALE" as const, page: 1 };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
                    filters.gender === "FEMALE"
                      ? "border-[#B89A63] bg-[#B89A63]/10 text-[#14243A]"
                      : "border-[#E8E2D5] text-[#777777] hover:border-[#B89A63]/40"
                  }`}
                >
                  Bride (Female)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...filters, gender: "MALE" as const, page: 1 };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
                    filters.gender === "MALE"
                      ? "border-[#B89A63] bg-[#B89A63]/10 text-[#14243A]"
                      : "border-[#E8E2D5] text-[#777777] hover:border-[#B89A63]/40"
                  }`}
                >
                  Groom (Male)
                </button>
              </div>
            </div>

            {/* Filter: Age Range */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Age Range (Years)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="number"
                  min={18}
                  max={80}
                  placeholder="Min"
                  value={filters.minAge || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minAge: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
                />
                <span className="text-xs text-[#777777]">to</span>
                <input
                  type="number"
                  min={18}
                  max={80}
                  placeholder="Max"
                  value={filters.maxAge || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxAge: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
                />
              </div>
            </div>

            {/* Filter: Country of Residence */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Country of Residence
              </label>
              <select
                value={filters.country || ""}
                onChange={(e) => {
                  const next = { ...filters, country: e.target.value || undefined, page: 1 };
                  setFilters(next);
                  applyFilters(next);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Religion */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Religion
              </label>
              <select
                value={filters.religion || ""}
                onChange={(e) => {
                  const next = { ...filters, religion: e.target.value || undefined, page: 1 };
                  setFilters(next);
                  applyFilters(next);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
              >
                <option value="">Any Faith</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Education Level */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Minimum Education
              </label>
              <select
                value={filters.educationLevel || ""}
                onChange={(e) => {
                  const next = { ...filters, educationLevel: e.target.value || undefined, page: 1 };
                  setFilters(next);
                  applyFilters(next);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
              >
                <option value="">Any Education</option>
                {EDUCATION_LEVELS.map((edu) => (
                  <option key={edu} value={edu}>
                    {edu}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Profession */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A]">
                Profession
              </label>
              <select
                value={filters.profession || ""}
                onChange={(e) => {
                  const next = { ...filters, profession: e.target.value || undefined, page: 1 };
                  setFilters(next);
                  applyFilters(next);
                }}
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs text-[#14243A] focus:border-[#B89A63]"
              >
                <option value="">Any Profession</option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles: Photo & Verified */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-[#14243A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(filters.hasPhoto)}
                  onChange={(e) => {
                    const next = { ...filters, hasPhoto: e.target.checked || undefined, page: 1 };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="h-4 w-4 rounded border-[#E8E2D5] text-[#B89A63] focus:ring-[#B89A63]"
                />
                <span className="font-medium">With Approved Photo Only</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-[#14243A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(filters.isVerified)}
                  onChange={(e) => {
                    const next = { ...filters, isVerified: e.target.checked || undefined, page: 1 };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="h-4 w-4 rounded border-[#E8E2D5] text-[#B89A63] focus:ring-[#B89A63]"
                />
                <span className="font-medium">Verified Email Only</span>
              </label>
            </div>

            <Button
              type="button"
              onClick={() => applyFilters(filters)}
              className="w-full rounded-xl bg-[#14243A] text-xs font-semibold text-white transition hover:bg-[#1e3452]"
            >
              Apply Filter Criteria
            </Button>
          </aside>

          {/* Results Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Sorting & Result Counts Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm">
              <div className="text-xs text-[#777777]">
                Showing{" "}
                <span className="font-bold text-[#14243A]">
                  {initialResults.items.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#14243A]">
                  {initialResults.total}
                </span>{" "}
                profiles
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#14243A]">
                  Sort By:
                </span>
                <select
                  value={filters.sort || "recommended"}
                  onChange={(e) => {
                    const next = {
                      ...filters,
                      sort: e.target.value as DiscoveryFilterInput["sort"],
                      page: 1,
                    };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="h-9 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 text-xs font-medium text-[#14243A] focus:border-[#B89A63]"
                >
                  <option value="recommended">Best Compatibility</option>
                  <option value="newest">Recently Joined</option>
                  <option value="updated">Recently Updated</option>
                  <option value="age_asc">Age: Low to High</option>
                  <option value="age_desc">Age: High to Low</option>
                  <option value="completion">Profile Completion</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {initialResults.items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/10 text-[#B89A63]">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
                  No Matching Profiles Found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-[#777777] leading-relaxed">
                  We couldn&apos;t find any active members matching your current
                  search criteria. Try broadening your age range, clearing
                  specific location filters, or resetting your search.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={handleResetFilters}
                    className="rounded-xl bg-[#14243A] text-xs font-semibold text-white hover:bg-[#1e3452]"
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            ) : (
              /* Profile Cards Grid */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {initialResults.items.map((item) => {
                  const p = item.profile;
                  const isShortlisted = shortlistMap[p.id] ?? item.isShortlisted;
                  const interestState = interestMap[p.id] ?? item.interestState;
                  const primaryPhoto = p.photos.find((ph) => ph.isPrimary) || p.photos[0];

                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-sm transition duration-300 hover:shadow-md hover:border-[#B89A63]/50"
                    >
                      {/* Card Media Top */}
                      <div className="relative aspect-4/3 w-full bg-[#14243A] overflow-hidden">
                        {primaryPhoto ? (
                          <Image
                            src={primaryPhoto.secureUrl}
                            alt={p.fullName}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14243A] to-[#1e3452]">
                            <span className="font-serif text-4xl font-extrabold text-[#B89A63]">
                              {p.fullName.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Compatibility Pill */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-[#14243A]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow">
                          <Sparkles className="h-3 w-3 text-[#B89A63]" />
                          <span>{item.compatibility.percentage}% Match</span>
                        </div>

                        {/* Shortlist Action Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleShortlist(p.id)}
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-[#14243A] shadow transition hover:scale-110"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isShortlisted
                                ? "fill-rose-500 text-rose-500"
                                : "text-gray-500 hover:text-rose-500"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif text-base font-bold text-[#14243A]">
                              {p.fullName}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#777777]">
                              {p.age && <span>{p.age} yrs</span>}
                              {p.heightCm && (
                                <>
                                  <span>•</span>
                                  <span>{p.heightCm} cm</span>
                                </>
                              )}
                              {p.maritalStatus && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {p.maritalStatus
                                      .replace("_", " ")
                                      .toLowerCase()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="mt-4 space-y-1.5 text-xs text-[#555555]">
                          {(p.cityOfResidence || p.countryOfResidence) && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 text-[#B89A63] shrink-0" />
                              <span className="truncate">
                                {[p.cityOfResidence, p.countryOfResidence]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                          {p.profession && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Briefcase className="h-3.5 w-3.5 text-[#B89A63] shrink-0" />
                              <span className="truncate">{p.profession}</span>
                            </div>
                          )}

                          {p.educations && p.educations[0] && (
                            <div className="flex items-center gap-1.5 truncate">
                              <GraduationCap className="h-3.5 w-3.5 text-[#B89A63] shrink-0" />
                              <span className="truncate">
                                {p.educations[0].degree ||
                                  p.educations[0].educationLevel}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Matching Tags */}
                        {item.compatibility.matchingTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {item.compatibility.matchingTags
                              .slice(0, 3)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-[#B89A63]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#8C6D37]"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Bio summary */}
                        {p.aboutMe && (
                          <p className="mt-3 line-clamp-2 text-[11px] text-[#777777] leading-relaxed">
                            {p.aboutMe}
                          </p>
                        )}

                        {/* Actions Bottom Bar */}
                        <div className="mt-5 pt-4 border-t border-[#E8E2D5] flex items-center justify-between gap-2">
                          <Link
                            href={`/profile/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#EEE8DC]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </Link>

                          {/* Interest State or Send Button */}
                          {interestState?.status === "ACCEPTED" ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Connected</span>
                            </span>
                          ) : interestState?.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {interestState.isSender
                                  ? "Interest Sent"
                                  : "Interest Received"}
                              </span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenInterestModal(item)}
                              className="rounded-xl bg-[#14243A] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B89A63]"
                            >
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              <span>Send Interest</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {initialResults.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#E8E2D5] pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialResults.page <= 1}
                  onClick={() =>
                    applyFilters({ ...filters, page: initialResults.page - 1 })
                  }
                  className="rounded-xl border-[#E8E2D5] bg-white text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="text-xs font-medium text-[#777777]">
                  Page {initialResults.page} of {initialResults.totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialResults.page >= initialResults.totalPages}
                  onClick={() =>
                    applyFilters({ ...filters, page: initialResults.page + 1 })
                  }
                  className="rounded-xl border-[#E8E2D5] bg-white text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Send Interest Modal */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#B89A63]" />
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Express Matrimonial Interest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-[#777777] leading-relaxed">
                You are expressing interest in connecting with{" "}
                <span className="font-bold text-[#14243A]">
                  {selectedTarget.profile.fullName}
                </span>
                . If they accept, you will form a mutual match.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#14243A]">
                  Personal Greeting / Family Note (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Introduce yourself or your family courteously (e.g., Assalamu Alaikum, we reviewed your biodata and found high alignment with our values...)"
                  className="mt-1.5 w-full rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-3 text-xs text-[#14243A] focus:border-[#B89A63]"
                />
                <span className="mt-1 block text-right text-[10px] text-[#777777]">
                  {interestMessage.length} / 500
                </span>
              </div>

              {interestModalMsg && (
                <div
                  className={`mt-3 rounded-xl p-3 text-xs ${
                    interestModalMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {interestModalMsg.text}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#E8E2D5] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTarget(null)}
                disabled={isSending}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendInterest}
                disabled={isSending}
                className="rounded-xl bg-[#14243A] text-xs font-semibold text-white hover:bg-[#B89A63]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    <span>Send Interest</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
