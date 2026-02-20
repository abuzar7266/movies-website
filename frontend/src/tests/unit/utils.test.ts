import { describe, it, expect, beforeEach } from "vitest";
import { loadJSON, saveJSON, toEmbedUrl } from "@lib/utils";

// minimal localStorage mock
const createStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
};

describe("storage utils", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorage(),
    });
  });
  it("returns fallback when key is missing", () => {
    const result = loadJSON("missing", { a: 1 });
    expect(result).toEqual({ a: 1 });
  });
  it("roundtrips JSON values safely", () => {
    saveJSON("k", { x: 42 });
    expect(loadJSON("k", null)).toEqual({ x: 42 });
  });
});

describe("toEmbedUrl", () => {
  it("converts youtube watch to embed", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
  });
  it("converts youtu.be to embed", () => {
    expect(toEmbedUrl("https://youtu.be/xyz789")).toBe("https://www.youtube.com/embed/xyz789");
  });
  it("converts vimeo to embed", () => {
    expect(toEmbedUrl("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
  });
  it("passes through unknown hosts", () => {
    expect(toEmbedUrl("https://example.com/video")).toBe("https://example.com/video");
  });
})
