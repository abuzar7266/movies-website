import "dotenv/config";

process.env.NODE_ENV = "test";

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

// Prefer dedicated test database if provided
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

import { beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@generated/prisma/client.js";

const shouldUseDb = !!process.env.DATABASE_URL && process.env.DATABASE_URL.includes("postgres");
const prisma = shouldUseDb ? new PrismaClient() : undefined;

async function purgeDatabase() {
  if (!prisma) return;
  const tables = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const keep = new Set<string>(["_prisma_migrations"]);
  const victims = tables.map((t) => t.tablename).filter((n) => !keep.has(n));
  if (victims.length > 0) {
    const q = `TRUNCATE TABLE ${victims.map((v) => `"public"."${v}"`).join(", ")} RESTART IDENTITY CASCADE;`;
    await prisma.$executeRawUnsafe(q);
  }
}

if (prisma) {
  beforeEach(async () => {
    await purgeDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}
