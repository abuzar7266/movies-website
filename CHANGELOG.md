# Changelog

All notable changes to this project are documented in this file.

## 2026-02-25

### Backend (v0.2.0)

- Added: ESLint v9 flat config for full backend coverage (TS + JS) with sensible ignores
-  - See: [backend/eslint.config.js](backend/eslint.config.js)
- Added: Stronger TypeScript typing for Prisma transactions (`Prisma.TransactionClient`)
-  - See: [backend/src/services/movies.ts](backend/src/services/movies.ts), [backend/src/services/reviews.ts](backend/src/services/reviews.ts), [backend/src/services/ratings.ts](backend/src/services/ratings.ts), [backend/src/routes/media.ts](backend/src/routes/media.ts), [backend/src/tools/seed.ts](backend/src/tools/seed.ts)
- Added: Editor/type‑checker compatibility for ESM `.js` alias imports
-  - See: [backend/src/types/alias-compat.d.ts](backend/src/types/alias-compat.d.ts)
- Improved: Rank recomputation test coverage; support for `RANK_RECOMPUTE_LIMIT`
-  - See: [backend/tests/integration/movies-recompute.spec.ts](backend/tests/integration/movies-recompute.spec.ts)
- Improved: Expanded integration tests for filters/sorting and error paths; unit tests for middleware/DTOs
-  - See: [backend/tests](backend/tests)
- Changed: Scripts and engines for consistent CI (Node >= 20.19), lint/typecheck/build verified
-  - See: [backend/package.json](backend/package.json)
- Fixed: Typecheck failures from implicit `any` and transaction callbacks
- Fixed: Test flakiness/noise by tightening config in test setup and logger mocks

Validation and request safety:
- Enforced request validation via Zod DTOs and a shared middleware
-  - Middleware: [backend/src/middleware/validate.ts](backend/src/middleware/validate.ts)
-  - Routes wired with DTOs: [backend/src/routes/movies.ts](backend/src/routes/movies.ts), [backend/src/routes/reviews.ts](backend/src/routes/reviews.ts), [backend/src/routes/ratings.ts](backend/src/routes/ratings.ts), [backend/src/routes/auth.ts](backend/src/routes/auth.ts)
-  - DTOs surface in OpenAPI generation for parity between runtime validation and API docs: [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- Added unit tests for DTO schema branches to improve branch coverage and catch edge cases early.

Security and operational hardening:
- CSRF middleware covered by tests; cookie issuance and verification integrated with auth flows.
- - CORS configured via env‑driven allowlist in [backend/src/config/index.ts](backend/src/config/index.ts) and applied in [backend/src/app.ts](backend/src/app.ts).
- Rate limiting supports Redis‑backed distributed windows with an in‑memory fallback; verified in middleware tests.

Technical notes and production impact:
- Bounded rank recompute reduces heavy writes and avoids O(N) updates across the catalog.
- Cache version bumping (`bumpCacheVersion`) scopes invalidation to relevant keys (e.g., `v:movies`).
- Media route uses ETag/304 logic for efficient CDN/browser caching; S3 path supports object storage at scale.
- Transaction annotations and repository boundaries ensure integrity under concurrent writes.
- Validation at the edge (routes) prevents bad inputs from reaching services/DB and aligns with generated OpenAPI for accurate client contracts.

### Frontend (v0.1.0)

- Added: ESLint flat config and verified scripts (dev, build, lint, test)
-  - See: [frontend/eslint.config.js](frontend/eslint.config.js), [frontend/package.json](frontend/package.json)
- Improved: README updates with recent changes and commands
- Verified: Compatibility with backend API at `http://localhost:4000`

Validation and UX readiness:
- Established a clear seam for integrating API‑backed validations via context + lib layer; current demo UI keeps fast iteration while enabling progressive enhancement with server‑validated forms.
- Next steps outlined in README to wire form components to backend DTO‑compatible validation for consistent error messaging.

Technical notes and production impact:
- Consistent lint/test setup improves reliability and DX; prepares for future API integration and UI hardening.
- Clear integration seams reduce refactor cost when replacing demo data with live endpoints; validation logic can share shapes with backend OpenAPI/DTOs for parity.

---

### CI/CD and Test Workflows (Documentation)

- Documented a recommended pipeline for Node 20.19+ with separate unit/integration phases:
  - Setup Node, install dependencies with npm ci, prisma generate
  - Static checks: npm run lint, npm run typecheck, npm run build
  - Unit tests: npm run test (no DB)
  - Integration tests: start Postgres and Redis services, export DATABASE_URL, run npm run test:integration with coverage
- Artifacts: store coverage reports and vitest results for inspection in CI
- Caching: enable npm cache and Prisma engines cache for faster runs
- Example workflow included in backend README for GitHub Actions consumers
