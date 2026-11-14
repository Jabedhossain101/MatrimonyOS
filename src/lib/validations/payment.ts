import { z } from "zod";
import { BillingCycle, PaymentStatus, RefundStatus } from "@/generated/prisma";

export const createCheckoutSchema = z.object({
  planId: z.string().min(1, "Subscription plan ID is required"),
  billingCycle: z
    .nativeEnum(BillingCycle)
    .default(BillingCycle.MONTHLY),
  idempotencyKey: z
    .string()
    .min(8, "Idempotency key must be at least 8 characters")
    .max(128, "Idempotency key is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid idempotency key format"),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const bkashCallbackSchema = z.object({
  paymentID: z.string().min(1, "bKash paymentID is required").max(128),
  status: z
    .enum(["success", "failure", "cancel"])
    .or(z.string().min(1)),
  signature: z.string().optional(),
  apiVersion: z.string().optional(),
});

export type BkashCallbackInput = z.infer<typeof bkashCallbackSchema>;

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  reason: z
    .string()
    .min(5, "Please provide a brief cancellation reason (min 5 characters)")
    .max(500),
  immediate: z.boolean().default(false),
});

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const refundRequestSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid positive decimal (up to 2 decimal places)")
    .refine((val) => Number(val) > 0, "Refund amount must be greater than zero"),
  reason: z
    .string()
    .min(5, "Refund reason must be at least 5 characters")
    .max(500),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

export const adminRefundReviewSchema = z.object({
  refundId: z.string().min(1, "Refund ID is required"),
  action: z.enum(["EXECUTE_PROVIDER_REFUND", "QUERY_STATUS", "REJECT"]),
  adminNotes: z
    .string()
    .min(5, "Administrative notes must be at least 5 characters")
    .max(1000),
});

export type AdminRefundReviewInput = z.infer<typeof adminRefundReviewSchema>;

export const reconcilePaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z
    .string()
    .min(5, "Reconciliation reason is required for audit logs")
    .max(500)
    .optional(),
});

export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;

export const adminPaymentFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
  search: z.string().max(120).optional(),
});

export const adminRefundFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(RefundStatus).optional(),
});

export const bkashSnsEnvelopeSchema = z.object({
  Type: z.enum([
    "SubscriptionConfirmation",
    "Notification",
    "UnsubscribeConfirmation",
  ]),
  MessageId: z.string().min(1),
  Token: z.string().optional(),
  TopicArn: z.string().min(1),
  Subject: z.string().optional(),
  Message: z.string().min(1),
  SubscribeURL: z.string().url().optional(),
  Timestamp: z.string().min(1),
  SignatureVersion: z.enum(["1", "2"]),
  Signature: z.string().min(1),
  SigningCertURL: z.string().url(),
  UnsubscribeURL: z.string().url().optional(),
});

export type BkashSnsEnvelope = z.infer<typeof bkashSnsEnvelopeSchema>;

