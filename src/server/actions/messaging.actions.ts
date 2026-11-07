"use server";

import { requireAuthenticatedUser } from "@/server/policies/auth.policy";
import { profileService } from "@/server/services/profile.service";
import { messagingService } from "@/server/services/messaging.service";
import { notificationService } from "@/server/services/notification.service";
import {
  sendMessageSchema,
  createConversationSchema,
  markMessagesReadSchema,
  deleteMessageSchema,
  type SendMessageInput,
} from "@/lib/validations/messaging";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get or initiate a conversation with an eligible mutual match.
 */
export async function getOrCreateConversationAction(
  targetProfileId: string
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = createConversationSchema.parse({ targetProfileId });

    const conversation = await messagingService.getOrCreateConversation(
      profile.id,
      valid.targetProfileId
    );

    revalidatePath("/dashboard/messages");
    return { success: true, data: { conversationId: conversation.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to initiate conversation.",
    };
  }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessageAction(
  input: SendMessageInput
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = sendMessageSchema.parse(input);

    const message = await messagingService.sendMessage(profile.id, valid);

    revalidatePath(`/dashboard/messages/${valid.conversationId}`);
    revalidatePath("/dashboard/messages");
    return { success: true, data: { messageId: message.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send message.",
    };
  }
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markMessagesReadAction(
  conversationId: string
): Promise<ActionResult<{ markedCount: number }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = markMessagesReadSchema.parse({ conversationId });

    const result = await messagingService.markMessagesAsRead(profile.id, valid.conversationId);

    revalidatePath("/dashboard/messages");
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark messages as read.",
    };
  }
}

/**
 * Delete a message for current user.
 */
export async function deleteMessageAction(
  messageId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);
    const valid = deleteMessageSchema.parse({ messageId });

    await messagingService.deleteMessage(profile.id, valid.messageId);

    return { success: true, data: { deleted: true } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete message.",
    };
  }
}

/**
 * Get active conversations list.
 */
export async function getConversationsAction(options?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await messagingService.listConversations(profile.id, options);
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load conversations.",
    };
  }
}

/**
 * Get messages for a conversation.
 */
export async function getMessagesAction(
  conversationId: string,
  options?: { cursor?: string; limit?: number; afterTimestamp?: string }
): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const result = await messagingService.listMessages(profile.id, conversationId, options);
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load messages.",
    };
  }
}

/**
 * Get unread messages and notifications counts for badge indicators.
 */
export async function getUnreadCountsAction(): Promise<
  ActionResult<{ unreadMessages: number; unreadNotifications: number }>
> {
  try {
    const user = await requireAuthenticatedUser();
    const profile = await profileService.getOrCreateProfile(user.id);

    const [unreadMessages, unreadNotifications] = await Promise.all([
      messagingService.getUnreadMessagesTotalCount(profile.id),
      notificationService.getUnreadCount(profile.id),
    ]);

    return {
      success: true,
      data: {
        unreadMessages,
        unreadNotifications,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load unread counts.",
    };
  }
}

