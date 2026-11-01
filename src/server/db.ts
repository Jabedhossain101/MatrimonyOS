import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";
import { env } from "@/lib/env";

declare global {
  var __prismaClient: PrismaClient | undefined;
  var __pgPool: Pool | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = env.DATABASE_URL;

  const pool =
    globalThis.__pgPool ??
    new Pool({
      connectionString,
      ssl:
        connectionString.includes("neon.tech") ||
        connectionString.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      max: process.env.NODE_ENV === "production" ? 20 : 5,
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalThis.__prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = db;
}

export type DatabaseClient = typeof db;
