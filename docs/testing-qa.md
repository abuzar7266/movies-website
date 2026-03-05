# Testing and QA Strategy (MovieShelf)

## Test Types

- Unit: pure functions and services; mock I/O (Prisma, Redis, S3)
- Integration: Express routes with real Postgres (via docker-compose) and optional Redis
- Smoke: authentication flows, CSRF enforcement, rate limiter behavior
- Contract: OpenAPI schema sanity via /openapi.json; response envelope shape

## Tools and Commands

- Test runner: Vitest
- Commands: `npm run test` (unit), `npm run test:integration` (integration), `npm run test:watch`
- Coverage: V8 coverage enabled; artifacts in CI
- Lint/typecheck: `npm run lint`, `npm run typecheck`, `npm run format`

## Fixtures and Data

- Prisma migrations applied before integration tests
- Seed helpers for users/movies; reset between tests to avoid leakage
- Environment: DATABASE_URL, optional REDIS_URL; JWT secrets for token tests

## Security and Compliance Tests

- CSRF: require header matching cookie for unsafe methods; safe paths exempt
- Auth: JWT cookie issuance/refresh/revocation; unauthorized paths return 401
- Rate limiting: hit /test/rl in test mode or configure limiter; assert 429 on exceed
- Input validation: Zod schemas; ensure 400 with structured errors on invalid payloads

## Observability and Ops

- Metrics: assert /metrics returns Prometheus format; check labels and buckets
- Logs: redact sensitive headers; include requestId in logs
- Health: /healthz returns ok; dependency failure surfaces non-200 if enabled

## QA Checklist

- Endpoints documented in /openapi.json and /docs
- Error responses consistently shaped with code/message
- Pagination and filtering stable and deterministic
- Caching behavior verified: Vary headers, cache invalidation via version keys
- Idempotent operations: ratings upsert, duplicate watchlist adds

