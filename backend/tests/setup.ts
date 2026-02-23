import type {} from "./types/generated.d.ts";
import "dotenv/config";

process.env.NODE_ENV = "test";

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

// Avoid domain-bound cookies in tests; let cookies be host-only
delete process.env.COOKIE_DOMAIN;

import { beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const testDbUrl = process.env.DATABASE_URL_TEST || "";
const shouldUseDb = !!testDbUrl && testDbUrl.includes("postgres");
const adapter = shouldUseDb ? new PrismaPg({ connectionString: testDbUrl }) : undefined;
const prisma = shouldUseDb && adapter ? new PrismaClient({ adapter }) : undefined;

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
  beforeAll(async () => {
    await purgeDatabase();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}
