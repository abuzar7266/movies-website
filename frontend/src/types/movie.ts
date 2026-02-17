export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  releaseDate: string;
  posterUrl: string;
  trailerUrl: string;
  synopsis: string;
  createdBy: string;
  createdAt: string;
}

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovieWithStats extends Movie {
  reviewCount: number;
  averageRating: number;
  rank: number;
}
