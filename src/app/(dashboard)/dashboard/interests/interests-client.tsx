"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Eye,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InterestItem } from "@/server/services/interest.service";
import type { InterestQuota } from "@/server/services/entitlements.service";
import {
  respondInterestAction,
  withdrawInterestAction,
} from "@/server/actions/discovery.actions";

interface InterestsClientProps {
  initialTab: "received" | "sent";
  initialStatus?: string;
  receivedData: {
    items: InterestItem[];
    total: number;
    page: number;
    totalPages: number;
  };
  sentData: {
    items: InterestItem[];
    total: number;
    page: number;
    totalPages: number;
  };
  quota: InterestQuota;
}

export function InterestsClient({
  initialTab,
  initialStatus,
  receivedData,
  sentData,
  quota,
}: InterestsClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<"received" | "sent">(initialTab);
  const [selectedStatus, setSelectedStatus] = React.useState<string>(initialStatus || "ALL");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const activeData = activeTab === "received" ? receivedData : sentData;

  const navigateWithFilters = (tab: "received" | "sent", status: string) => {
    setActiveTab(tab);
    setSelectedStatus(status);

    const params = new URLSearchParams();
    params.set("tab", tab);
    if (status !== "ALL") params.set("status", status);
    params.set("page", "1");

    router.push(`/dashboard/interests?${params.toString()}`);
  };

  const handleRespond = async (interestId: string, action: "ACCEPT" | "DECLINE") => {
    setLoadingId(interestId);
    try {
      const res = await respondInterestAction({ interestId, action });
      if (res.success && res.data?.isMutualMatch) {
        router.refresh();
      } else {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleWithdraw = async (interestId: string) => {
    setLoadingId(interestId);
    try {
      await withdrawInterestAction(interestId);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#333333]">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#B89A63]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase tracking-wider">
                Matrimonial Workflow
              </span>
              <span className="text-xs text-[#777777]">
                Discreet interest exchange
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
              Interest Management
            </h1>
          </div>

          {/* Quota widget */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] px-3.5 py-2 text-right">
              <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                Daily Allowance
              </div>
              <div className="text-xs font-bold text-[#14243A]">
                <span className="text-[#B89A63] font-serif text-sm">
                  {quota.remainingToday}
                </span>{" "}
                of {quota.dailyLimit} remaining
              </div>
            </div>

            <Link
              href="/dashboard/matches"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1e3452]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
              <span>Mutual Matches</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D5] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateWithFilters("received", selectedStatus)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === "received"
                  ? "bg-[#14243A] text-white shadow"
                  : "bg-white text-[#777777] hover:bg-[#FAF8F3] hover:text-[#14243A] border border-[#E8E2D5]"
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span>Received Interests</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "received"
                    ? "bg-[#B89A63] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {receivedData.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateWithFilters("sent", selectedStatus)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === "sent"
                  ? "bg-[#14243A] text-white shadow"
                  : "bg-white text-[#777777] hover:bg-[#FAF8F3] hover:text-[#14243A] border border-[#E8E2D5]"
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Sent Interests</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "sent"
                    ? "bg-[#B89A63] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {sentData.total}
              </span>
            </button>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PENDING", "ACCEPTED", "DECLINED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => navigateWithFilters(activeTab, st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedStatus === st
                    ? "bg-[#B89A63] text-white"
                    : "bg-white border border-[#E8E2D5] text-[#777777] hover:bg-[#FAF8F3]"
                }`}
              >
                {st === "ALL"
                  ? "All"
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {activeData.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/10 text-[#B89A63]">
              {activeTab === "received" ? (
                <Inbox className="h-6 w-6" />
              ) : (
                <Send className="h-6 w-6" />
              )}
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
              No {selectedStatus !== "ALL" ? selectedStatus.toLowerCase() : ""}{" "}
              {activeTab === "received" ? "Received" : "Sent"} Interests
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#777777] leading-relaxed">
              {activeTab === "received"
                ? "When other members express interest in your profile, you will see their details and family message here."
                : "You haven't sent any matrimonial interests matching this status. Explore our discovery portal to connect with compatible candidates."}
            </p>
            {activeTab === "sent" && (
              <div className="mt-6">
                <Link
                  href="/dashboard/discover"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1e3452]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
                  <span>Discover Members</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* List of Interests */
          <div className="space-y-4">
            {activeData.items.map((item) => {
              const p = item.otherProfile;
              const primaryPhoto = p.photos.find((ph) => ph.isPrimary) || p.photos[0];
              const isLoading = loadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-3xl border border-[#E8E2D5] bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#B89A63]/40"
                >
                  {/* Profile info left */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#14243A]">
                      {primaryPhoto ? (
                        <Image
                          src={primaryPhoto.secureUrl}
                          alt={p.fullName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-[#B89A63]">
                          {p.fullName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base font-bold text-[#14243A]">
                          {p.fullName}
                        </h3>

                        {/* Status badge */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : item.status === "DECLINED"
                                  ? "bg-gray-100 text-gray-600 border border-gray-200"
                                  : "bg-rose-50 text-rose-600 border border-rose-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#777777]">
                        {p.age && <span>{p.age} yrs</span>}
                        {p.maritalStatus && (
                          <>
                            <span>•</span>
                            <span>
                              {p.maritalStatus.replace("_", " ").toLowerCase()}
                            </span>
                          </>
                        )}
                        {(p.cityOfResidence || p.countryOfResidence) && (
                          <>
                            <span>•</span>
                            <span>
                              {[p.cityOfResidence, p.countryOfResidence]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </>
                        )}
                        {p.profession && (
                          <>
                            <span>•</span>
                            <span>{p.profession}</span>
                          </>
                        )}
                      </div>

                      {/* Attached message if present */}
                      {item.message && (
                        <div className="mt-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E2D5] px-3 py-2 text-xs italic text-[#555555]">
                          &ldquo;{item.message}&rdquo;
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D5]">
                    <Link
                      href={`/profile/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:bg-[#EEE8DC]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Profile</span>
                    </Link>

                    {activeTab === "received" && item.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRespond(item.id, "ACCEPT")}
                          disabled={isLoading}
                          className="rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          <span>Accept</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespond(item.id, "DECLINE")}
                          disabled={isLoading}
                          className="rounded-xl border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          <span>Decline</span>
                        </Button>
                      </>
                    )}

                    {activeTab === "received" && item.status === "ACCEPTED" && (
                      <Link
                        href="/dashboard/matches"
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>View Mutual Match</span>
                      </Link>
                    )}

                    {activeTab === "sent" && item.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWithdraw(item.id)}
                        disabled={isLoading}
                        className="rounded-xl border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        )}
                        <span>Withdraw</span>
                      </Button>
                    )}

                    {activeTab === "sent" && item.status === "ACCEPTED" && (
                      <Link
                        href="/dashboard/matches"
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Matched</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
