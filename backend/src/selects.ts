export const movieSelect = {
  id: true,
  title: true,
  releaseDate: true,
  synopsis: true,
  createdAt: true,
  averageRating: true,
  reviewCount: true,
  rank: true,
  posterMediaId: true,
  posterUrl: true,
  createdBy: true
} as const;

export const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarMediaId: true
} as const;

export const reviewSelect = {
  id: true,
  movieId: true,
  userId: true,
  content: true,
  createdAt: true,
  updatedAt: true
} as const;
