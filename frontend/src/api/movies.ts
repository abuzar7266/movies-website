import type { CreateMovieBody, Envelope, MovieDTO, Paginated, UpdateMovieBody } from "../types/api";
import { api } from "./client";

export async function listMovies(params: URLSearchParams): Promise<Envelope<Paginated<MovieDTO>>> {
  return api.get<Envelope<Paginated<MovieDTO>>>(`/movies?${params.toString()}`);
}

export async function getMovie(id: string): Promise<Envelope<MovieDTO>> {
  return api.get<Envelope<MovieDTO>>(`/movies/${id}`);
}

export async function createMovie(body: CreateMovieBody & { posterUrl?: string }): Promise<Envelope<MovieDTO>> {
  return api.post<Envelope<MovieDTO>>("/movies", body);
}

export async function updateMovie(id: string, body: UpdateMovieBody & { posterUrl?: string }): Promise<unknown> {
  return api.patch(`/movies/${id}`, body);
}

export async function deleteMovie(id: string): Promise<unknown> {
  return api.delete(`/movies/${id}`);
}

export async function setPoster(id: string, mediaId: string): Promise<unknown> {
  return api.patch(`/movies/${id}/poster`, { mediaId });
}
