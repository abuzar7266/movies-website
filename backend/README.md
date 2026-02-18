# Backend (MovieShelf API)

TypeScript Express API powered by Prisma (PostgreSQL), Zod v4 validation, and OpenAPI generation.

## Design & Architecture
- Express + modular routing under `src/routes`.
- DTOs in `src/dtos` using Zod v4 for validation and type‑safety.
- OpenAPI spec is generated from Zod schemas (`src/docs/openapi.ts`) with `@asteasolutions/zod-to-openapi`.
- Prisma as ORM; repositories under `src/repositories`, services under `src/services` enforce a clear boundary.
- JWT auth (access/refresh) in `src/auth/jwt.ts`, cookie‑based session with secure flags in production.
- Cross‑cutting concerns:
  - Request ID middleware (`src/middleware/requestId.ts`).
  - Rate limiting: in‑memory by default, optional Redis (`src/middleware/redisRateLimit.ts`).
  - Metrics (`src/config/metrics.ts`) via Prometheus `prom-client`.
  - Structured logging via Pino (`src/config/logger.ts`) and opt‑in API logs in development.

## Data Model (Prisma)
Entities: `User`, `Movie`, `Review`, `Rating`, `Media`.
- Movies have averageRating/reviewCount denormalized for query speed.
- Ratings upsert updates aggregates transactionally in services.
- Media stored in DB for simplicity (tradeoff: not optimal for large binary scale).

## Key Tradeoffs & Optimizations
- Zod v4 for runtime validation + types; OpenAPI generated from the same source to avoid drift.
- Denormalized aggregates for movies reduce query joins for lists and rankings.
- Optional Redis for distributed rate limiting; in‑memory fallback for local/dev.
- Pretty logs only in development to keep production lean.

## API
- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
- Sample endpoints:
  - Auth: `/auth/register`, `/auth/login`, `/auth/logout`
  - Users: `/users/me`, `/users/me/avatar`
  - Movies: CRUD + poster upload
  - Reviews: list/create/update/delete
  - Ratings: upsert, get current user’s rating

See generated OpenAPI for full request/response shapes.

## Project Structure
```
src/
  config/            # env config, logger, metrics
  auth/              # jwt helpers
  dtos/              # Zod schemas
  docs/              # OpenAPI generation from Zod
  middleware/        # auth, validate, errors, rate limiting
  repositories/      # Prisma data access
  services/          # business logic
  routes/            # HTTP routes
  tools/             # seed, smoke, helpers
  app.ts             # Express app
  server.ts          # bootstrap
```

## Local Setup
### With Docker Compose (recommended)
From repo root:
```bash
docker compose up -d --build
```
Backend available at http://localhost:4000. Postgres and Redis run in sibling services.

### Without Docker (manual)
1. Create a PostgreSQL database and set `DATABASE_URL`.
2. Install deps and generate Prisma client:
```bash
cd project/backend
npm ci
npm run prisma:generate
```
3. Apply migrations:
```bash
npx prisma migrate deploy
```
4. Run dev server:
```bash
npm run dev
```

### Env Configuration
Copy `.env.example` to `.env` and edit as needed:
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/movieshelf`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (required in production)
- Optional: `REDIS_URL` for rate limiting; otherwise in‑memory limiter is used.

## Testing
```bash
npm test
```
23 tests cover auth, movies, media, reviews, ratings, and rate limiting.

## Operations
- Health: `/healthz`
- Metrics: `/metrics` (if `METRICS_ENABLED` not set to `false`)

## Notes
- Do not expose dev secrets outside local environments.
- Media storage is DB‑based for simplicity; consider object storage for production scale.

