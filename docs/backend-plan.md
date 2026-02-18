# Backend Plan — MovieShelf (Revised)

## Scope
- Build a production-ready backend for MovieShelf to power auth, movies, reviews, ratings, and media uploads.
- Provide consistent REST APIs, secure auth, data integrity, and observability.

## Tech Stack
- Runtime: Node.js 20, TypeScript
- Framework: Fastify (lightweight, high-performance) with modular routes/plugins
- ORM: Prisma (PostgreSQL)
- Validation: Zod
- Auth: JWT (access + refresh), argon2 password hashing
- Caching/Queues (optional, Phase 3+): Redis (rate-limiting, caching computed stats)
- Storage: S3-compatible (MinIO in dev, S3 in prod) for avatars/posters
- Tooling: pnpm or npm, ESLint, Prettier
- Testing: Vitest + Supertest for API, Prisma test DB with migrations
- Container: Dockerfile + docker-compose (multi-service)

## Core Services (aligned with frontend flows)
- Auth: register, login, refresh, logout, protected routes middleware
- Users: profile fetch/update, avatar upload (pre-signed URLs)
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
- Dev: Docker Compose (Postgres, MinIO, API), hot reload
- Test: Isolated Postgres instance, migrations applied per test run
- Prod: Containerized API + managed Postgres (or self-hosted), S3 storage, observability

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
   - Project scaffolding, Fastify setup, Prisma + Postgres, env management
   - Healthcheck, logging, error handler, Zod validation plumbing
2) Auth & Users
   - Register/Login/Refresh/Logout, profile fetch/update
   - Avatar upload via pre-signed URLs (preferred) or direct multipart limited upload; link stored URL to user
3) Movies & Reviews
   - Movies CRUD with unique title constraint; listing with filters/sort (q, stars, scope, sort)
   - Reviews CRUD with ownership checks, movie aggregates maintained
4) Ratings & Aggregations
   - Rating upsert, averageRating computed (transactional)
   - Cached aggregates for listing; background recompute job (optional)
5) Hardening & Ops
   - Rate-limits, CORS, security headers, audit logging
   - CI pipeline, test coverage, docker-compose prod profile

## Dev & Run
- Dev: docker compose up (db + storage) then pnpm dev
- Test: pnpm test (spins test db, runs migrations), API tests via Supertest
- Build: pnpm build && docker build

## Future Extensions
- Full-text search (PG trigram/tsvector or Meilisearch)
- Social features: likes, follow users
- Admin dashboards and moderation queues
