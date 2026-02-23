import type { Agent } from "supertest";
import request from "supertest";
import app from "../../src/app.js";

export function makeAgent(): Agent {
  return request.agent(app);
}

export function randomId(prefix = "t"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function registerOrLogin(agent: Agent, opts?: { email?: string; password?: string; name?: string }) {
  const email = opts?.email ?? `${randomId("user")}@example.com`;
  const password = opts?.password ?? "pass12345";
  const name = opts?.name ?? "Test User";
  let res = await agent.post("/auth/register").send({ name, email, password });
  if (res.status === 409) {
    res = await agent.post("/auth/login").send({ email, password });
  }
  if (res.status !== 200) {
    throw new Error(`Auth failed with status ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return { email, password, name };
}

async function getCsrfToken(agent: Agent): Promise<string> {
  const res = await agent.get("/auth/csrf");
  if (res.status !== 200) throw new Error(`CSRF fetch failed: ${res.status}`);
  const cookie = res.headers["set-cookie"]?.find((c: string) => c.startsWith("csrf_token=")) ?? "";
  const match = /csrf_token=([^;]+)/.exec(cookie);
  if (!match) throw new Error("No csrf_token cookie set");
  return decodeURIComponent(match[1]);
}

export async function post(agent: Agent, url: string, body: any) {
  const token = await getCsrfToken(agent);
  return agent.post(url).set("X-CSRF-Token", token).send(body);
}

export async function put(agent: Agent, url: string, body: any) {
  const token = await getCsrfToken(agent);
  return agent.put(url).set("X-CSRF-Token", token).send(body);
}

export async function del(agent: Agent, url: string) {
  const token = await getCsrfToken(agent);
  return agent.delete(url).set("X-CSRF-Token", token);
}

export async function createMovie(agent: Agent, overrides?: Partial<{ title: string; releaseDate: string; trailerUrl: string; synopsis: string }>) {
  const title = overrides?.title ?? `Movie ${randomId()}`;
  const payload = {
    title,
    releaseDate: overrides?.releaseDate ?? new Date().toISOString(),
    trailerUrl: overrides?.trailerUrl ?? "https://example.com/trailer.mp4",
    synopsis: overrides?.synopsis ?? "Test movie"
  };
  const res = await post(agent, "/movies", payload);
  if (res.status !== 200) {
    throw new Error(`Create movie failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { id: res.body.data.id, title };
}

export async function addReview(agent: Agent, movieId: string, content?: string) {
  const res = await post(agent, "/reviews", { movieId, content: content ?? `Review ${randomId()}` });
  if (res.status !== 200) throw new Error(`Add review failed: ${res.status}`);
  return res.body.data;
}

export async function rateMovie(agent: Agent, movieId: string, value = 4) {
  const res = await post(agent, "/ratings", { movieId, value });
  if (res.status !== 200) throw new Error(`Rate movie failed: ${res.status}`);
  return res.body.data;
}
