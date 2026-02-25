import "dotenv/config";
import { defineConfig } from "prisma/config";
import process from "node:process";

const url = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db";

export default defineConfig({
  datasource: {
    url
  }
});
