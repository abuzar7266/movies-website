-- Movie indexes to support sorting/filtering
CREATE INDEX "Movie_createdAt_idx" ON "Movie"("createdAt");
CREATE INDEX "Movie_reviewCount_averageRating_createdAt_idx" ON "Movie"("reviewCount","averageRating","createdAt");

-- Review composite index to accelerate per-movie pagination by createdAt
CREATE INDEX "Review_movieId_createdAt_idx" ON "Review"("movieId","createdAt");

-- Rating index to speed lookups by user across many movies
CREATE INDEX "Rating_userId_movieId_idx" ON "Rating"("userId","movieId");

