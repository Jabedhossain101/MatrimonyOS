import { z } from "zod";
import { Gender, MaritalStatus, FamilyType } from "@/generated/prisma";

export const discoveryFilterSchema = z
  .object({
    gender: z.nativeEnum(Gender).optional(),
    minAge: z.coerce.number().min(18).max(100).optional(),
    maxAge: z.coerce.number().min(18).max(100).optional(),
    minHeightCm: z.coerce.number().min(100).max(250).optional(),
    maxHeightCm: z.coerce.number().min(100).max(250).optional(),
    maritalStatus: z.array(z.nativeEnum(MaritalStatus)).optional().or(z.nativeEnum(MaritalStatus).transform((v) => [v])),
    country: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    nationality: z.string().trim().max(100).optional(),
    religion: z.string().trim().max(50).optional(),
    educationLevel: z.string().trim().max(100).optional(),
    profession: z.string().trim().max(100).optional(),
    employmentStatus: z.string().trim().max(100).optional(),
    familyType: z.nativeEnum(FamilyType).optional(),
    dietaryHabits: z.string().trim().max(50).optional(),
    smokingHabits: z.string().trim().max(50).optional(),
    drinkingHabits: z.string().trim().max(50).optional(),
    hasPhoto: z.coerce.boolean().optional(),
    isVerified: z.coerce.boolean().optional(),
    minCompletion: z.coerce.number().min(0).max(100).optional(),
    sort: z
      .enum(["recommended", "newest", "updated", "age_asc", "age_desc", "completion"])
      .default("recommended"),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12),
  })
  .refine(
    (data) => !data.minAge || !data.maxAge || data.minAge <= data.maxAge,
    {
      message: "Minimum age cannot exceed maximum age",
      path: ["maxAge"],
    }
  );

export type DiscoveryFilterInput = z.infer<typeof discoveryFilterSchema>;

export const sendInterestSchema = z.object({
  recipientProfileId: z.string().min(1, "Recipient profile is required"),
  message: z.string().trim().max(500, "Message cannot exceed 500 characters").optional().nullable(),
});

export type SendInterestInput = z.infer<typeof sendInterestSchema>;

export const respondInterestSchema = z.object({
  interestId: z.string().min(1, "Interest ID is required"),
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export type RespondInterestInput = z.infer<typeof respondInterestSchema>;

export const withdrawInterestSchema = z.object({
  interestId: z.string().min(1, "Interest ID is required"),
});

export type WithdrawInterestInput = z.infer<typeof withdrawInterestSchema>;

export const toggleShortlistSchema = z.object({
  targetProfileId: z.string().min(1, "Target profile is required"),
});

export type ToggleShortlistInput = z.infer<typeof toggleShortlistSchema>;
