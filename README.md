# MovieShelf

Full‑stack movie catalog and review app with a TypeScript/Express backend and a Vite/React frontend.

## What’s Inside
- Backend: Express + Prisma + PostgreSQL, Zod v4 validation, OpenAPI generated from Zod, JWT auth, Prometheus metrics.
- Frontend: React + Vite, modern UI components, client-side state and sample data for a fast demo UX.
- Docker Compose: Orchestrates Postgres, Redis, backend API, and the static frontend.

## Quick Start (Docker Compose)

Prerequisites: Docker + Docker Compose v2.

1. Build and run:

```bash
docker compose up -d --build
```

This brings up:
- db (Postgres 16) on an internal network
- redis (optional rate limiting)
- backend (Node/Express API) on http://localhost:4000
- frontend (static SPA) on http://localhost:8080

2. Verify the API:
- Health: http://localhost:4000/healthz
- OpenAPI JSON: http://localhost:4000/openapi.json
- Swagger UI: http://localhost:4000/docs

3. Stop and remove containers:

```bash
docker compose down
```

Persistent database data lives in the `dbdata` volume.

## Configuration
The backend reads environment via zod‑validated config. Default Compose values:
- DATABASE_URL: postgres://postgres:postgres@db:5432/movieshelf
- REDIS_URL: redis://redis:6379 (optional; in‑memory limiter if unset)
- PORT: 4000
- JWT_ACCESS_SECRET/JWT_REFRESH_SECRET: sample values prefilled; change for non‑local use

For advanced settings (CORS, cookie domain, TTLs), see the backend README.

## Project Structure
```
project/
  backend/      # Express API, Prisma schema, tests, Dockerfile
  frontend/     # Vite React SPA, Nginx runtime Dockerfile
  docker-compose.yml  # Runs db, redis, backend, frontend
```

## Development Notes
- The frontend demo operates client‑side; the backend provides the real API with auth, media, reviews, and ratings. You can develop independently and integrate as needed.
- Security and operational notes: dev secrets are present only for local use; rotate for any shared or deployed environment.

## Testing
### Frontend
```bash
cd project/frontend
npm run test
```

### Backend
Unit tests:
```bash
cd project/backend
npm run test
```

Integration tests (DB required):
```bash
cd project/backend
npm run test:integration
```

Test locations:
- Frontend: `project/frontend/src/tests/unit`, `project/frontend/src/tests/ui`
- Backend: `project/backend/tests/unit`, `project/backend/tests/integration`

## License
For interview/demo use.
