import "dotenv/config";
import { prisma } from "@/db.js";

async function main() {
  const rows = await prisma.$queryRaw<
    { table_name: string }[]
  >`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
