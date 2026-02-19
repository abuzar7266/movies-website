import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MovieDetail from "../../pages/MovieDetail";

const apiMocks = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body?: unknown;
    constructor(message: string, status: number, body?: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  }

  const moviesApi = {
    getMovie: vi.fn(),
    updateMovie: vi.fn(),
    deleteMovie: vi.fn(),
    setPoster: vi.fn(),
  };

  const reviewsApi = {
    listByMovie: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  };

  const ratingsApi = {
    getMyRating: vi.fn(),
    upsertRating: vi.fn(),
  };

  const mediaApi = {
    upload: vi.fn(),
  };

  const apiUrl = (path: string) => path;

  return { ApiError, apiUrl, moviesApi, reviewsApi, ratingsApi, mediaApi };
});

vi.mock("../../api", () => ({
  API_BASE: "http://test",
  ApiError: apiMocks.ApiError,
  apiUrl: apiMocks.apiUrl,
  moviesApi: apiMocks.moviesApi,
  reviewsApi: apiMocks.reviewsApi,
  ratingsApi: apiMocks.ratingsApi,
  mediaApi: apiMocks.mediaApi,
}));

vi.mock("../../hooks/use-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: "u1",
      name: "Test User",
      email: "test@example.com",
      createdAt: "2020-01-01T00:00:00.000Z",
    },
  }),
}));

vi.mock("../../context/MovieContext", () => ({
  useMovies: () => ({
    getMovieById: vi.fn(),
    getReviewsForMovie: vi.fn(),
    getMovieStats: vi.fn(),
    updateMovie: vi.fn(),
    deleteMovie: vi.fn(),
    addReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    upsertRating: vi.fn(),
    getMyRatingForMovie: vi.fn(),
  }),
}));

const renderMovieDetail = async (id = "m1") => {
  render(
    <MemoryRouter initialEntries={[`/movie/${id}`]}>
      <Routes>
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
    </MemoryRouter>,
  );

  await screen.findByRole("heading", { name: /test movie/i });
};

beforeEach(() => {
  vi.clearAllMocks();

  apiMocks.moviesApi.getMovie.mockResolvedValue({
    success: true,
    data: {
      id: "m1",
      title: "Test Movie",
      releaseDate: "2020-01-01",
      posterUrl: "",
      trailerUrl: "",
      synopsis: "Synopsis",
      createdBy: "u2",
      createdAt: "2020-01-02T00:00:00.000Z",
    },
  });

  apiMocks.reviewsApi.listByMovie.mockResolvedValue({
    success: true,
    data: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
    },
  });

  apiMocks.ratingsApi.getMyRating.mockResolvedValue({
    success: true,
    data: { value: null },
  });
});

afterEach(() => {
  cleanup();
});

describe("MovieDetail reviews", () => {
  it("shows 'Write a Review' when user has not reviewed yet", async () => {
    await renderMovieDetail();

    const user = userEvent.setup();
    const startButton = screen.getByRole("button", { name: /write a review/i });
    await user.click(startButton);

    expect(await screen.findByRole("button", { name: /post review/i })).toBeInTheDocument();
  });

  it("hides 'Write a Review' when user already has a review", async () => {
    apiMocks.reviewsApi.listByMovie.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: "r1",
            movieId: "m1",
            userId: "u1",
            rating: 5,
            content: "Great",
            createdAt: "2020-01-03T00:00:00.000Z",
            updatedAt: "2020-01-03T00:00:00.000Z",
            user: { id: "u1", name: "Test User", avatarUrl: "" },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
      },
    });

    await renderMovieDetail();

    expect(screen.queryByRole("button", { name: /write a review/i })).not.toBeInTheDocument();
  });

  it("shows loader on delete confirmation button while deleting", async () => {
    apiMocks.reviewsApi.listByMovie.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: "r1",
            movieId: "m1",
            userId: "u1",
            rating: 5,
            content: "Great",
            createdAt: "2020-01-03T00:00:00.000Z",
            updatedAt: "2020-01-03T00:00:00.000Z",
            user: { id: "u1", name: "Test User", avatarUrl: "" },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
      },
    });

    let resolveDelete: (() => void) | undefined;
    apiMocks.reviewsApi.deleteReview.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
    });

    await renderMovieDetail();

    const user = userEvent.setup();
    await user.click(await screen.findByLabelText(/delete review/i));

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
      expect(confirmButton).toHaveTextContent(/deleting/i);
    });

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolveDelete?.();
    await waitFor(() => {
      expect(apiMocks.reviewsApi.deleteReview).toHaveBeenCalledWith("r1");
    });
  });
});
