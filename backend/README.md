# Backend (MovieShelf API)

TypeScript Express API powered by Prisma (PostgreSQL), Zod v4 validation, and OpenAPI generation.

## Recent Updates
- Added ESLint v9 flat config; lints TS and JS across the backend.
- Expanded tests: integration coverage for movies filters/sorting, permissions, auth/media error paths; unit tests for middleware and DTOs.
- Stabilized type checking: explicit Prisma TransactionClient types and alias shims for ESM `.js` path imports.
- Improved developer scripts: lint, typecheck, build all green on Node 20.19+.
- Rank recomputation tests and limits: supports `RANK_RECOMPUTE_LIMIT` to cap leaderboard window.
- Release: v0.2.0 — see [CHANGELOG.md](../CHANGELOG.md) for details.

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
Prerequisite: Node >= 20.19.0

### With Docker Compose (recommended)
From repo root:
```bash
docker compose up -d --build backend
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
- Optional: `RANK_RECOMPUTE_LIMIT` to bound the number of ranked movies.

## Testing
```bash
npm run test
```

Run integration tests (requires a reachable Postgres via `DATABASE_URL`):
```bash
npm run test:integration
```

To collect coverage with Vitest:
```bash
vitest run --config vitest.integration.config.ts --coverage
```
The project uses `@vitest/coverage-v8`.

Test layout:
- Unit: `tests/unit/**/*.test.ts`
- Integration: `tests/integration/**/*.spec.ts`

## Linting & Formatting
- ESLint v9 flat config lives in `eslint.config.js`
- Run lint:
```bash
npm run lint
```
- Auto-fix:
```bash
npm run lint:fix
```
- Ignores: `dist/`, `src/generated/`, and `coverage/`
- Prettier:
```bash
npm run format
```

## CI/CD & Test Workflows
- Baseline: Node >= 20.19.0 with `npm ci` for deterministic installs.
- Static checks:
  - `npm run lint` (ESLint v9 flat config)
  - `npm run typecheck` (noEmit)
  - `npm run build` (TS + tsc-alias + Prisma ESM patch)
- Unit tests (no DB): `npm run test`
- Integration tests (DB required): provision Postgres + Redis and run `npm run test:integration`
- Coverage: enable `@vitest/coverage-v8` for integration suites.

Example GitHub Actions job:
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: movieshelf
        ports: ["5432:5432"]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s --health-timeout=5s --health-retries=5
      redis:
        image: redis:7
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.19.0
          cache: npm
      - run: npm ci
        working-directory: backend
      - run: npm run prisma:generate
        working-directory: backend
      - run: npm run lint && npm run typecheck && npm run build
        working-directory: backend
      - name: Unit tests
        run: npm run test
        working-directory: backend
      - name: Integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/movieshelf
          REDIS_URL: redis://localhost:6379
        run: npm run test:integration
        working-directory: backend
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage
```

## TypeScript Notes
- Source uses ESM‑style `.js` specifiers with TS path aliases (e.g. `@/db.js`). A shim at `src/types/alias-compat.d.ts` provides editor/type‑checker compatibility without changing runtime imports.
- Prisma transactions are annotated with `Prisma.TransactionClient` to satisfy strict type checking.

## How These Changes Improve Scalability
- Bounded recompute: Ranking updates are restricted by `RANK_RECOMPUTE_LIMIT`, limiting write amplification and avoiding full‑table rewrites as data grows.
- Smarter caching: Explicit cache versioning (`bumpCacheVersion`) scopes invalidation to movie/review namespaces for predictable performance under write load.
- Efficient media delivery: ETag/304 support and optional S3 storage reduce bandwidth/latency and move blobs off the database path.
- Safer concurrency: Service/repository boundaries and transaction typing reduce race conditions during aggregate updates (ratings/reviews).
- Operational readiness: Consistent lint/build/typecheck on Node 20, with flat ESLint and Vitest coverage, reduces regressions and improves CI signal.

## Operations
- Health: `/healthz`
- Metrics: `/metrics` (if `METRICS_ENABLED` not set to `false`)

## Notes
- Do not expose dev secrets outside local environments.
- Media storage is DB‑based for simplicity; consider object storage for production scale.

