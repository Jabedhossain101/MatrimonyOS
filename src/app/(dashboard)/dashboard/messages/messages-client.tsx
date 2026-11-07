"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ShieldAlert,
  Ban,
  ArrowLeft,
  X,
  Loader2,
  Lock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ConversationSummary,
  DetailedMessage,
} from "@/server/services/messaging.service";
import {
  sendMessageAction,
  markMessagesReadAction,
  deleteMessageAction,
} from "@/server/actions/messaging.actions";
import { blockUserAction, reportUserAction } from "@/server/actions/safety.actions";
import { ReportReason } from "@/generated/prisma";

export interface ProfileCardData {
  id?: string;
  slug?: string | null;
  fullName?: string | null;
  profession?: string | null;
  cityOfResidence?: string | null;
  countryOfResidence?: string | null;
  primaryPhotoUrl?: string | null;
  photos?: Array<{ id: string; secureUrl: string; isPrimary: boolean }>;
}

interface MessagesClientProps {
  currentProfileId: string;
  initialConversations: ConversationSummary[];
  activeConversationId?: string;
  initialActiveConversation?: {
    id: string;
    matchId: string | null;
    otherProfile: ProfileCardData;
    otherProfileId: string;
    isBlocked: boolean;
    createdAt: Date;
    lastMessageAt: Date | null;
    lastMessageText: string | null;
  } | null;
  initialMessages?: DetailedMessage[];
}

function getOtherProfilePhoto(profile: ProfileCardData | null | undefined): string {
  if (profile?.photos && Array.isArray(profile.photos)) {
    const primary = profile.photos.find((p) => p.isPrimary);
    if (primary?.secureUrl) return primary.secureUrl;
    if (profile.photos[0]?.secureUrl) return profile.photos[0].secureUrl;
  }
  return profile?.primaryPhotoUrl || "/images/placeholder-avatar.png";
}

