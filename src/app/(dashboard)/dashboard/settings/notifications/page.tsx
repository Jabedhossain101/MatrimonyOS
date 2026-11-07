import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { notificationService } from "@/server/services/notification.service";
import { NotificationSettingsClient } from "./notification-settings-client";

export const instant = false;

export const metadata = {
  title: "Notification Preferences | MatrimonyOS",
  description: "Customize your in-app and email alert preferences.",
};

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/settings/notifications");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const preferences = await notificationService.getOrCreatePreferences(profile.id);

  return <NotificationSettingsClient initialPreferences={preferences} />;
}

