import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function toEmbedUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com")) {
      const vid = parsed.searchParams.get("v");
      return vid ? `https://www.youtube.com/embed/${vid}` : u.replace("/watch", "/embed");
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : u;
    }
    if (host.includes("vimeo.com") && !host.includes("player")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : u;
    }
    return u;
  } catch {
    return u;
  }
}
