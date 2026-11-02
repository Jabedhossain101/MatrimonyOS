import { Pool } from "pg";
import "dotenv/config";

async function inspectDb() {
  const directUrl = process.env.DIRECT_URL;
  const dbUrl = process.env.DATABASE_URL;

  console.log("================ DATABASE DIAGNOSTIC ================");
  console.log(`DIRECT_URL present: ${Boolean(directUrl)}`);
  console.log(`DATABASE_URL present: ${Boolean(dbUrl)}`);

  if (!directUrl && !dbUrl) {
    console.error("❌ No database connection strings found in .env");
    process.exit(1);
  }

  const connectionString = directUrl || dbUrl!;
  const parsed = new URL(connectionString);
  console.log(`Target Host: ${parsed.host}`);
  console.log(`Target Database: ${parsed.pathname.replace(/^\//, "")}`);
  console.log(`Target User: ${parsed.username}`);

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to PostgreSQL instance.");

    const dbInfo = await client.query(
      "SELECT current_database() as db, current_schema() as schema, current_user as usr, version() as ver;"
    );
    console.log(`Connected DB: ${dbInfo.rows[0].db}`);
    console.log(`Current Schema: ${dbInfo.rows[0].schema}`);
    console.log(`Database User: ${dbInfo.rows[0].usr}`);

    // List all tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(
      `\nFound ${tablesRes.rows.length} table(s) in schema 'public':`
    );
    if (tablesRes.rows.length === 0) {
      console.log("⚠️  NO TABLES FOUND! The public schema is currently empty.");
    } else {
      for (const row of tablesRes.rows) {
        console.log(`  - [${row.table_type}] ${row.table_name}`);
      }
    }

    // Check _prisma_migrations
    const hasMigrationsTable = tablesRes.rows.some(
      (r) => r.table_name === "_prisma_migrations"
    );

    if (hasMigrationsTable) {
      const migRes = await client.query(
        "SELECT id, migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at ASC;"
      );
      console.log(`\nPrisma Migrations Recorded (${migRes.rows.length}):`);
      for (const m of migRes.rows) {
        console.log(
          `  - ${m.migration_name} (steps: ${m.applied_steps_count}, finished: ${m.finished_at})`
        );
      }
    } else {
      console.log("\n⚠️  _prisma_migrations table does NOT exist.");
    }

    client.release();
    await pool.end();
  } catch (err) {
    console.error(
      "❌ Diagnostic query failed:",
      err instanceof Error ? err.message : err
    );
    await pool.end();
    process.exit(1);
  }
}

inspectDb();
