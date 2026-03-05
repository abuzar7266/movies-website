# Interview One-Pager: MovieShelf

## System Overview
- Backend: Express REST API (TypeScript), Prisma + Postgres, Redis cache/limiter
- Security: JWT cookies (access+refresh), CSRF protection, Helmet, CORS allowlist
- Observability: /healthz, Prometheus /metrics, OpenAPI (/openapi.json, /docs), pino logs with requestId
- Frontend: React/Vite served by Nginx
- Deployment: Dockerfiles + Docker Compose (Postgres, Redis, backend, frontend), Prisma migrations at boot

## Rank Recompute
- Strategy: bounded top‑N recompute; queue to avoid overlapping runs
- Triggers: server start; create/delete movie; create/delete review; rating upserts; poster changes
- Ordering: reviewCount desc → averageRating desc → createdAt desc → id asc
- Fallback: on-demand rank for items with rank=0 to keep responses fast

## Database Scalability
- Indexes: targeted (movies: createdAt; composite reviewCount+averageRating+createdAt; reviews: movieId+createdAt; ratings: userId+movieId)
- Denormalized counters: reviewCount, ratingCount, averageRating for faster sorting/filtering
- Transactions: list+count, write ops run in Prisma transactions; stable pagination/order
- Replication: single Postgres instance today; replicas are a documented future option

## Caching
- Server-side response caching in Redis with ETag and Cache-Control; 304 support
- Versioned keys: bumpCacheVersion/getCacheVersion for precise invalidation on writes
- TTLs: details 30s; lists 10s; reviews 10s; Vary: Cookie to isolate per-user views
- Media caching: SHA1 ETag for binary content; conditional GET support

## Security
- Auth: JWT cookies; refresh flow; test-mode fallbacks for CI
- CSRF: cookie+header validation for unsafe methods; safe paths exempted
- Rate limiting: express-rate-limit or Redis-backed limiter by IP
- Validation: Zod on all inputs; centralized error envelopes
- Headers: Helmet; CORS allowlist; secret management via env/vault

## Testing & QA
- Vitest unit + integration; coverage artifacts in CI
- Contract tests: OpenAPI responses and envelopes; CSRF/rate limit checks
- Observability checks: /metrics, /healthz; logs redact sensitive headers

## Two-Minute Pitch
- MovieShelf is an Express + Postgres system optimized for read-heavy traffic. We denormalize rating/review counters and maintain a bounded rank to sort popular items quickly.
- Caching combines Redis with ETag and versioned keys, so hot lists and details return fast while writes invalidate consistently.
- Security covers JWT cookies, CSRF, rate limiting, and strict input validation, with Helmet/CORS at the edge.
- Operability includes health endpoints, Prometheus metrics, OpenAPI docs, and structured logs with request IDs.
- Deployment is containerized: Postgres, Redis, backend, and frontend via Compose, with Prisma migrations executed at boot for reliable startup.
