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
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
    };
