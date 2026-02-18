# Backend Plan — MovieShelf

## Scope
- Build a production-ready backend for MovieShelf to power auth, movies, reviews, ratings, and media uploads.
- Provide consistent REST APIs, secure auth, data integrity, and observability.

## Tech Stack
- Runtime: Node.js 20, TypeScript
- Framework: Express.js with modular routers and middlewares
- ORM: Prisma (PostgreSQL)
- Validation: Zod (via lightweight middleware)
- Auth: JWT (access + refresh), argon2 password hashing
- Security middlewares: helmet, cors, cookie-parser
- Rate limiting: express-rate-limit (with Redis store in prod)
- Caching/Queues (optional, Phase 3+): Redis (caching aggregates/queues)
- Image storage: PostgreSQL BYTEA (DB-backed media) for avatars/posters
- Uploads: multer/busboy (multipart/form-data) with strict limits
- Tooling: pnpm or npm, ESLint, Prettier
- Testing: Supertest + Vitest (or Jest) for API, Prisma test DB with migrations
- Container: Dockerfile + docker-compose (multi-service)

## Core Services (aligned with frontend flows)
- Auth: register, login, refresh, logout, protected routes middleware
- Users: profile fetch/update, avatar upload (direct multipart to DB)
- Movies: CRUD, searchable listing, computed fields (averageRating, reviewCount, rank); unique title constraint
- Reviews: CRUD, user-scoped limits, update movie aggregates
- Ratings: rating upsert by user; feeds into averageRating
- Search & Filters: by title, minStars, sortBy (reviews, rating, createdAt, rank)

## Data Model (baseline)
- User: id, name, email (unique), passwordHash, avatarUrl, createdAt, role
- Movie: id, title, releaseDate, posterUrl, trailerUrl, synopsis, createdBy, createdAt, rank
- Review: id, movieId, userId, content, createdAt, updatedAt
- Rating: id, movieId, userId, value (1..5), createdAt, updatedAt
- Aggregates (computed/materialized): averageRating, reviewCount (derived from ratings/reviews)

## API Style
- REST JSON API with standard CRUD endpoints
- JSON envelope: { success: boolean, data?: T, error?: { code, message, details? } }
- Consistent pagination: page, pageSize, total
- Validation with Zod schemas per route

## Query Parameters (match frontend)
- q: search by movie title substring (case-insensitive)
- stars: minimum rounded average rating (0..5). 0 = no filter
- scope: review scope relative to current user: "all" | "mine" | "not_mine"
- sort: "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc"

## Environments
- Dev: Docker Compose (Postgres, API), hot reload
- Test: Isolated Postgres instance, migrations applied per test run
- Prod: Containerized API + managed Postgres (or self-hosted), observability

## Security & Compliance
- Password hashing with argon2id
- JWT access (short-lived) + refresh (long-lived) cookies (httpOnly, secure in prod)
- RBAC baseline: roles = ["user","admin"] for admin actions (delete movie, etc.)
- Input validation everywhere; request size limits for uploads
- Rate-limiting on auth endpoints; IP-based + user-based throttles (Redis backend)
- CORS: restrict to app origin(s)

## Observability
- Logging: Pino (structured logs), request/response minimal logging (no PII)
- Metrics: Prometheus-compatible endpoint (Phase 3+)
- Error tracking: optional Sentry integration

## Migrations & Seeding
- Prisma migrations in repo
- Seed script for sample users/movies; titles unique to mirror frontend behavior

## Milestones
1) Foundations
   - Project scaffolding, Express setup, Prisma + Postgres, env management
   - Healthcheck, logging, error handler, Zod validation plumbing
2) Auth & Users
   - Register/Login/Refresh/Logout, profile fetch/update
   - Avatar upload via direct multipart (DB-backed); link avatarMediaId to user and expose URL /media/:id
3) Movies & Reviews
   - Movies CRUD with unique title constraint; listing with filters/sort (q, stars, scope, sort)
   - Reviews CRUD with ownership checks, movie aggregates maintained
   - Poster upload via direct multipart (DB-backed); link posterMediaId to movie
4) Ratings & Aggregations
   - Rating upsert, averageRating computed (transactional)
   - Cached aggregates for listing; background recompute job (optional)
5) Hardening & Ops
   - Rate-limits, CORS, security headers via helmet, audit logging
   - CI pipeline, test coverage, docker-compose prod profile

## Dev & Run
- Dev: docker compose up (db) then pnpm dev (ts-node-dev/nodemon)
- Test: pnpm test (spins test db, runs migrations), API tests via Supertest
- Build: pnpm build && docker build

## Media Storage in DB
- Schema:
  - media(id UUID, contentType TEXT, size INT, data BYTEA, createdAt TIMESTAMPTZ, ownerUserId UUID NULL)
  - users.avatarMediaId UUID NULL → references media(id)
  - movies.posterMediaId UUID NULL → references media(id)
- Limits:
  - Avatars: ≤2MB, types: image/jpeg, image/png, image/webp
  - Posters: ≤5MB, types: image/jpeg, image/png, image/webp
- Upload:
  - Multipart endpoints validate MIME/size; store as BYTEA with contentType and size
  - Return { id, url: /media/:id }
- Delivery:
  - GET /media/:id streams from DB with content-type, cache-control: public, max-age=31536000, immutable
  - ETag via content hash; support conditional GET (If-None-Match)
  - Optional simple thumbnails (Phase 2) stored as separate media rows

## Future Extensions
- Full-text search (PG trigram/tsvector or Meilisearch)
- Social features: likes, follow users
- Admin dashboards and moderation queues
