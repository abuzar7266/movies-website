import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/prisma/client.js";
import { config } from "@config/index.js";

const connectionString = config.isTest ? (config.testDatabaseUrl || "") : (config.databaseUrl || "");
if (!connectionString) {
  throw new Error("Database connection URL is not set. Configure DATABASE_URL (or DATABASE_URL_TEST for tests).");
}
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
