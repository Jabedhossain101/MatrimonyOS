import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { notificationService } from "@/server/services/notification.service";
import { NotificationsClient } from "./notifications-client";

export const instant = false;

export const metadata = {
  title: "Notifications | MatrimonyOS",
  description: "Stay updated on matrimonial interests, mutual matches, and conversations.",
};

interface NotificationsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/notifications");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const resolvedParams = await searchParams;

  const page = Number(resolvedParams.page) || 1;
  const unreadOnly = resolvedParams.filter === "unread";

  const result = await notificationService.listNotifications(profile.id, {
    page,
    limit: 20,
    unreadOnly,
  });

  return (
    <NotificationsClient
      initialData={result}
      currentPage={page}
      initialFilter={unreadOnly ? "unread" : "all"}
    />
  );
}