export function MessagesClient({
  currentProfileId,
  initialConversations,
  activeConversationId,
  initialActiveConversation,
  initialMessages = [],
}: MessagesClientProps) {
  const router = useRouter();

  // Conversations list & search state
  const [conversations, setConversations] = React.useState<ConversationSummary[]>(initialConversations);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Active conversation state
  const [selectedConvId, setSelectedConvId] = React.useState<string | undefined>(activeConversationId);
  const [activeConv, setActiveConv] = React.useState(initialActiveConversation || null);
  const [messages, setMessages] = React.useState<DetailedMessage[]>(initialMessages);

  // Sync state if initialActiveConversation or initialMessages change from page load
  const [prevActiveId, setPrevActiveId] = React.useState(activeConversationId);
  if (prevActiveId !== activeConversationId) {
    setPrevActiveId(activeConversationId);
    setSelectedConvId(activeConversationId);
    setActiveConv(initialActiveConversation || null);
    setMessages(initialMessages);
  }

  // Composer input & attachments
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [selectedAttachmentFile, setSelectedAttachmentFile] = React.useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = React.useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);

  // Modals state
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<ReportReason>(ReportReason.HARASSMENT);
  const [reportDescription, setReportDescription] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [isPerformingSafetyAction, setIsPerformingSafetyAction] = React.useState(false);

  // Expanded Image Modal
  const [expandedImageUrl, setExpandedImageUrl] = React.useState<string | null>(null);

  // Scroll anchor ref
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pollInFlightRef = React.useRef(false);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  React.useEffect(() => {
    scrollToBottom("auto");
  }, [selectedConvId]);

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  // Mark messages as read when active conversation changes or new messages arrive
  React.useEffect(() => {
    if (!selectedConvId) return;

    markMessagesReadAction(selectedConvId).then((res) => {
      if (res.success && res.data && res.data.markedCount > 0) {
        // Update local conversation unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
        );
      }
    });
  }, [selectedConvId, messages.length]);

  // Near-real-time polling for the active conversation
  React.useEffect(() => {
    if (!selectedConvId) return;

    const interval = setInterval(async () => {
      // Pause if tab is inactive/hidden
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;

      try {
        const lastMsg = messages[messages.length - 1];
        const afterTimestamp = lastMsg ? new Date(lastMsg.createdAt).toISOString() : undefined;

        const url = `/api/conversations/${selectedConvId}/messages${
          afterTimestamp ? `?afterTimestamp=${encodeURIComponent(afterTimestamp)}` : ""
        }`;

        const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = data.messages.filter((m: DetailedMessage) => !existingIds.has(m.id));
              if (fresh.length === 0) return prev;
              return [...prev, ...fresh];
            });

            // Update conversation last message in sidebar
            const newest = data.messages[data.messages.length - 1];
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConvId
                  ? {
                      ...c,
                      lastMessageText: newest.content || (newest.attachments.length > 0 ? "Sent an image" : ""),
                      lastMessageAt: new Date(newest.createdAt),
                    }
                  : c
              )
            );
          }
        }
      } catch {
        // Silent poll error handling
      } finally {
        pollInFlightRef.current = false;
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedConvId, messages]);

  // Handle file selection for attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setActionError("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError("Image exceeds 5MB size limit.");
      return;
    }

    setSelectedAttachmentFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAttachmentPreviewUrl(objectUrl);
    setActionError(null);
  };

  const clearAttachment = () => {
    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }
    setSelectedAttachmentFile(null);
    setAttachmentPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle sending message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || (!inputText.trim() && !selectedAttachmentFile) || isSending) return;

    setIsSending(true);
    setActionError(null);

    try {
      let attachmentData: {
        cloudinaryPublicId: string;
        secureUrl: string;
        format: string;
        bytes: number;
        width?: number;
        height?: number;
      } | null = null;

      // Upload attachment first if selected
      if (selectedAttachmentFile) {
        setIsUploadingAttachment(true);
        const formData = new FormData();
        formData.append("file", selectedAttachmentFile);

        const uploadRes = await fetch(`/api/conversations/${selectedConvId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload image.");
        }

        const json = await uploadRes.json();
        attachmentData = json.attachment;
      }

      const textToSend = inputText.trim();

      // Send message via server action
      const res = await sendMessageAction({
        conversationId: selectedConvId,
        content: textToSend || null,
        attachment: attachmentData,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to send message.");
      }

      // Optimistic append
      const optimisticMsg: DetailedMessage = {
        id: res.data?.messageId || `opt_${Date.now()}`,
        conversationId: selectedConvId,
        senderProfileId: currentProfileId,
        content: textToSend || null,
        status: "SENT",
        deliveredAt: new Date(),
        readAt: null,
        createdAt: new Date(),
        isSender: true,
        attachments: attachmentData
          ? [
              {
                id: `opt_att_${Date.now()}`,
                cloudinaryPublicId: attachmentData.cloudinaryPublicId,
                secureUrl: attachmentData.secureUrl,
                format: attachmentData.format,
                bytes: attachmentData.bytes,
                width: attachmentData.width ?? null,
                height: attachmentData.height ?? null,
              },
            ]
          : [],
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText("");
      clearAttachment();

      // Update sidebar conversation item
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                lastMessageText: textToSend || (attachmentData ? "Sent an image" : ""),
                lastMessageAt: new Date(),
              }
            : c
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setIsSending(false);
      setIsUploadingAttachment(false);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message from your view?")) return;
    try {
      await deleteMessageAction(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      setActionError("Failed to delete message.");
    }
  };

  // Handle blocking member
  const handleBlockMember = async () => {
    if (!activeConv) return;
    setIsPerformingSafetyAction(true);
    setActionError(null);

    try {
      const res = await blockUserAction(activeConv.otherProfileId, "Blocked via chat menu");
      if (!res.success) throw new Error(res.error || "Failed to block member.");

      setActiveConv((prev) => (prev ? { ...prev, isBlocked: true } : null));
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConvId ? { ...c, isBlocked: true } : c))
      );
      setShowBlockModal(false);
      setActionSuccess("Member has been blocked. They can no longer contact you.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to block member.");
    } finally {
      setIsPerformingSafetyAction(false);
    }
  };

  // Handle reporting member
  const handleReportMember = async () => {
    if (!activeConv) return;
    setIsPerformingSafetyAction(true);
    setActionError(null);

    try {
      const res = await reportUserAction({
        reportedProfileId: activeConv.otherProfileId,
        reportedConversationId: activeConv.id,
        reason: reportReason,
        description: reportDescription,
      });

      if (!res.success) throw new Error(res.error || "Failed to submit report.");

      setShowReportModal(false);
      setReportDescription("");
      setActionSuccess("Your report has been submitted confidentially to our moderation team.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setIsPerformingSafetyAction(false);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.otherProfile.fullName || "").toLowerCase().includes(q) ||
      (c.otherProfile.cityOfResidence || "").toLowerCase().includes(q) ||
      (c.otherProfile.countryOfResidence || "").toLowerCase().includes(q) ||
      (c.otherProfile.profession || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#FAF8F3]">
      {/* Toast feedback alerts */}
      {actionError && (
        <div className="bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800 border-b border-rose-200 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 border-b border-emerald-200 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ======================= SIDEBAR (CONVERSATION LIST) ======================= */}
        <aside
          className={`w-full border-r border-[#E8E2D5] bg-white md:w-80 lg:w-96 flex flex-col ${
            selectedConvId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="border-b border-[#E8E2D5] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-lg font-bold text-[#14243A] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#B89A63]" />
                <span>Messages</span>
              </h1>
              <Link
                href="/dashboard/matches"
                className="text-xs font-semibold text-[#B89A63] hover:text-[#9A7E4B] transition flex items-center gap-1"
              >
                <span>Mutual Matches</span>
              </Link>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 pl-9 pr-3 text-xs text-[#14243A] placeholder-[#777777] focus:border-[#B89A63] focus:outline-none focus:ring-1 focus:ring-[#B89A63]"
              />
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E8E2D5]/50">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#777777] space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF8F3] text-[#B89A63]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="font-semibold text-[#14243A]">No conversations found</p>
                <p className="text-[11px] text-[#777777] leading-relaxed">
                  Private messaging unlocks once you and a candidate both accept mutual matrimonial interest.
                </p>
                <Link
                  href="/dashboard/matches"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1e3452]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#B89A63]" />
                  <span>View Mutual Matches</span>
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const photoUrl = getOtherProfilePhoto(conv.otherProfile);

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      router.push(`/dashboard/messages/${conv.id}`);
                    }}
                    className={`w-full text-left p-4 transition flex items-start gap-3 hover:bg-[#FAF8F3] ${
                      isSelected ? "bg-[#FAF8F3] border-l-4 border-l-[#B89A63]" : "bg-white"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E8E2D5] bg-[#FAF8F3]">
                      <Image
                        src={photoUrl}
                        alt={conv.otherProfile.fullName || "Member"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#14243A] truncate flex items-center gap-1.5">
                          <span>{conv.otherProfile.fullName || "Member"}</span>
                          {conv.isBlocked && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-semibold text-rose-700">
                              Blocked
                            </span>
                          )}
                        </h4>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-[#777777] shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] text-[#777777] truncate">
                        {conv.otherProfile.profession || "Verified Candidate"}
                        {conv.otherProfile.cityOfResidence ? ` • ${conv.otherProfile.cityOfResidence}` : ""}
                      </p>

                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[11px] text-[#777777] truncate max-w-[180px]">
                          {conv.lastMessageText || "Mutual match established"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B89A63] px-1 text-[10px] font-bold text-white shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ======================= CHAT PANEL ======================= */}
        <main
          className={`flex-1 flex-col bg-[#FAF8F3] ${
            selectedConvId ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Active Chat Header */}
              <div className="border-b border-[#E8E2D5] bg-white px-4 py-3 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => {
                      setSelectedConvId(undefined);
                      router.push("/dashboard/messages");
                    }}
                    className="md:hidden rounded-lg p-1 text-[#777777] hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E8E2D5] bg-[#FAF8F3]">
                    <Image
                      src={getOtherProfilePhoto(activeConv.otherProfile)}
                      alt={activeConv.otherProfile.fullName || "Member"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <h2 className="text-xs font-bold text-[#14243A] flex items-center gap-2">
                      <span>{activeConv.otherProfile.fullName || "Member"}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Mutual Match
                      </span>
                    </h2>
                    <p className="text-[11px] text-[#777777]">
                      {activeConv.otherProfile.cityOfResidence || "Diaspora Member"}
                      {activeConv.otherProfile.countryOfResidence
                        ? `, ${activeConv.otherProfile.countryOfResidence}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Actions Dropdown & Biodata Link */}
                <div className="flex items-center gap-2">
                  {activeConv.otherProfile.slug && (
                    <Link
                      href={`/profile/${activeConv.otherProfile.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E8E2D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14243A] transition hover:border-[#B89A63] hover:text-[#B89A63]"
                    >
                      <span>Biodata</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setShowBlockModal(true)}
                      title="Block member"
                      className="rounded-xl border border-[#E8E2D5] p-2 text-[#777777] transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowReportModal(true)}
                    title="Report message or candidate"
                    className="rounded-xl border border-[#E8E2D5] p-2 text-[#777777] transition hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Block Alert Banner if Blocked */}
              {activeConv.isBlocked && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-medium text-rose-800 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    This conversation is currently restricted because one or both members have
                    blocked communication.
                  </span>
                </div>
              )}

              {/* Message Stream Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#E8E2D5] text-[#B89A63] shadow-xs">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-sm font-bold text-[#14243A]">
                      Mutual Consent Introduction
                    </h3>
                    <p className="max-w-sm text-xs text-[#777777] leading-relaxed">
                      You are speaking with <strong>{activeConv.otherProfile.fullName || "your match"}</strong>.
                      All interactions should remain respectful and purposeful. Send an opening message
                      to begin.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSelf = msg.isSender;
                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col group ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`relative max-w-sm sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-2 ${
                            isSelf
                              ? "bg-[#0F2D3C] text-white rounded-br-none"
                              : "bg-white text-[#14243A] border border-[#E8E2D5] rounded-bl-none"
                          }`}
                        >
                          {/* Image Attachment Rendering */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1">
                              {msg.attachments.map((att) => (
                                <button
                                  key={att.id || att.cloudinaryPublicId}
                                  type="button"
                                  onClick={() => setExpandedImageUrl(att.secureUrl)}
                                  className="relative block w-full overflow-hidden rounded-xl border border-black/10 focus:outline-none"
                                >
                                  <Image
                                    src={att.secureUrl}
                                    alt="Shared attachment"
                                    width={att.width || 600}
                                    height={att.height || 400}
                                    className="object-cover max-h-60 rounded-xl transition hover:opacity-95"
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Text Content */}
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                          {/* Footer with Timestamp and Receipt Ticks */}
                          <div
                            className={`flex items-center justify-end gap-1.5 text-[10px] ${
                              isSelf ? "text-gray-300" : "text-[#777777]"
                            }`}
                          >
                            <span>{formattedTime}</span>

                            {isSelf && (
                              <span title={`Status: ${msg.status}`}>
                                {msg.status === "READ" ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-gray-300" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subtle Action Pill on Hover */}
                        <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-1">
                          {msg.content && (
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.content || "")}
                              title="Copy text"
                              className="text-[10px] text-[#777777] hover:text-[#14243A]"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message from view"
                            className="text-[10px] text-[#777777] hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Bar */}
              {attachmentPreviewUrl && (
                <div className="border-t border-[#E8E2D5] bg-white p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#E8E2D5]">
                      <Image
                        src={attachmentPreviewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-[#14243A]">Ready to send image</p>
                      <p className="text-[10px] text-[#777777]">
                        {selectedAttachmentFile ? `${(selectedAttachmentFile.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearAttachment}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Message Composer */}
              <div className="border-t border-[#E8E2D5] bg-white p-3 sm:p-4">
                {activeConv.isBlocked ? (
                  <div className="text-center text-xs text-[#777777] py-2">
                    Messaging is disabled due to active block restrictions.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="flex items-end gap-2">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* Photo Attachment Trigger */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach safe image (JPG, PNG, WebP up to 5MB)"
                        className="rounded-xl border border-[#E8E2D5] p-2.5 text-[#777777] hover:border-[#B89A63] hover:text-[#B89A63] transition shrink-0"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>

                      {/* Text Input */}
                      <textarea
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a respectful message..."
                        maxLength={2000}
                        className="flex-1 max-h-32 min-h-[42px] rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#14243A] placeholder-[#777777] focus:border-[#B89A63] focus:outline-none focus:ring-1 focus:ring-[#B89A63] resize-none"
                      />

                      {/* Send Button */}
                      <Button
                        type="submit"
                        disabled={
                          isSending ||
                          isUploadingAttachment ||
                          (!inputText.trim() && !selectedAttachmentFile)
                        }
                        className="rounded-xl bg-[#0F2D3C] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1a4459] transition shrink-0"
                      >
                        {isSending || isUploadingAttachment ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                        ) : (
                          <Send className="h-4 w-4 text-[#D4AF37]" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] text-[#777777]">
                      <span>Press Enter to send, Shift + Enter for new line</span>
                      <span>{inputText.length} / 2000</span>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            /* No Conversation Selected Placeholder (Desktop) */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-[#E8E2D5] text-[#B89A63] shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#14243A]">
                Your Private Message Center
              </h2>
              <p className="max-w-md text-xs text-[#777777] leading-relaxed">
                Select a mutual match from the left panel to review message history or continue your
                conversations in complete privacy.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ======================= BLOCK CONFIRMATION MODAL ======================= */}
      {showBlockModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                <Ban className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Block {activeConv.otherProfile.fullName || "Member"}?
              </h3>
            </div>

            <p className="text-xs text-[#777777] leading-relaxed">
              Blocking will immediately terminate communication. Neither member will be able to send
              messages, and existing conversation access will be restricted. Historical messages remain
              stored for moderation safety.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBlockModal(false)}
                disabled={isPerformingSafetyAction}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleBlockMember}
                disabled={isPerformingSafetyAction}
                className="rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {isPerformingSafetyAction ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                <span>Block Member</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= REPORT SAFETY MODAL ======================= */}
      {showReportModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#14243A]">
                Submit Safety Report
              </h3>
            </div>

            <p className="text-xs text-[#777777] leading-relaxed">
              Reports are confidential and reviewed exclusively by authorized moderation staff. The
              reported member is never told who filed the report.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#14243A]">Reason for Report</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Harassment", val: ReportReason.HARASSMENT },
                  { label: "Spam / Promotion", val: ReportReason.SPAM },
                  { label: "Fake Profile", val: ReportReason.FAKE_PROFILE },
                  { label: "Inappropriate Content", val: ReportReason.INAPPROPRIATE_CONTENT },
                  { label: "Scam / Suspicious", val: ReportReason.SCAM_SUSPICIOUS },
                  { label: "Other", val: ReportReason.OTHER },
                ].map((item) => (
                  <label
                    key={item.val}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                      reportReason === item.val
                        ? "border-[#B89A63] bg-[#FAF8F3] font-semibold text-[#14243A]"
                        : "border-[#E8E2D5] bg-white text-[#777777]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={item.val}
                      checked={reportReason === item.val}
                      onChange={() => setReportReason(item.val)}
                      className="accent-[#B89A63]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Description / Context (Optional)
              </label>
              <textarea
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide any details to help moderation investigate..."
                maxLength={1000}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2.5 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(false)}
                disabled={isPerformingSafetyAction}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReportMember}
                disabled={isPerformingSafetyAction}
                className="rounded-xl bg-[#14243A] text-xs font-semibold text-white hover:bg-[#1e3452]"
              >
                {isPerformingSafetyAction ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                <span>Submit Report</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= EXPANDED IMAGE MODAL ======================= */}
      {expandedImageUrl && (
        <div
          onClick={() => setExpandedImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl">
            <Image
              src={expandedImageUrl}
              alt="Expanded Attachment"
              width={1200}
              height={900}
              className="object-contain max-h-[85vh] rounded-2xl"
            />
            <button
              onClick={() => setExpandedImageUrl(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

