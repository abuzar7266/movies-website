# MovieShelf: End-to-End System Design

Use this as a concrete, project-specific example to discuss during interviews. It follows the system-design-template and highlights pragmatic trade-offs.

## 1) Requirements and Scope

- Functional
  - Browse and search movies and TV shows
  - Movie details: cast, crew, genres, runtime, release dates, posters
  - User accounts, authentication, profiles
  - Watchlist and custom lists; mark watched; ratings and reviews
  - Recommendations: similar titles, trending, personalized suggestions
  - Admin/import: periodic sync from third-party (e.g., TMDB)
- Non-functional
  - Read-heavy traffic; fast search; low latency detail pages
  - High availability for reads; eventual consistency acceptable for lists
  - Cost-aware architecture; horizontal scalability; observability and security

## 2) Estimations (Example)

- Daily Active Users: 200k; peak concurrent: ~10k
- Reads: ~50M/day (search + details + lists) → ~580 QPS avg; peaks 5–10x
- Writes: ~2M/day (watchlist updates, ratings, reviews) → ~23 QPS avg; peaks 3–5x
- Storage: ~5M titles; ~2KB metadata/title avg → ~10 GB core metadata
  - Plus indexes (20%) and replicas; images served via CDN/external provider

## 3) API Design (REST)

- Public REST (examples)
  - GET /v1/movies?genre=&year=&cursor= — paginated browse
  - GET /v1/movies/{id} — details (with related entities)
  - GET /v1/search?q=&type=movie|person — search suggestions/results
  - GET /v1/users/{id}/watchlist — cursor-based pagination
  - POST /v1/users/{id}/watchlist — add/remove (idempotent via item IDs)
  - POST /v1/movies/{id}/ratings — upsert user rating
  - POST /v1/movies/{id}/reviews — create review (moderation queue)
- Internal APIs
  - POST /admin/import/run — trigger or schedule ingest
  - Optional future: internal recommendation service over HTTP; today served via API using cached computations

## 4) Data Modeling (Relational + Search + Cache)

- Relational (Postgres)
  - movies(id, title, year, runtime, metadata_json, created_at, updated_at)
  - people(id, name, bio, born_at, created_at)
  - cast(movie_id, person_id, role, order)
  - genres(id, name); movie_genres(movie_id, genre_id)
  - users(id, email, hashed_password, created_at, tenant_id)
  - watchlist_items(id, user_id, movie_id, added_at, status)
  - ratings(user_id, movie_id, rating, updated_at)
  - reviews(id, user_id, movie_id, title, body, status, created_at)
- Search (Elasticsearch/OpenSearch)
  - Index: movies (title, alt_titles, genres, cast names, popularity)
  - Autocomplete via edge n-grams; synonyms for common terms
- Cache (Redis)
  - Hot movie details, watchlist cursors, recommendation results
  - Request coalescing keys to avoid stampedes

## 5) High-Level Architecture

ASCII C4-like view:
```
[Web/Mobile] --HTTPS--> [Edge/CDN] --HTTPS--> [API Gateway]
API Gateway --HTTPS--> [MovieShelf API (Express, REST)]
MovieShelf API --SQL--> [Postgres Primary]
MovieShelf API --Cache--> [Redis] (cache + optional rate limiting)
MovieShelf API --S3--> [Object Storage/CDN] (media)
Admin Importer --HTTP--> [Third-Party Provider (TMDB)] -> [Ingest Pipeline]
Observability: [/healthz][/metrics][OpenAPI /docs][Structured Logs]
Security: [JWT Cookies][CSRF Tokens][Helmet][Rate Limiting]
```

## 6) Data Flows

- Read Path
  - Browse/details: API checks Redis cache → fallback to Postgres
  - Suggestions: API performs lightweight title search (prefix match) and ranking
  - Recommendations: computed within API or batch jobs; cached per user/title
- Write Path
  - Watchlist/ratings/reviews: validate → write to Postgres (transaction) → emit event
  - Events consumed by stream processors to update denormalized views and caches
- Import/Ingest
  - Scheduled jobs pull deltas from third-party; apply expand/contract migrations when needed
  - Update Postgres and reindex search; image URLs point to CDN/external provider

## 7) Scaling Plan

- Reads
  - Redis cache for hot titles and lists; compute TTLs based on popularity
  - Read replicas for Postgres; mostly read-after-write consistent within seconds
  - Search scaled horizontally via shard/replica tuning; cache popular queries
- Writes
  - Idempotent upserts for ratings; dedupe watchlist items by (user_id, movie_id)
  - Cache versioning keys in Redis to invalidate hot views
  - Optional future: queue/backpressure for bulk updates
- Hotspots
  - Trending titles: pre-warm caches; use CDN edge caching for static assets
  - Search: throttle noisy queries; apply per-IP/user rate limits

## 8) Reliability and Resilience

- Timeouts and retries with jitter on external calls (TMDB, S3)
- Bulkheads: isolated connection pools per dependency (DB, Redis, S3)
- Graceful degradation: serve cached details; disable noncritical features
- Cache rehydration via versioning; ingest anomalies logged and retried

## 9) Security and Privacy

- AuthN: JWT cookies (access+refresh); CSRF tokens for state-changing requests
- AuthZ: role-based (admin/user); scoped resource access
- PII minimization; secure logs; TLS; secret vault/env management
- Abuse protection: express-rate-limit or Redis-backed limiter; input validation

## 10) Observability and Operations

- Metrics: RED on endpoints via Prometheus (/metrics); cache hit rate; DB latencies
- Structured logs with correlation IDs (pino); audit sensitive operations
- OpenAPI at /openapi.json and /docs; health at /healthz
- CI/CD: prisma migrations, build, tests (vitest), canary/blue-green optional
- Runbooks: ingest failures, DB restart/migrate, rate limit tuning

## 11) Schema Evolution and Migration

- Expand/contract migrations (Prisma); backward compatible API payloads
- Data backfills via scripts/jobs; guardrails on long migrations

## 12) Cost Awareness

- Cache hot reads to reduce DB/query costs; tune cache TTLs/versioning
- Postgres sizing for traffic; autoscaling containers with cooldowns
- Monitor egress from images/CDN; consider image proxy caching if needed

## 13) Trade-offs

- External search adds complexity; current simple suggest keeps ops minimal
- Read-after-write expectations documented; consistent within single node
- Personalized recommendations computed asynchronously and cached

## 14) Evolution Plan

- Phase 1: core browse/details/search; watchlist basics; nightly ingest
- Phase 2: ratings/reviews with moderation; real-time ingest deltas
- Phase 3: personalized recommendations; A/B testing; multi-region read replicas
- Phase 4: offline support on mobile; advanced analytics dashboards
