import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "@pages/index/Index";

const apiMocks = vi.hoisted(() => {
  const moviesApi = {
    listMovies: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 12,
      },
    }),
  };
  return { moviesApi };
});

vi.mock("@api", () => ({
  API_BASE: "http://test",
  moviesApi: apiMocks.moviesApi,
  apiUrl: (p: string) => p,
}));

vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

describe("Index auth requirement for add form", () => {
  it("shows login dialog when add=true and user is unauthenticated", async () => {
    render(
      <MemoryRouter initialEntries={["/?add=true"]}>
        <Index />
      </MemoryRouter>
    );

    expect(await screen.findByText(/please log in to add a new movie/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to login/i })).toBeInTheDocument();
  });
});

