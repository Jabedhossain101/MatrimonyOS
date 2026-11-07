import { describe, it, expect } from "vitest";
import {
  sendMessageSchema,
  createConversationSchema,
  blockUserSchema,
  unblockUserSchema,
  reportUserSchema,
  messageAttachmentInputSchema,
} from "@/lib/validations/messaging";
import { ReportReason } from "@/generated/prisma";

describe("Messaging Validation Schemas", () => {
  describe("sendMessageSchema", () => {
    it("should accept valid text message without attachment", () => {
      const parsed = sendMessageSchema.parse({
        conversationId: "conv_123",
        content: "Salam, how are you?",
      });
      expect(parsed.conversationId).toBe("conv_123");
      expect(parsed.content).toBe("Salam, how are you?");
    });

    it("should reject message without text and without attachment", () => {
      const result = sendMessageSchema.safeParse({
        conversationId: "conv_123",
        content: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/either text content or an attachment/i);
      }
    });

    it("should reject message exceeding 2000 characters", () => {
      const longText = "a".repeat(2001);
      const result = sendMessageSchema.safeParse({
        conversationId: "conv_123",
        content: longText,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/cannot exceed 2000 characters/i);
      }
    });

    it("should accept message with attachment and empty or null text", () => {
      const parsed = sendMessageSchema.parse({
        conversationId: "conv_123",
        content: "",
        attachment: {
          cloudinaryPublicId: "pub_123",
          secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          format: "jpg",
          bytes: 1024 * 1024, // 1MB
        },
      });
      expect(parsed.attachment?.cloudinaryPublicId).toBe("pub_123");
      expect(parsed.attachment?.secureUrl).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    });

    it("should reject attachment exceeding 5MB limit", () => {
      const result = messageAttachmentInputSchema.safeParse({
        cloudinaryPublicId: "pub_large",
        secureUrl: "https://res.cloudinary.com/demo/image/upload/large.jpg",
        format: "jpg",
        bytes: 6 * 1024 * 1024, // 6MB
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/must not exceed 5MB/i);
      }
    });

    it("should reject attachment with invalid URL", () => {
      const result = messageAttachmentInputSchema.safeParse({
        cloudinaryPublicId: "pub_invalid",
        secureUrl: "not-a-valid-url",
        format: "png",
        bytes: 1000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createConversationSchema", () => {
    it("should validate a valid targetProfileId", () => {
      const parsed = createConversationSchema.parse({
        targetProfileId: "prof_xyz",
      });
      expect(parsed.targetProfileId).toBe("prof_xyz");
    });

    it("should reject empty targetProfileId", () => {
      const result = createConversationSchema.safeParse({
        targetProfileId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("blockUserSchema & unblockUserSchema", () => {
    it("should accept valid block input with optional reason", () => {
      const parsed = blockUserSchema.parse({
        targetProfileId: "prof_block_1",
        reason: "Inappropriate communication conduct.",
      });
      expect(parsed.targetProfileId).toBe("prof_block_1");
      expect(parsed.reason).toBe("Inappropriate communication conduct.");
    });

    it("should reject block reason exceeding 500 characters", () => {
      const result = blockUserSchema.safeParse({
        targetProfileId: "prof_block_1",
        reason: "x".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/cannot exceed 500 characters/i);
      }
    });

    it("should validate unblock input", () => {
      const parsed = unblockUserSchema.parse({
        targetProfileId: "prof_unblock_1",
      });
      expect(parsed.targetProfileId).toBe("prof_unblock_1");
    });
  });

  describe("reportUserSchema", () => {
    it("should accept valid report for all valid ReportReason enums", () => {
      const validReasons: ReportReason[] = [
        ReportReason.HARASSMENT,
        ReportReason.SPAM,
        ReportReason.FAKE_PROFILE,
        ReportReason.INAPPROPRIATE_CONTENT,
        ReportReason.SCAM_SUSPICIOUS,
        ReportReason.OTHER,
      ];

      for (const reason of validReasons) {
        const parsed = reportUserSchema.parse({
          reportedProfileId: "prof_reported_1",
          reason,
          description: "Details regarding the issue.",
        });
        expect(parsed.reason).toBe(reason);
      }
    });

    it("should reject invalid report reason", () => {
      const result = reportUserSchema.safeParse({
        reportedProfileId: "prof_reported_1",
        reason: "INVALID_REASON",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/valid report reason/i);
      }
    });

    it("should reject description exceeding 1000 characters", () => {
      const result = reportUserSchema.safeParse({
        reportedProfileId: "prof_reported_1",
        reason: ReportReason.HARASSMENT,
        description: "y".repeat(1001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/cannot exceed 1000 characters/i);
      }
    });
  });
});

