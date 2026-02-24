import type {} from "./types/generated.d.ts";
import "dotenv/config";

process.env.NODE_ENV = "test";

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";

// Avoid domain-bound cookies in tests; let cookies be host-only
delete process.env.COOKIE_DOMAIN;

import { beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const testDbUrl = process.env.DATABASE_URL_TEST || "";
const shouldUseDb = !!testDbUrl && testDbUrl.includes("postgres");
const adapter = shouldUseDb ? new PrismaPg({ connectionString: testDbUrl }) : undefined;
const prisma = shouldUseDb && adapter ? new PrismaClient({ adapter }) : undefined;

function isSafeTestDbUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();
    const db = (u.pathname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || db.includes("test");
  } catch {
    return false;
  }
}

async function purgeDatabase() {
  if (!prisma) return;
  if (!isSafeTestDbUrl(testDbUrl)) return;
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const keep = new Set<string>(["_prisma_migrations"]);
  const victims = tables.map((t) => t.tablename).filter((n) => !keep.has(n));
  if (victims.length > 0) {
    const q = `TRUNCATE TABLE ${victims.map((v) => `"public"."${v}"`).join(", ")} RESTART IDENTITY CASCADE;`;
    await prisma.$executeRawUnsafe(q);
  }
}

async function seedFixtures() {
  if (!prisma) return;
  const pwd = await argon2.hash("testpass123");
  const up = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: { name: "Test User", email: "user@example.com", passwordHash: pwd, role: "user" }
  });
  const userId = up.id;
  const movie = await prisma.movie.create({
    data: {
      title: "Fixture Movie",
      releaseDate: new Date("2020-01-01T00:00:00.000Z"),
      createdBy: userId!,
      synopsis: "Seeded movie for tests",
      posterUrl: "",
      trailerUrl: "",
      averageRating: 0,
      reviewCount: 0,
      ratingCount: 0,
      rank: 0
    }
  }).catch(async () => {
    return prisma.movie.findFirst({ where: { title: "Fixture Movie" } }) as any;
  });
  if (movie && (await prisma.review.count({ where: { movieId: movie.id } })) === 0) {
    await prisma.review.create({
      data: { movieId: movie.id, userId: userId!, content: "Great!" }
    });
  }
}

if (prisma) {
  beforeAll(async () => {
    await purgeDatabase();
    await seedFixtures();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}
