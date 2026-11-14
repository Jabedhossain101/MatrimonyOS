import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required for database connectivity"),
  DIRECT_URL: z
    .string()
    .min(1, "DIRECT_URL is required for Prisma database migrations"),
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters long")
    .default("dev-auth-secret-placeholder-minimum-32-chars-long"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("MatrimonyOS <no-reply@matrimonyos.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYMENTS_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_BASE_URL: z
    .string()
    .url()
    .optional()
    .default("https://tokenized.sandbox.bka.sh/v1.2.0-beta"),
  BKASH_IS_SANDBOX: z
    .enum(["true", "false"])
    .optional()
    .default("true")
    .transform((v) => v === "true"),
  BKASH_WEBHOOK_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  BKASH_AGREEMENT_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  PAYMENT_CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED,
  BKASH_APP_KEY: process.env.BKASH_APP_KEY,
  BKASH_APP_SECRET: process.env.BKASH_APP_SECRET,
  BKASH_USERNAME: process.env.BKASH_USERNAME,
  BKASH_PASSWORD: process.env.BKASH_PASSWORD,
  BKASH_BASE_URL: process.env.BKASH_BASE_URL || undefined,
  BKASH_IS_SANDBOX: process.env.BKASH_IS_SANDBOX,
  BKASH_WEBHOOK_ENABLED: process.env.BKASH_WEBHOOK_ENABLED,
  BKASH_AGREEMENT_ENABLED: process.env.BKASH_AGREEMENT_ENABLED,
  PAYMENT_CRON_SECRET: process.env.PAYMENT_CRON_SECRET,
});

if (!parsedEnv.success) {
  console.error(
    "❌ [Environment Validation Error] Invalid environment configuration:",
    JSON.stringify(parsedEnv.error.format(), null, 2)
  );
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing or invalid critical environment variables in production."
    );
  }
}

export const env: Env = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV:
        (process.env.NODE_ENV as "development" | "test" | "production") ||
        "development",
      DATABASE_URL: process.env.DATABASE_URL || "",
      DIRECT_URL: process.env.DIRECT_URL || "",
      AUTH_SECRET:
        process.env.AUTH_SECRET ||
        "dev-auth-secret-placeholder-minimum-32-chars-long",
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      BETTER_AUTH_URL:
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM:
        process.env.EMAIL_FROM || "MatrimonyOS <no-reply@matrimonyos.com>",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED === "true",
      BKASH_APP_KEY: process.env.BKASH_APP_KEY,
      BKASH_APP_SECRET: process.env.BKASH_APP_SECRET,
      BKASH_USERNAME: process.env.BKASH_USERNAME,
      BKASH_PASSWORD: process.env.BKASH_PASSWORD,
      BKASH_BASE_URL:
        process.env.BKASH_BASE_URL ||
        "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
      BKASH_IS_SANDBOX: process.env.BKASH_IS_SANDBOX !== "false",
      BKASH_WEBHOOK_ENABLED: process.env.BKASH_WEBHOOK_ENABLED === "true",
      BKASH_AGREEMENT_ENABLED: process.env.BKASH_AGREEMENT_ENABLED === "true",
      PAYMENT_CRON_SECRET: process.env.PAYMENT_CRON_SECRET,
    };

export function isBkashConfigured(): boolean {
  return Boolean(
    env.PAYMENTS_ENABLED &&
      env.BKASH_APP_KEY &&
      env.BKASH_APP_SECRET &&
      env.BKASH_USERNAME &&
      env.BKASH_PASSWORD &&
      env.BKASH_BASE_URL
  );
}
