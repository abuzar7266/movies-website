# Frontend (MovieShelf Web)

Vite + React SPA that showcases movie discovery, ranking, and reviewing with a modern UI.

## Recent Updates
- Aligned tooling with backend: ESLint flat config and Vitest are ready to run.
- Verified scripts: dev, build, lint, and test are configured and pass locally.
- No breaking UI changes; compatible with backend API at http://localhost:4000.
- Release: v0.1.0 — see [CHANGELOG.md](../CHANGELOG.md).

## Design & Architecture
- Vite + React with file‑scoped components and a small context layer.
- State:
  - `AuthContext` provides a demo auth flow stored in localStorage.
  - `MovieContext` manages movie lists, filters, rankings, and review statistics.
- UI: component library under `src/components/ui` for cohesive look and feel.
- Routing: React Router with pages under `src/pages`.
- Utility modules in `src/lib` (e.g., `movieQuery` for filtering/sorting, `utils` for helpers).

## Key Tradeoffs & Optimizations
- Local demo data and auth for instant UX and easy evaluation.
- Query helpers pre‑compute ranks and aggregates to render quickly.
- Bundled as static assets served by Nginx in production for simplicity.

## Project Structure
```
src/
  components/       # UI building blocks + domain widgets (cards, forms)
  context/          # Auth and Movie providers
  lib/              # query logic, utilities
  pages/            # routed pages
  assets/           # static assets
  tests/
    unit/           # pure function/unit tests
    ui/             # UI/component tests (React Testing Library)
```

## Running
### With Docker Compose (recommended)
From repo root:
```bash
docker compose up -d --build
```
Site available at http://localhost:8080

### Local Dev
```bash
cd project/frontend
npm ci
npm run dev
```

## Commands
- Build:
```bash
npm run build
```
- Lint:
```bash
npm run lint
```
- Test (Vitest):
```bash
npm run test
```

## How These Changes Improve Scalability
- Consistent lint and test setup reduces defects and enforces code quality as the UI surface grows.
- Clear API integration points (via contexts and a thin lib layer) allow progressive replacement of demo data with real endpoints without large refactors.
- Vite build targets modern browsers and enables fast HMR for rapid iteration.

## Testing
```bash
cd project/frontend
npm run test
```

## Tools & Tech
- React 18, Vite, TypeScript
- UI: modern composition with small, reusable primitives
- Testing: vitest + React Testing Library

## Integrating With Backend
This SPA ships with demo data and local auth. To integrate with the API:
- Point your API client to http://localhost:4000
- Map endpoints to the backend’s OpenAPI spec (`/openapi.json`). Add a thin API layer in `src/lib` and wire into contexts.

## Notes
- Keep frontend concerns here; API details and server operations live in the backend README.
