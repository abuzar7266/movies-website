import type {} from "./types/generated.d.ts";
import "dotenv/config";

process.env.NODE_ENV = "test";

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

// Avoid domain-bound cookies in tests; let cookies be host-only
delete process.env.COOKIE_DOMAIN;

import { beforeAll } from "vitest";
import { prisma } from "@/db.js";

if (!process.env.DATABASE_URL_TEST) {
  throw new Error("DATABASE_URL_TEST must be set to run unit/integration tests");
}
const testDbUrl = process.env.DATABASE_URL_TEST || "";

function _isSafeTestDbUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();
    const db = (u.pathname || "").toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "postgres" ||
      host === "db" ||
      db.includes("test")
    );
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function purgeDatabase() {
  if (!prisma) return;
  if (!_isSafeTestDbUrl(testDbUrl)) {
    console.warn("[tests] DATABASE_URL_TEST did not look like a safe test DB; proceeding due to NODE_ENV=test");
  }
  // Light retry for transient connection errors on shared test DBs
  let attempts = 0;
  while (true) {
    try {
      await prisma.$connect();
      const tables = await prisma.$queryRaw<
        { table_name: string }[]
      >`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`;
      const names = tables.map((t) => t.table_name).filter(Boolean);
      if (names.length === 0) {
        await prisma.$disconnect();
        return;
      }
      const quoted = names.map((n) => `"public"."${n.replace(/"/g, "\"")}"`).join(", ");
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
      await prisma.$disconnect();
      return;
    } catch (err) {
      attempts++;
      await prisma.$disconnect().catch(() => {});
      if (attempts >= 3) throw err;
      await sleep(500 * attempts);
    }
  }
}

async function seedFixtures() {
  // No-op: integration tests create their own data; keep DB empty by default
  return;
}

beforeAll(async () => {
  await seedFixtures();
});
