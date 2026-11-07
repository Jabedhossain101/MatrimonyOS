"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Eye,
  MapPin,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchItem } from "@/server/services/interest.service";
import { getOrCreateConversationAction } from "@/server/actions/messaging.actions";

interface MatchesClientProps {
  initialData: {
    items: MatchItem[];
    total: number;
    page: number;
    totalPages: number;
  };
  currentPage: number;
}

export function MatchesClient({ initialData, currentPage }: MatchesClientProps) {
  const router = useRouter();
  const [loadingMatchId, setLoadingMatchId] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Confirmed Alliances
              </span>
              <span className="text-xs text-[#777777]">
                {initialData.total} Mutual Matches Established
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
              Mutual Matches
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3.5 py-2 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63]"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Discover More</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 shadow-sm">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">What is a Mutual Match?</span>
            <p className="text-emerald-800 leading-relaxed">
              A mutual match occurs when both members (or their family managers)
              have cordially accepted matrimonial interest toward each other.
              Both profiles are now cleared for direct family introduction.
            </p>
          </div>
        </div>

        {/* Empty State */}
        {initialData.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
              No Mutual Matches Yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#777777] leading-relaxed">
              Once you send interests to compatible members and they accept, or
              you accept incoming interests, they will appear here as your
              established mutual connections.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/discover"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1e3452]"
              >
                <Search className="h-3.5 w-3.5 text-[#B89A63]" />
                <span>Browse Discovery</span>
              </Link>
              <Link
                href="/dashboard/interests"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2.5 text-xs font-semibold text-[#14243A] hover:bg-[#FAF8F3]"
              >
                <span>Check Received Interests</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Matches Cards Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {initialData.items.map((match) => {
              const p = match.otherProfile;
              const primaryPhoto = p.photos.find((ph) => ph.isPrimary) || p.photos[0];

              return (
                <div
                  key={match.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-4/3 w-full bg-[#14243A] overflow-hidden">
                    {primaryPhoto ? (
                      <Image
                        src={primaryPhoto.secureUrl}
                        alt={p.fullName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-extrabold text-[#B89A63]">
                        {p.fullName.charAt(0)}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Mutual Connection</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
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
                              {p.maritalStatus.replace("_", " ").toLowerCase()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-[#555555]">
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

                      <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Matched on{" "}
                          {new Date(match.matchedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E8E2D5] flex items-center justify-between gap-2">
                      <Link
                        href={`/profile/${p.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#EEE8DC]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Biodata</span>
                      </Link>

                      <button
                        onClick={async () => {
                          setLoadingMatchId(match.id);
                          const res = await getOrCreateConversationAction(p.id);
                          if (res.success && res.data?.conversationId) {
                            router.push(`/dashboard/messages/${res.data.conversationId}`);
                          } else {
                            setLoadingMatchId(null);
                          }
                        }}
                        disabled={loadingMatchId === match.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2D3C] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a4459]"
                      >
                        {loadingMatchId === match.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4AF37]" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-[#D4AF37]" />
                        )}
                        <span>Send Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E8E2D5] pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => router.push(`/dashboard/matches?page=${currentPage - 1}`)}
              className="rounded-xl border-[#E8E2D5] bg-white text-xs"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <div className="text-xs font-medium text-[#777777]">
              Page {currentPage} of {initialData.totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= initialData.totalPages}
              onClick={() => router.push(`/dashboard/matches?page=${currentPage + 1}`)}
              className="rounded-xl border-[#E8E2D5] bg-white text-xs"
            >
              <span>Next</span>
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
