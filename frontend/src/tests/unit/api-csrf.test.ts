import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@lib/api";

describe("api client CSRF", () => {
  const g = globalThis as typeof globalThis & { fetch: typeof fetch; document: Document };
  const originalFetch = g.fetch;
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    g.fetch = originalFetch;
    if (originalCookie) {
      Object.defineProperty(Document.prototype, "cookie", originalCookie);
    }
  });

  it("attaches X-CSRF-Token when cookie exists", async () => {
    Object.defineProperty(Document.prototype, "cookie", {
      configurable: true,
      get: () => "csrf_token=abc123",
      set: () => true,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
      headers: new Headers(),
    });
    g.fetch = fetchMock as unknown as typeof fetch;

    await api.post<{ ok: true }>("/any", { hello: "world" }, { silentError: true });

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers | undefined;
    expect(headers?.get("X-CSRF-Token")).toBe("abc123");
  });

  it("fetches /auth/csrf to obtain token when missing", async () => {
    Object.defineProperty(Document.prototype, "cookie", {
      configurable: true,
      get: () => "",
      set: () => true,
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({})),
        headers: new Headers({ "set-cookie": "csrf_token=xyz789; Path=/;" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
        headers: new Headers(),
      });
    g.fetch = fetchMock as unknown as typeof fetch;

    await api.post<{ ok: true }>("/protected", { a: 1 }, { silentError: true });

    // First call should be to /auth/csrf
    expect((fetchMock.mock.calls[0]?.[0] as string) || "").toContain("/auth/csrf");
  });
});

