import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { messagingService } from "@/server/services/messaging.service";
import { MessagesClient } from "./messages-client";

export const instant = false;

export const metadata = {
  title: "Private Messages | MatrimonyOS",
  description: "Secure, consent-driven messaging between verified mutual matches.",
};

interface MessagesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/messages");
  }

  const profile = await profileService.getOrCreateProfile(user.id);
  const resolvedParams = await searchParams;

  const selectedConversationId =
    typeof resolvedParams.c === "string" ? resolvedParams.c : undefined;

  const [conversationsResult, initialConversationData] = await Promise.all([
    messagingService.listConversations(profile.id, { limit: 30 }),
    selectedConversationId
      ? Promise.all([
          messagingService.getConversationById(profile.id, selectedConversationId).catch(() => null),
          messagingService.listMessages(profile.id, selectedConversationId, { limit: 50 }).catch(() => null),
        ])
      : Promise.resolve([null, null]),
  ]);

  const [activeConversation, initialMessagesResult] = initialConversationData;

  return (
    <MessagesClient
      currentProfileId={profile.id}
      initialConversations={conversationsResult.conversations}
      activeConversationId={selectedConversationId}
      initialActiveConversation={activeConversation}
      initialMessages={initialMessagesResult ? initialMessagesResult.messages : []}
    />
  );
}

