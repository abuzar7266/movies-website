import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./api";

vi.mock("../hooks/use-toast", () => {
  return {
    toast: {
      error: vi.fn(),
    },
  };
});
import { toast as mockedToast } from "../hooks/use-toast";

describe("api client", () => {
  const g = globalThis as typeof globalThis & { fetch: typeof fetch };
  const originalFetch = g.fetch;
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });
  afterEach(() => {
    g.fetch = originalFetch;
  });

  it("returns JSON on success", async () => {
    g.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true })),
      headers: new Headers(),
    });
    const res = await api.get<{ success: true }>("/ok", { silentError: true });
    expect(res).toEqual({ success: true });
    expect(mockedToast.error as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("shows toast on 5xx unless silent", async () => {
    g.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Boom" } })),
      headers: new Headers(),
    });
    await expect(api.get("/err")).rejects.toThrow();
    expect(mockedToast.error as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it("suppresses toast when silentError is true", async () => {
    g.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("{\"error\":{\"message\":\"Boom\"}}"),
      headers: new Headers(),
    });
    await expect(api.get("/err", { silentError: true })).rejects.toThrow();
    expect(mockedToast.error as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("shows toast on network error", async () => {
    g.fetch = vi.fn().mockRejectedValue(new TypeError("Network failed"));
    await expect(api.get("/net")).rejects.toThrow();
    expect(mockedToast.error as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });
});
