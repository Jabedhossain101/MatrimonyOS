"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  Sparkles,
  XCircle,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "@/server/actions/notification.actions";
import { NotificationType } from "@/generated/prisma";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
  sender?: {
    id: string;
    fullName: string | null;
    slug: string;
    photos: { secureUrl: string }[];
  } | null;
}

interface NotificationsClientProps {
  initialData: {
    items: NotificationItem[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
  };
  currentPage: number;
  initialFilter: "all" | "unread";
}

export function NotificationsClient({
  initialData,
  currentPage,
  initialFilter,
}: NotificationsClientProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialData.items);
  const [unreadCount, setUnreadCount] = React.useState(initialData.unreadCount);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "unread">(initialFilter);

  // Sync state if initialData changes
  const [prevData, setPrevData] = React.useState(initialData);
  if (prevData !== initialData) {
    setPrevData(initialData);
    setItems(initialData.items);
    setUnreadCount(initialData.unreadCount);
  }

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationReadAction(id);
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = items.find((i) => i.id === id);
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteNotificationAction(id);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INTEREST_RECEIVED:
        return <Heart className="h-4 w-4 text-[#B89A63]" />;
      case NotificationType.INTEREST_ACCEPTED:
      case NotificationType.MUTUAL_MATCH_CREATED:
        return <Sparkles className="h-4 w-4 text-emerald-600" />;
      case NotificationType.INTEREST_DECLINED:
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case NotificationType.NEW_MESSAGE:
        return <MessageSquare className="h-4 w-4 text-[#0F2D3C]" />;
      case NotificationType.SYSTEM_ANNOUNCEMENT:
      default:
        return <Bell className="h-4 w-4 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-16">
      {/* Header Banner */}
      <div className="border-b border-[#E8E2D5] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B89A63]">
                  Activity & Updates
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#B89A63] px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#14243A]">
                Notification Center
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="rounded-xl border-[#E8E2D5] bg-white text-xs font-semibold text-[#14243A] hover:border-[#B89A63]"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-[#B89A63]" />
                <span>Mark All Read</span>
              </Button>

              <Link
                href="/dashboard/settings/notifications"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3 py-2 text-xs font-semibold text-[#14243A] hover:border-[#B89A63] transition"
              >
                <Settings className="h-3.5 w-3.5 text-[#777777]" />
                <span>Preferences</span>
              </Link>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-6 flex items-center gap-2 border-t border-[#E8E2D5] pt-4">
            <button
              onClick={() => {
                setActiveFilter("all");
                router.push("/dashboard/notifications");
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeFilter === "all"
                  ? "bg-[#14243A] text-white"
                  : "bg-white text-[#777777] border border-[#E8E2D5] hover:text-[#14243A]"
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => {
                setActiveFilter("unread");
                router.push("/dashboard/notifications?filter=unread");
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeFilter === "unread"
                  ? "bg-[#14243A] text-white"
                  : "bg-white text-[#777777] border border-[#E8E2D5] hover:text-[#14243A]"
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Notification Stream */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8F3] text-[#B89A63]">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold text-[#14243A]">
              {activeFilter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#777777] leading-relaxed">
              When other members express interest, accept your introductions, or send private messages,
              updates will appear right here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const formattedDate = new Date(n.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.link) router.push(n.link);
                  }}
                  className={`group relative flex items-start justify-between rounded-2xl border p-4 sm:p-5 transition cursor-pointer shadow-2xs hover:border-[#B89A63] ${
                    n.isRead
                      ? "border-[#E8E2D5] bg-white hover:bg-[#FAF8F3]"
                      : "border-[#B89A63]/60 bg-amber-50/20 hover:bg-amber-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D5] bg-white shadow-2xs">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#14243A] flex items-center gap-1.5">
                          <span>{n.title}</span>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[#B89A63]" />
                          )}
                        </h4>
                        <span className="text-[10px] text-[#777777]">
                          • {formattedDate}
                        </span>
                      </div>

                      <p className="text-xs text-[#555555] leading-relaxed line-clamp-2">
                        {n.body}
                      </p>

                      {n.link && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B89A63] group-hover:text-[#9A7E4B]">
                            <span>Open details</span>
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkSingleRead(n.id, e)}
                        title="Mark as read"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-[#14243A]"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      title="Dismiss notification"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[#E8E2D5] pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                router.push(
                  `/dashboard/notifications?page=${currentPage - 1}${
                    activeFilter === "unread" ? "&filter=unread" : ""
                  }`
                )
              }
              className="rounded-xl border-[#E8E2D5] bg-white text-xs"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <span className="text-xs text-[#777777]">
              Page {currentPage} of {initialData.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= initialData.totalPages}
              onClick={() =>
                router.push(
                  `/dashboard/notifications?page=${currentPage + 1}${
                    activeFilter === "unread" ? "&filter=unread" : ""
                  }`
                )
              }
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

