import type { Envelope, RatingAverage, RatingValue, UpsertRatingBody } from "../types/api";
import { api } from "./client";

export async function getMyRating(movieId: string): Promise<Envelope<RatingValue>> {
  return api.get<Envelope<RatingValue>>(`/ratings/${movieId}`, { silentError: true });
}

export async function upsertRating(body: UpsertRatingBody): Promise<Envelope<RatingAverage>> {
  return api.post<Envelope<RatingAverage>>("/ratings", body);
}
