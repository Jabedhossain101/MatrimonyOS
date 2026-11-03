"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  uploadProfilePhotoAction,
  deleteProfilePhotoAction,
  setPrimaryPhotoAction,
} from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { ProfilePhoto } from "@/generated/prisma";

interface PhotoManagerProps {
  initialPhotos: ProfilePhoto[];
}

export function PhotoManager({ initialPhotos }: PhotoManagerProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = React.useState<ProfilePhoto[]>(initialPhotos);
  const [isUploading, setIsUploading] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({
        type: "error",
        text: "The selected image exceeds 5MB. Please choose a smaller photo.",
      });
      return;
    }

    // Validate MIME
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setStatusMsg({
        type: "error",
        text: "Invalid image format. Allowed formats: JPG, PNG, and WebP.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadProfilePhotoAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Failed to upload photo.");
      }

      setStatusMsg({
        type: "success",
        text: "Photo uploaded successfully and submitted for moderation review.",
      });

      if (res.data) {
        setPhotos((prev) => [...prev, res.data as ProfilePhoto]);
      }

      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload photo.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    setActionLoadingId(photoId);
    setStatusMsg(null);
    try {
      const res = await setPrimaryPhotoAction(photoId);
      if (!res.success) throw new Error(res.error);

      setPhotos((prev) =>
        prev.map((p) => ({
          ...p,
          isPrimary: p.id === photoId,
        }))
      );
      setStatusMsg({
        type: "success",
        text: "Primary profile portrait updated.",
      });
      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update primary photo.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to remove this photo?")) return;

    setActionLoadingId(photoId);
    setStatusMsg(null);
    try {
      const res = await deleteProfilePhotoAction(photoId);
      if (!res.success) throw new Error(res.error);

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setStatusMsg({
        type: "success",
        text: "Photo removed successfully.",
      });
      router.refresh();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete photo.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Notifications */}
      {statusMsg && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs ${
            statusMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="rounded-3xl border-2 border-dashed border-[#E8E2D5] bg-white p-8 text-center transition hover:border-[#B89A63]/60">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63]">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Camera className="h-8 w-8" />
          )}
        </div>

        <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
          {isUploading ? "Uploading to Cloud..." : "Upload New Profile Photo"}
        </h3>
        <p className="mt-1 text-xs text-[#777777]">
          JPG, PNG, or WebP. High resolution, clear modest portrait up to 5MB.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Select Image File</span>
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
          <h2 className="font-serif text-lg font-bold text-[#14243A]">
            Current Gallery ({photos.length} photos)
          </h2>
          <span className="text-xs text-[#777777]">
            Maximum 6 photos allowed
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-3xl border border-[#E8E2D5] bg-white p-12 text-center text-xs text-[#777777]">
            No photos uploaded yet. Upload a clear portrait to activate your full profile.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm transition hover:border-[#B89A63]"
              >
                <div className="relative aspect-[4/5] w-full bg-[#FAF8F3]">
                  <Image
                    src={photo.secureUrl}
                    alt="Matrimonial Portrait"
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Primary Badge */}
                  {photo.isPrimary && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-[#14243A] px-2.5 py-1 text-[10px] font-bold text-[#B89A63] shadow-md">
                      <Star className="h-3 w-3 fill-[#B89A63]" />
                      <span>Primary Photo</span>
                    </div>
                  )}

                  {/* Moderation Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur">
                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                    <span>{photo.moderationStatus}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between p-3 border-t border-[#E8E2D5]/70 bg-[#FAF8F3]">
                  {!photo.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={actionLoadingId === photo.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#14243A] hover:text-[#B89A63]"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Make Primary</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#B89A63]">
                      Primary Portrait
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={actionLoadingId === photo.id}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                    title="Delete Photo"
                  >
                    {actionLoadingId === photo.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Matrimonial Photo Guidelines */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-[#FAF8F3] p-6 text-xs text-[#555555]">
        <div className="flex items-center gap-2 font-serif text-sm font-bold text-[#14243A]">
          <Info className="h-4 w-4 text-[#B89A63]" />
          <span>MatrimonyOS Photo Standards</span>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[#777777]">
          <li>Solo photos only. Do not upload group photos with friends or children.</li>
          <li>Your face should be clearly visible with good lighting.</li>
          <li>Appropriate, modest dress is required for compliance with our respectful platform guidelines.</li>
          <li>Newly uploaded photos are screened for community safety and moderation approval.</li>
        </ul>
      </div>
    </div>
  );
}

