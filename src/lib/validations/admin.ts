import { z } from "zod";
import {
  AppRole,
  ReportStatus,
  SubscriptionStatus,
  BillingCycle,
  VerificationType,
} from "@/generated/prisma";

export const userStatusUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;

export const userRoleUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.nativeEnum(AppRole, {
    errorMap: () => ({ message: "Invalid application role" }),
  }),
  action: z.enum(["ASSIGN", "REVOKE"]),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;

export const profileModerationSchema = z
  .object({
    profileId: z.string().min(1, "Profile ID is required"),
    action: z.enum(["APPROVE", "REJECT"]),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.action === "REJECT") {
        return Boolean(data.reason && data.reason.trim().length >= 5);
      }
      return true;
    },
    {
      message: "A rejection reason of at least 5 characters is required",
      path: ["reason"],
    }
  );

export type ProfileModerationInput = z.infer<typeof profileModerationSchema>;

export const photoModerationSchema = z
  .object({
    photoId: z.string().min(1, "Photo ID is required"),
    action: z.enum(["APPROVE", "REJECT"]),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.action === "REJECT") {
        return Boolean(data.reason && data.reason.trim().length >= 5);
      }
      return true;
    },
    {
      message: "A rejection reason of at least 5 characters is required",
      path: ["reason"],
    }
  );

export type PhotoModerationInput = z.infer<typeof photoModerationSchema>;

export const verificationReviewSchema = z
  .object({
    verificationId: z.string().min(1, "Verification ID is required"),
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z
      .string()
      .trim()
      .max(500, "Rejection reason cannot exceed 500 characters")
      .optional()
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.action === "REJECT") {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 5);
      }
      return true;
    },
    {
      message: "A rejection reason of at least 5 characters is required when rejecting",
      path: ["rejectionReason"],
    }
  );

export type VerificationReviewInput = z.infer<typeof verificationReviewSchema>;

export const submitVerificationRequestSchema = z.object({
  verificationType: z.nativeEnum(VerificationType),
  documentUrl: z.string().url("Must be a valid document URL"),
  cloudinaryPublicId: z.string().min(1, "Cloudinary asset ID is required"),
  documentType: z.string().default("IMAGE"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type SubmitVerificationRequestInput = z.infer<typeof submitVerificationRequestSchema>;

export const reportResolutionSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  status: z.nativeEnum(ReportStatus),
  resolutionNotes: z
    .string()
    .trim()
    .min(5, "Resolution notes must be at least 5 characters")
    .max(1000, "Resolution notes cannot exceed 1000 characters"),
  suspendUser: z.boolean().default(false),
  suspensionReason: z.string().trim().max(500).optional().nullable(),
});

export type ReportResolutionInput = z.infer<typeof reportResolutionSchema>;

export const reportAssignSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  assignedToUserId: z.string().min(1, "Assignee User ID is required"),
});

export type ReportAssignInput = z.infer<typeof reportAssignSchema>;

export const planUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .toUpperCase(),
  description: z.string().trim().max(500).optional().nullable(),
  priceMonthly: z.number().min(0, "Price must be non-negative"),
  priceQuarterly: z.number().min(0).optional().nullable(),
  priceYearly: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  features: z.array(z.string().trim()).default([]),
  entitlements: z
    .record(z.string(), z.string())
    .default({}),
});

export type PlanUpsertInput = z.infer<typeof planUpsertSchema>;

export const manualSubscriptionAdjustmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  planId: z.string().min(1, "Plan ID is required"),
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.ACTIVE),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  durationDays: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 day")
    .max(3650, "Duration cannot exceed 10 years")
    .default(30),
  reason: z
    .string()
    .trim()
    .min(5, "Administrative reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type ManualSubscriptionAdjustmentInput = z.infer<
  typeof manualSubscriptionAdjustmentSchema
>;

export const platformSettingUpdateSchema = z.object({
  key: z.string().trim().min(2).max(100),
  value: z.string().trim().min(1, "Value cannot be empty"),
  category: z.string().trim().default("GENERAL"),
  description: z.string().trim().max(255).optional().nullable(),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500)
    .optional(),
});

export type PlatformSettingUpdateInput = z.infer<typeof platformSettingUpdateSchema>;

