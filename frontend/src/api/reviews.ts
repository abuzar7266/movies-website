import type { CreateReviewBody, Envelope, Paginated, ReviewDTO, UpdateReviewBody } from "@src/types/api";
import { api } from "@api/client";

export async function listByMovie(movieId: string, page = 1, pageSize = 50): Promise<Envelope<Paginated<ReviewDTO>>> {
  const params = new URLSearchParams({ movieId, page: String(page), pageSize: String(pageSize) });
  return api.get<Envelope<Paginated<ReviewDTO>>>(`/reviews?${params.toString()}`);
}

export async function createReview(body: CreateReviewBody): Promise<Envelope<ReviewDTO>> {
  return api.post<Envelope<ReviewDTO>>("/reviews", body);
}

export async function updateReview(id: string, body: UpdateReviewBody): Promise<Envelope<ReviewDTO>> {
  return api.patch<Envelope<ReviewDTO>>(`/reviews/${id}`, body);
}

export async function deleteReview(id: string): Promise<unknown> {
  return api.delete(`/reviews/${id}`);
}
