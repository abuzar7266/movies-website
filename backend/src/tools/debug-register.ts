import "dotenv/config";
import app from "@/app.js";
import request from "supertest";
import { prisma } from "@/db.js";

async function main() {
  try {
    await prisma.$connect();
    const agent = request.agent(app);
    const email = `debug+${Date.now()}@example.com`;
    const res = await agent.post("/auth/register").send({ name: "Debug", email, password: "pass12345" });
    console.log("status:", res.status);
    console.log("body:", JSON.stringify(res.body || null));
  } catch (e) {
    console.error(e);
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
}

main();
