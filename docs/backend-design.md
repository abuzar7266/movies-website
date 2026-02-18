# Backend Design & System Flows — MovieShelf

## Architecture Overview
- Layered structure per module (auth, users, movies, reviews, ratings).
- Fastify server with plugins for routes, auth guards, validation, and error handling.
- PostgreSQL via Prisma; Zod schemas for request/response validation.
- Optional Redis for rate-limits and caching computed aggregates.
- Media stored in S3-compatible storage via pre-signed upload URLs.

## Modules & Responsibilities
- Auth
  - Issue JWT access (short) and refresh (long) tokens.
  - Middleware to protect routes; role-based access for admin-only actions.
- Users
  - Get/update profile; store avatarUrl.
  - Generate pre-signed URL for avatar upload.
- Movies
  - CRUD; enforce owner/admin for destructive operations.
  - Surfaces computed fields: averageRating, reviewCount, rank.
- Reviews
  - CRUD with ownership; sanitize/validate content.
  - Hooks to update movie reviewCount.
- Ratings
  - Upsert [user,movie] rating; maintain averageRating transactionally.

## Data Model (summary)
- User(id, name, email, passwordHash, avatarUrl, role, createdAt)
- Movie(id, title, releaseDate, posterUrl, trailerUrl, synopsis, createdBy, createdAt, rank)
- Review(id, movieId, userId, content, createdAt, updatedAt)
- Rating(id, movieId, userId, value(1..5), createdAt, updatedAt)

## API Endpoints (high-level)
- Auth
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
- Users
  - GET /users/me
  - PATCH /users/me
  - POST /users/me/avatar/presign  → { url, fields } (form-data S3 upload)
- Movies
  - GET /movies?q=&stars=&scope=&sort=&page=&pageSize=
    - q: substring match on title (case-insensitive)
    - stars: minimum rounded average rating (0..5)
    - scope: "all" | "mine" | "not_mine" (requires auth for non-"all")
    - sort: "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc"
  - GET /movies/:id
  - POST /movies
  - PATCH /movies/:id
  - DELETE /movies/:id
- Reviews
  - GET /movies/:id/reviews
  - POST /movies/:id/reviews
  - PATCH /reviews/:id
  - DELETE /reviews/:id
- Ratings
  - PUT /movies/:id/rating   → { value: 1..5 }

## Validation & Error Handling
- Zod schemas per route; respond with 400 for validation errors.
- Unified error envelope: { success:false, error:{ code, message, details? } }
- Map known cases: auth_failed, forbidden, not_found, conflict, validation_error.

## Security
- argon2id for passwords; JWTs in httpOnly cookies (secure in prod).
- RBAC: admin can moderate reviews/movies; users limited to own edits.
- Rate-limits on auth routes; per-IP and per-user ceilings via Redis.
- CORS configured to frontend origins.

## Caching & Aggregation
- Maintain averageRating and reviewCount transactionally:
  - On rating upsert, recompute averageRating for movie within transaction.
  - On review create/delete, increment/decrement reviewCount.
- Optional Redis layer to cache hot lists (e.g., top-rated, recent).

## Pagination & Sorting
- Pagination: page/pageSize with total in response.
- Sorting keys: "top" (avgRating desc), "reviews" (reviewCount desc),
  "latest" (createdAt desc), "rank" (rank asc then createdAt desc).

## System Flows

### 1) Register/Login
1. Client submits credentials.
2. Server validates (Zod), checks uniqueness (register) or credentials (login).
3. On success, set refresh token cookie, return access token in body.
4. Client stores access token in memory; uses it in Authorization header.

### 2) Refresh Token
1. Client requests /auth/refresh with httpOnly refresh cookie.
2. Server verifies refresh token; issues new access token (and optional rotated refresh).
3. Return new access; client replaces in memory.

### 3) Upload Avatar (Pre-signed)
1. Client requests /users/me/avatar/presign (auth required) with filename/contentType.
2. Server creates pre-signed POST/PUT for S3/MinIO and returns it.
3. Client uploads directly to storage using returned fields.
4. Client PATCH /users/me with avatarUrl pointing to uploaded object.

### 4) Add Movie
1. Client POST /movies with metadata; auth required.
2. Server persists movie (createdBy = userId).
3. Enforce unique title (case-insensitive), return 409 conflict on duplicate.
4. Returns movie object.

### 5) List Movies with Filters
1. Client hits GET /movies with q/stars/scope/sort/page.
2. Server builds query with filters; for scope, use current user to filter "mine"/"not_mine".
3. Returns paginated list with averageRating, reviewCount, rank.

### 6) Create Review
1. Client POST /movies/:id/reviews with content.
2. Server validates ownership/auth; creates review.
3. In txn: increment movie.reviewCount.
4. Return new review; optionally trigger cache invalidation for movie list.

### 7) Upsert Rating
1. Client PUT /movies/:id/rating { value }.
2. In txn: insert or update rating; recompute movie.averageRating.
3. Return updated rating + new averageRating.

### 8) Delete Movie (Admin/Owner)
1. Client DELETE /movies/:id.
2. In txn: delete reviews/ratings; then movie.
3. (Optional) clean up media via background job if using owned storage.

## Deployment
- Dockerfile builds Node service.
- docker-compose: api + postgres + minio in dev; env via .env files.
- Nginx (or API behind reverse proxy) with TLS termination.

## Testing
- Unit tests: services/handlers with mocked Prisma.
- Integration tests: Supertest against Fastify with a test DB.
- Migrations applied per test suite; seed minimal fixtures.

## Roadmap Notes
- Add search indexing (Meilisearch) if needed.
- Add background workers (BullMQ) for heavy tasks (thumbnailing, recomputes).
