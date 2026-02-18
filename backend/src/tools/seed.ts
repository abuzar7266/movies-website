import "dotenv/config";
import { prisma } from "../db.js";
import argon2 from "argon2";

async function main() {
  const email = process.env.SEED_USER_EMAIL || "demo@example.com";
  const name = process.env.SEED_USER_NAME || "Demo";
  const pwd = process.env.SEED_USER_PASSWORD || "demo1234";
  const passwordHash = await argon2.hash(pwd);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash }
  });
  console.log(`Seeded user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
