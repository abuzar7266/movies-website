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

## 3) API Design (REST/gRPC)

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
  - gRPC between API and recommendation service for low-latency scoring

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
API Gateway --HTTPS--> [MovieShelf API] --gRPC--> [Recommendation Service]
MovieShelf API --SQL--> [Postgres Primary] <replicates> [Read Replicas]
MovieShelf API --Cache--> [Redis]
MovieShelf API --HTTP--> [Search Service (Elastic)]
Admin Importer --HTTP--> [Third-Party Provider (TMDB)] -> [Ingest Pipeline]
Ingest Pipeline --> [Postgres] & [Search Index] & [Image CDN references]
Observability: [Tracing][Metrics][Logs]
```

## 6) Data Flows

- Read Path
  - Browse/details: API checks Redis cache → fallback to Postgres (read replica)
  - Search: API calls search service; autocomplete backed by n-grams
  - Recommendations: API calls recommendation service; cache results per user/title
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
  - Queue write spikes (e.g., watchlist bulk adds) with backpressure
  - Idempotent upserts for ratings; dedupe watchlist items by (user_id, movie_id)
  - Stream processing to fan-out updates to derived tables and caches
- Hotspots
  - Trending titles: pre-warm caches; use CDN edge caching for static assets
  - Search: throttle noisy queries; apply per-IP/user rate limits

## 8) Reliability and Resilience

- Timeouts and retries with jitter; circuit breakers on search/recommendation
- Bulkheads: isolated connection pools per dependency
- Graceful degradation: fallback to basic recommendations and cached details
- Backfill processes rehydrate caches after failures; DLQ for ingest anomalies

## 9) Security and Privacy

- AuthN: JWT with short TTL; refresh tokens; device-bound for mobile
- AuthZ: RBAC (admin/user); scoped resource access; tenant isolation if multi-tenant
- PII minimization; secure logs; encryption at rest/in transit; secret vault
- Abuse protection: rate limiting, anomaly detection on review/ratings

## 10) Observability and Operations

- Metrics: RED on endpoints; cache hit rate; DB/query latencies; search tail latencies
- Tracing across API → search → recommendation → DB calls
- Structured logs with correlation IDs; audit sensitive operations
- CI/CD: canary deploys; feature flags for recommender experiments
- Runbooks: incident response for search outages, ingest failures, DB failover

## 11) Schema Evolution and Migration

- Expand/contract migrations with backward compatibility for API payloads
- Blue/green index rebuilds; alias-based switch for search indices
- Data backfills for new computed fields; guardrails on long migrations

## 12) Cost Awareness

- Cache hot reads to reduce DB/query costs; evaluate search shard count vs latency
- Use read replicas sized to traffic; autoscaling with cooldowns
- Monitor egress from images/CDN; consider image proxy caching if needed

## 13) Trade-offs

- Elastic search adds operational complexity but improves UX; fallback available
- Read replicas introduce eventual consistency; acceptable for watchlist reads
- Personalized recommendations can be async and cached to meet latency budgets

## 14) Evolution Plan

- Phase 1: core browse/details/search; watchlist basics; nightly ingest
- Phase 2: ratings/reviews with moderation; real-time ingest deltas
- Phase 3: personalized recommendations; A/B testing; multi-region read replicas
- Phase 4: offline support on mobile; advanced analytics dashboards

