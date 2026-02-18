# Backend Design & System Flows — MovieShelf

## Architecture Overview
- Layered structure per module (auth, users, movies, reviews, ratings).
- Express.js app with modular routers, middlewares, and a centralized error handler.
- PostgreSQL via Prisma; Zod schemas for request/response validation (middleware).
- Optional Redis for rate-limits and caching computed aggregates.
- Images stored in PostgreSQL (BYTEA); uploaded via multipart, served via /media

## Modules & Responsibilities
- Auth
  - Issue JWT access (short) and refresh (long) tokens.
  - Middleware to protect routes; role-based access for admin-only actions.
- Users
  - Get/update profile; set avatarMediaId and expose avatar URL /media/:id.
  - Upload avatar via multipart (limits + MIME validation).
- Movies
  - CRUD; enforce owner/admin for destructive operations.
  - Surfaces computed fields: averageRating, reviewCount, rank.
  - Upload poster via multipart and link posterMediaId.
- Reviews
  - CRUD with ownership; sanitize/validate content.
  - Hooks to update movie reviewCount.
- Ratings
  - Upsert [user,movie] rating; maintain averageRating transactionally.
 - Media
  - Store image rows in media table and stream by ID with caching headers.

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
  - POST /users/me/avatar (multipart/form-data) → { mediaId, url }
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
  - POST /movies/:id/poster (multipart/form-data) → { mediaId, url }
- Reviews
  - GET /movies/:id/reviews
  - POST /movies/:id/reviews
  - PATCH /reviews/:id
  - DELETE /reviews/:id
- Ratings
  - PUT /movies/:id/rating   → { value: 1..5 }
 - Media
  - GET /media/:id → streams image by ID with proper content-type and cache-control

## Validation & Error Handling
- Zod schemas per route; respond with 400 for validation errors.
- Unified error envelope: { success:false, error:{ code, message, details? } }
- Centralized Express error middleware; map known cases: auth_failed, forbidden, not_found, conflict, validation_error.

## Security
- argon2id for passwords; JWTs in httpOnly cookies (secure in prod).
- helmet for security headers; cors configured to frontend origins.
- RBAC: admin can moderate reviews/movies; users limited to own edits.
- Rate-limits on auth routes; per-IP and per-user ceilings via Redis (express-rate-limit).
 - Multipart upload limits and MIME allowlist (jpeg/png/webp); reject oversized uploads.

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

### 3) Upload Avatar (Direct to DB)
1. Client POST /users/me/avatar with multipart/form-data (file field: image).
2. Server validates auth, MIME, size; stores image in media table (BYTEA).
3. Server returns { mediaId, url: /media/:id } and updates users.avatarMediaId.
4. Client uses returned URL for subsequent image loads.

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
- Dockerfile builds Node service (multi-stage).
- docker-compose: api + postgres in dev; env via .env files.
- Nginx (or API behind reverse proxy) with TLS termination.

## Testing
- Unit tests: services/handlers with mocked Prisma.
- Integration tests: Supertest against Express with a test DB.
- Migrations applied per test suite; seed minimal fixtures.

## Roadmap Notes
- Add search indexing (Meilisearch) if needed.
- Add background workers (BullMQ) for heavy tasks (thumbnailing, recomputes).
