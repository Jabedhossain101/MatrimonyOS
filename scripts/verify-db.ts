import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

async function verifyDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl || databaseUrl.includes("placeholder")) {
    console.error("❌ DATABASE_URL is missing or contains placeholder values.");
    process.exit(1);
  }

  // Sanitize host display for security
  let sanitizedHost = "unknown";
  try {
    const parsed = new URL(databaseUrl.replace("postgresql://", "http://"));
    sanitizedHost = parsed.hostname.replace(/^[a-z0-9-]+(?=\.)/, "ep-***");
  } catch {
    sanitizedHost = "configured-neon-host";
  }

  console.log("ℹ️  Testing connection to Neon PostgreSQL...");
  console.log(`ℹ️  Target Host: ${sanitizedHost}`);
  console.log(`ℹ️  Pooled URL Configured: ${Boolean(databaseUrl)}`);
  console.log(`ℹ️  Direct URL Configured: ${Boolean(directUrl)}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Direct pool query
    const poolRes = await pool.query(
      "SELECT 1 AS pool_check, NOW() AS server_time, current_database() AS db_name;"
    );
    const serverTime = poolRes.rows[0]?.server_time;
    const dbName = poolRes.rows[0]?.db_name;
    console.log(
      `✅ Direct pg pool query succeeded. Database: "${dbName}", Server Time: ${serverTime}`
    );

    // 2. Prisma Client query via PostgreSQL Driver Adapter
    const prismaRes = await prisma.$queryRaw<
      Array<{ check: number }>
    >`SELECT 1 as check`;
    console.log(
      `✅ Prisma Client with @prisma/adapter-pg query succeeded:`,
      prismaRes
    );

    console.log(
      "🎉 Database integration verified successfully! Safe, read-only connectivity confirmed."
    );
  } catch (error) {
    console.error("❌ Database connectivity check failed:");
    if (error instanceof Error) {
      // Remove any potential credentials in error message
      const sanitizedMessage = error.message.replace(/:[^:@]+@/, ":****@");
      console.error("   Error:", sanitizedMessage);
    } else {
      console.error("   Unknown error:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyDatabase().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
