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
  const g: any = globalThis;
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
    const res = await api.get<{ success: true }>("/ok", { silentError: true } as any);
    expect(res).toEqual({ success: true });
    expect((mockedToast.error as any)).not.toHaveBeenCalled();
  });

  it("shows toast on 5xx unless silent", async () => {
    g.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Boom" } })),
      headers: new Headers(),
    });
    await expect(api.get("/err" as any)).rejects.toThrow();
    expect((mockedToast.error as any)).toHaveBeenCalled();
  });

  it("suppresses toast when silentError is true", async () => {
    g.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("{\"error\":{\"message\":\"Boom\"}}"),
      headers: new Headers(),
    });
    await expect(api.get("/err" as any, { silentError: true } as any)).rejects.toThrow();
    expect((mockedToast.error as any)).not.toHaveBeenCalled();
  });

  it("shows toast on network error", async () => {
    g.fetch = vi.fn().mockRejectedValue(new TypeError("Network failed"));
    await expect(api.get("/net" as any)).rejects.toThrow();
    expect((mockedToast.error as any)).toHaveBeenCalled();
  });
});
