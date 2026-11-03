"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  Trash2,
  Eye,
  MapPin,
  Briefcase,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShortlistedProfileItem } from "@/server/services/shortlist.service";
import { toggleShortlistAction } from "@/server/actions/discovery.actions";

interface ShortlistClientProps {
  initialData: {
    items: ShortlistedProfileItem[];
    total: number;
    page: number;
    totalPages: number;
  };
  currentPage: number;
  initialQuery: string;
}

export function ShortlistClient({
  initialData,
  currentPage,
  initialQuery,
}: ShortlistClientProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialData.items);
  const [prevData, setPrevData] = React.useState(initialData);
  if (prevData !== initialData) {
    setPrevData(initialData);
    setItems(initialData.items);
  }
  const [search, setSearch] = React.useState(initialQuery);

  const handleRemove = async (targetProfileId: string) => {
    setItems((prev) => prev.filter((i) => i.profile.id !== targetProfileId));
    await toggleShortlistAction(targetProfileId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("query", search.trim());
    params.set("page", "1");
    router.push(`/dashboard/shortlist?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Saved Matches
              </span>
              <span className="text-xs text-[#777777]">
                {initialData.total} Profiles Shortlisted
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
              My Shortlist & Favorites
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1e3452]"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Discover More Profiles</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate name..."
              className="h-10 w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] pl-9 pr-3 text-xs text-[#14243A] focus:border-[#B89A63]"
            />
          </form>

          <span className="text-xs text-[#777777]">
            Showing {items.length} of {initialData.total}
          </span>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
              Your Shortlist is Empty
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#777777] leading-relaxed">
              When exploring members on the discovery page, click the heart icon
              on any profile card to save them here for respectful family
              discussion and follow-up.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/discover"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1e3452]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
                <span>Explore Discover Profiles</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const p = item.profile;
              const primaryPhoto = p.photos.find((ph) => ph.isPrimary) || p.photos[0];

              return (
                <div
                  key={item.shortlistId}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8E2D5] bg-white shadow-sm transition hover:shadow-md hover:border-[#B89A63]/50"
                >
                  {/* Photo Banner */}
                  <div className="relative aspect-4/3 w-full bg-[#14243A] overflow-hidden">
                    {primaryPhoto ? (
                      <Image
                        src={primaryPhoto.secureUrl}
                        alt={p.fullName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14243A] to-[#1e3452]">
                        <span className="font-serif text-3xl font-extrabold text-[#B89A63]">
                          {p.fullName.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      title="Remove from shortlist"
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow transition hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body */}
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
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E8E2D5] flex items-center justify-between gap-2">
                      <Link
                        href={`/profile/${p.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#EEE8DC]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>

                      <Link
                        href={`/dashboard/discover`}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#14243A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B89A63]"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Interest</span>
                      </Link>
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
              onClick={() => {
                const params = new URLSearchParams();
                if (search.trim()) params.set("query", search.trim());
                params.set("page", String(currentPage - 1));
                router.push(`/dashboard/shortlist?${params.toString()}`);
              }}
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
              onClick={() => {
                const params = new URLSearchParams();
                if (search.trim()) params.set("query", search.trim());
                params.set("page", String(currentPage + 1));
                router.push(`/dashboard/shortlist?${params.toString()}`);
              }}
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
