import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/constants";
import { env } from "@/lib/env";

interface HealthCheckResult {
  status: "healthy" | "degraded";
  application: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
    timestamp: string;
  };
  database: {
    configured: boolean;
    provider: "neon-postgresql";
    status: "connected" | "disconnected" | "placeholder_credentials";
    message: string;
  };
}

export async function GET() {
  const isPlaceholderDb =
    !env.DATABASE_URL ||
    env.DATABASE_URL.includes("placeholder") ||
    env.DATABASE_URL.includes("[user]");

  let dbStatus: "connected" | "disconnected" | "placeholder_credentials" =
    isPlaceholderDb ? "placeholder_credentials" : "disconnected";
  let dbMessage = isPlaceholderDb
    ? "Neon database credentials are set to placeholder values. Provide valid DATABASE_URL in .env to connect."
    : "Database not verified.";

  if (!isPlaceholderDb) {
    try {
      const { db } = await import("@/server/db");
      await db.$queryRaw`SELECT 1`;
      dbStatus = "connected";
      dbMessage = "Successfully connected to Neon PostgreSQL database.";
    } catch (error) {
      dbStatus = "disconnected";
      dbMessage =
        error instanceof Error ? error.message : "Database connection failed.";
    }
  }

  const response: HealthCheckResult = {
    status:
      dbStatus === "connected" || isPlaceholderDb ? "healthy" : "degraded",
    application: {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    database: {
      configured: !isPlaceholderDb,
      provider: "neon-postgresql",
      status: dbStatus,
      message: dbMessage,
    },
  };

  return NextResponse.json(response, { status: 200 });
}
