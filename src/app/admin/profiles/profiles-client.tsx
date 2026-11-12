"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { ProfileModerationStatus, PhotoModerationStatus } from "@/generated/prisma";
import {
  moderateProfileAction,
  moderatePhotoAction,
} from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface ProfileItem {
  id: string;
  slug: string;
  fullName: string | null;
  gender: string | null;
  maritalStatus: string | null;
  religion: string | null;
  profession: string | null;
  cityOfResidence: string | null;
  countryOfResidence: string | null;
  aboutMe: string | null;
  moderationStatus: ProfileModerationStatus;
  rejectionReason: string | null;
  isVerified: boolean;
  completionPercentage: number;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
  };
  photos: Array<{
    id: string;
    secureUrl: string;
    isPrimary: boolean;
    moderationStatus: PhotoModerationStatus;
    rejectionReason: string | null;
  }>;
}

interface ProfilesClientProps {
  initialProfiles: ProfileItem[];
  total: number;
  currentPage: number;
  limit: number;
}

export function ProfilesClient({
  initialProfiles,
  total,
}: ProfilesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = React.useState<ProfileItem[]>(initialProfiles);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || "");

  // Modal states
  const [rejectModalProfile, setRejectModalProfile] = React.useState<ProfileItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");

  const [rejectPhotoId, setRejectPhotoId] = React.useState<string | null>(null);
  const [photoRejectionReason, setPhotoRejectionReason] = React.useState("");

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", "1");
    router.push(`/admin/profiles?${params.toString()}`);
  };

  const handleApproveProfile = async (profileId: string) => {
    setLoadingAction(`profile_approve_${profileId}`);
    setFeedback(null);

    const res = await moderateProfileAction({
      profileId,
      action: "APPROVE",
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: "Profile approved successfully." });
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, moderationStatus: ProfileModerationStatus.APPROVED, rejectionReason: null }
            : p
        )
      );
    } else {
      setFeedback({ type: "error", message: res.error || "Approval failed." });
    }
  };

  const handleRejectProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalProfile || rejectionReason.trim().length < 5) return;

    setLoadingAction(`profile_reject_${rejectModalProfile.id}`);
    setFeedback(null);

    const res = await moderateProfileAction({
      profileId: rejectModalProfile.id,
      action: "REJECT",
      reason: rejectionReason,
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: "Profile rejected with reason dispatched." });
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === rejectModalProfile.id
            ? {
                ...p,
                moderationStatus: ProfileModerationStatus.REJECTED,
                rejectionReason,
              }
            : p
        )
      );
      setRejectModalProfile(null);
      setRejectionReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Rejection failed." });
    }
  };

  const handlePhotoAction = async (photoId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    setLoadingAction(`photo_${photoId}`);
    setFeedback(null);

    const res = await moderatePhotoAction({
      photoId,
      action,
      reason,
    });

    setLoadingAction(null);

    if (res.success) {
      setFeedback({ type: "success", message: `Photo ${action === "APPROVE" ? "approved" : "rejected"}.` });
      setProfiles((prev) =>
        prev.map((p) => ({
          ...p,
          photos: p.photos.map((ph) =>
            ph.id === photoId
              ? {
                  ...ph,
                  moderationStatus:
                    action === "APPROVE"
                      ? PhotoModerationStatus.APPROVED
                      : PhotoModerationStatus.REJECTED,
                  rejectionReason: reason || null,
                }
              : ph
          ),
        }))
      );
      setRejectPhotoId(null);
      setPhotoRejectionReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Action failed." });
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Editorial Review
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">
            Profile Moderation
          </h1>
          <p className="text-xs text-[#777777]">
            Review candidate biodatas and uploaded portrait media against matrimonial community guidelines.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#14243A]">{total} profiles in queue</span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
          <input
            type="text"
            placeholder="Search by candidate name, slug, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 pl-9 pr-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
        >
          <option value="">All Statuses</option>
          {Object.values(ProfileModerationStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Button
          onClick={applyFilters}
          size="sm"
          className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] px-4 text-xs font-semibold"
        >
          Apply Filters
        </Button>
      </div>

      {/* Profile Cards Stream */}
      <div className="space-y-4">
        {profiles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-[#E8E2D5] bg-white text-xs text-[#777777]">
            No profiles found matching your search.
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#E8E2D5]/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-[#14243A]">
                      {profile.fullName || "Candidate"}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        profile.moderationStatus === ProfileModerationStatus.APPROVED
                          ? "bg-emerald-100 text-emerald-800"
                          : profile.moderationStatus === ProfileModerationStatus.REJECTED
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {profile.moderationStatus}
                    </span>
                    {profile.isVerified && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                        Verified Badge
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#777777] mt-0.5">
                    User: {profile.user.name} ({profile.user.email}) • Slug: /{profile.slug}
                  </p>
                  <p className="text-[11px] text-[#777777]">
                    {profile.cityOfResidence || "City"}, {profile.countryOfResidence || "Country"} •{" "}
                    {profile.religion || "Faith"} • {profile.profession || "Profession"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${profile.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] px-3 py-1.5 text-xs font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63] transition"
                  >
                    <span>Public View</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  {profile.moderationStatus !== ProfileModerationStatus.APPROVED && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveProfile(profile.id)}
                      disabled={loadingAction === `profile_approve_${profile.id}`}
                      className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                    >
                      {loadingAction === `profile_approve_${profile.id}` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span>Approve</span>
                    </Button>
                  )}

                  {profile.moderationStatus !== ProfileModerationStatus.REJECTED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectModalProfile(profile);
                        setRejectionReason(profile.rejectionReason || "");
                      }}
                      className="rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      <span>Reject</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio & Content snippet */}
              {profile.aboutMe ? (
                <div className="rounded-xl bg-[#FAF8F3] p-3 text-xs text-[#14243A] border border-[#E8E2D5]/50">
                  <span className="font-semibold text-[#777777] block text-[10px] uppercase">
                    About Me Statement:
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{profile.aboutMe}</p>
                </div>
              ) : (
                <p className="text-[11px] text-[#777777] italic">No bio statement written.</p>
              )}

              {profile.rejectionReason && (
                <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                  <strong>Current Rejection Note:</strong> {profile.rejectionReason}
                </div>
              )}

              {/* Photos Gallery */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#14243A] block mb-2">
                  Uploaded Photos ({profile.photos.length}):
                </span>
                {profile.photos.length === 0 ? (
                  <p className="text-[11px] text-[#777777]">No photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {profile.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] overflow-hidden flex flex-col group relative"
                      >
                        <div className="relative aspect-square w-full">
                          <Image
                            src={photo.secureUrl}
                            alt="Candidate Photo"
                            fill
                            className="object-cover"
                          />
                          <span
                            className={`absolute top-1 left-1 rounded px-1 py-0.2 text-[8px] font-bold ${
                              photo.moderationStatus === PhotoModerationStatus.APPROVED
                                ? "bg-emerald-600 text-white"
                                : photo.moderationStatus === PhotoModerationStatus.REJECTED
                                ? "bg-rose-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {photo.moderationStatus}
                          </span>
                        </div>
                        <div className="p-1.5 flex items-center justify-between bg-white border-t border-[#E8E2D5]">
                          <span className="text-[9px] text-[#777777]">
                            {photo.isPrimary ? "Primary" : "Gallery"}
                          </span>
                          <div className="flex gap-1">
                            {photo.moderationStatus !== PhotoModerationStatus.APPROVED && (
                              <button
                                onClick={() => handlePhotoAction(photo.id, "APPROVE")}
                                title="Approve photo"
                                className="text-emerald-600 hover:text-emerald-800 p-0.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {photo.moderationStatus !== PhotoModerationStatus.REJECTED && (
                              <button
                                onClick={() => {
                                  setRejectPhotoId(photo.id);
                                  setPhotoRejectionReason("");
                                }}
                                title="Reject photo"
                                className="text-rose-600 hover:text-rose-800 p-0.5"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Profile Modal */}
      {rejectModalProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRejectProfileSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Reject Profile Content
                </h3>
                <p className="text-xs text-[#777777]">
                  Target: {rejectModalProfile.fullName} (/{rejectModalProfile.slug})
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Mandatory Editorial Reason for Rejection (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what needs adjustment (e.g. inappropriate wording, misleading career info)..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectModalProfile(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={rejectionReason.trim().length < 5}
                className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Photo Modal */}
      {rejectPhotoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePhotoAction(rejectPhotoId, "REJECT", photoRejectionReason);
            }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Reject Profile Photo
                </h3>
                <p className="text-xs text-[#777777]">Photo ID: {rejectPhotoId}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Reason for Rejection (min 5 chars)
              </label>
              <textarea
                rows={2}
                required
                value={photoRejectionReason}
                onChange={(e) => setPhotoRejectionReason(e.target.value)}
                placeholder="e.g. Unclear face, sunglasses, copyrighted material..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectPhotoId(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={photoRejectionReason.trim().length < 5}
                className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Reject Photo
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

