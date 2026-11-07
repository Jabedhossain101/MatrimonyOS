import { z } from "zod";
import { ReportReason } from "@/generated/prisma";

export const createConversationSchema = z.object({
  targetProfileId: z.string().min(1, "Target profile is required"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const messageAttachmentInputSchema = z.object({
  cloudinaryPublicId: z.string().min(1),
  secureUrl: z.string().url(),
  format: z.string().min(1),
  bytes: z.number().positive().max(5 * 1024 * 1024, "Image must not exceed 5MB"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export type MessageAttachmentInput = z.infer<typeof messageAttachmentInputSchema>;

export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1, "Conversation ID is required"),
    content: z
      .string()
      .trim()
      .max(2000, "Message cannot exceed 2000 characters")
      .optional()
      .nullable(),
    attachment: messageAttachmentInputSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      const hasContent = Boolean(data.content && data.content.trim().length > 0);
      const hasAttachment = Boolean(data.attachment);
      return hasContent || hasAttachment;
    },
    {
      message: "Message must contain either text content or an attachment",
      path: ["content"],
    }
  );

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const markMessagesReadSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export type MarkMessagesReadInput = z.infer<typeof markMessagesReadSchema>;

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

export const blockUserSchema = z.object({
  targetProfileId: z.string().min(1, "Target profile ID is required"),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters").optional().nullable(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

export const unblockUserSchema = z.object({
  targetProfileId: z.string().min(1, "Target profile ID is required"),
});

export type UnblockUserInput = z.infer<typeof unblockUserSchema>;

export const reportUserSchema = z.object({
  reportedProfileId: z.string().min(1, "Reported profile ID is required"),
  reportedMessageId: z.string().optional().nullable(),
  reportedConversationId: z.string().optional().nullable(),
  reason: z.nativeEnum(ReportReason, {
    errorMap: () => ({ message: "Please select a valid report reason" }),
  }),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
});

export type ReportUserInput = z.infer<typeof reportUserSchema>;

