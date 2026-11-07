import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { messagingService } from "@/server/services/messaging.service";
import { MessagesClient } from "../messages-client";

export const instant = false;

export const metadata = {
  title: "Conversation | MatrimonyOS",
  description: "Discreet family introduction and mutual messaging.",
};

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationDetailPage({ params }: ConversationDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/messages");
  }

  const { conversationId } = await params;
  const profile = await profileService.getOrCreateProfile(user.id);

  let conversationsResult;
  let activeConversation;
  let initialMessagesResult;

  try {
    [conversationsResult, activeConversation, initialMessagesResult] = await Promise.all([
      messagingService.listConversations(profile.id, { limit: 30 }),
      messagingService.getConversationById(profile.id, conversationId),
      messagingService.listMessages(profile.id, conversationId, { limit: 50 }),
    ]);
  } catch {
    // If not authorized or conversation not found, safely redirect back to inbox
    redirect("/dashboard/messages");
  }

  return (
    <MessagesClient
      currentProfileId={profile.id}
      initialConversations={conversationsResult.conversations}
      activeConversationId={conversationId}
      initialActiveConversation={activeConversation}
      initialMessages={initialMessagesResult.messages}
    />
  );
}

