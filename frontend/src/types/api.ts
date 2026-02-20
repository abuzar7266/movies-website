export interface Envelope<T> {
  success: true;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginBody {
  email: string;
  password: string;
}
export interface RegisterBody extends LoginBody {
  name: string;
}

export interface MovieDTO {
  id: string;
  title: string;
  releaseDate: string;
  posterMediaId?: string | null;
  posterUrl?: string | null;
  trailerUrl: string;
  synopsis: string;
  createdBy: string;
  createdAt: string;
  averageRating: number;
  reviewCount: number;
  rank?: number;
  myRating?: number | null;
}

export interface CreateMovieBody {
  title: string;
  releaseDate: string;
  synopsis: string;
  trailerUrl?: string;
}
export interface UpdateMovieBody {
  title?: string;
  releaseDate?: string;
  synopsis?: string;
  trailerUrl?: string;
}

export interface ReviewDTO {
  id: string;
  movieId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarMediaId?: string | null;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateReviewBody {
  movieId: string;
  content: string;
}
export interface UpdateReviewBody {
  content: string;
}

export interface UpsertRatingBody {
  movieId: string;
  value: number;
}
export interface RatingValue {
  value: number | null;
}
export interface RatingAverage {
  averageRating: number;
}

export interface UploadMediaResponse {
  id: string;
  contentType: string;
  size: number;
  createdAt: string;
  url: string;
}
