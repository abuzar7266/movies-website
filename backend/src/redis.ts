import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!client) {
    client = createClient({ url });
    client.on("error", () => {});
  }
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export async function getCacheVersion(key: string): Promise<string> {
  try {
    const c = await getRedisClient();
    if (!c) return "1";
    return (await c.get(key)) ?? "1";
  } catch {
    return "1";
  }
}

export async function bumpCacheVersion(key: string): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    await c.incr(key);
  } catch {}
}
