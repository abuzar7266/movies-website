# Implementation: Basics to Advanced

## Foundations

- Code clarity: small functions, clear names, pure where possible
- Error handling: return rich errors, avoid silent failures, fail fast
- Logging: structured logs with correlation IDs; avoid PII
- Config: 12-factor, environment-based, externalized; secret management
- Validation: strict input validation at boundaries; sanitize outputs
- Testing: unit, integration, contract; test critical failure paths
- CI/CD: build, lint, test, security scan; gated deployments; rollbacks
- Feature flags: decouple deploy from release; gradual rollouts

## API Design

- Resource modeling: nouns for resources, verbs for actions
- Idempotency: PUT/DELETE idempotent; POST with idempotency keys
- Pagination: cursor-based for large datasets; stable sort order
- Filtering: explicit query params; whitelist allowed filters
- Versioning: URI or header; backward compatible changes preferred
- Rate limiting: token/leaky bucket at edge; per-user/app keys
- Reliability: retries with jittered backoff; circuit breaker; timeouts
- Observability: trace IDs across calls; metrics for latency, errors, saturation

## Data and Concurrency

- Transactions: keep small; avoid long-held locks; choose isolation level
- Idempotent consumers: dedupe with message keys; at-least-once delivery safe
- Consistency: pick strong vs eventual per flow; document invariants
- Caching: cache aside for reads; write-through for critical writes
- TTLs: align with staleness tolerance; stampede protection with locking
- Hot keys: partitioning, randomization, client-side sharding; rate limit

## Architecture Patterns

- Layered/clean arch: entities, use cases, interfaces, adapters
- Hexagonal: ports/adapters isolate side effects; domain core testable
- DDD: bounded contexts; aggregates enforce invariants; value objects immutable
- CQRS: separate read/write models; eventual consistency awareness
- Event sourcing: append-only events; projections for reads; compaction strategy

## Resilience Patterns

- Circuit breaker: open on failures; half-open probes; fail fast
- Bulkhead: isolate resources per pool; prevent cascading failures
- Retry: bounded attempts, jittered exponential backoff; avoid thundering herd
- Timeout: per call and overall budgets; propagate deadlines
- Fallbacks: degrade gracefully; serve cached or partial results

## Security and Privacy

- AuthN: OAuth2/OIDC, JWT with short TTL; refresh flows; key rotation
- AuthZ: RBAC/ABAC; policy-driven; least privilege
- Data protection: encryption at rest/in transit; KMS-managed keys
- Input hardening: sanitize, validate, escape; prevent injection/XSS/CSRF
- Secrets: never in code; use vaults; rotation and audit
- Compliance: PII classification; consent; data minimization; retention policies

## Operational Excellence

- Observability: RED/USE metrics; SLOs and error budgets; tracing spans
- Deployments: canary/blue-green; automated rollbacks; health checks
- Migration strategy: backward compatible schema changes; expand/contract
- Capacity management: autoscaling; limits and quotas; throttling
- Runbooks: standard procedures for incidents; chaos drills; postmortems

## Advanced Topics

- Multiregion: active-active vs active-passive; data replication, failover plans
- Data modeling trade-offs: relational vs NoSQL; consistency, query patterns
- Streaming: exactly-once via idempotent sinks; watermarking, late data handling
- Search: inverted indexes, relevance tuning, denormalization
- ML in production: feature stores; model versioning; shadow deployments

