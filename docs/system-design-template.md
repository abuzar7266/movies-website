# System Design Template

Use this template to structure any system design interview. Tailor details to the prompt and time constraints.

## 1) Requirements and Scope

- Functional: core features, must-haves vs nice-to-haves
- Non-functional: latency, availability, durability, consistency, compliance
- Constraints: traffic profiles, data sizes, geographic spread, budget

## 2) Back-of-the-Envelope Estimations

- QPS: average vs peak; read/write split
- Storage: item size × count × retention; growth rate
- Bandwidth: ingress/egress; payload sizes; cost awareness
- Compute: rough CPU/memory per request; concurrency

## 3) API Design

- List endpoints (REST/gRPC), request/response shapes
- Idempotency needs, pagination, filtering, rate limiting
- AuthN/AuthZ model; multi-tenant considerations

## 4) Data Modeling

- Entities, relationships, indexes; hot paths
- Choose stores: relational vs NoSQL vs search vs cache vs queue
- Schema evolution plan (expand/contract)

## 5) High-Level Architecture

- Diagram: clients → edge → services → data stores → async workers
- Stateless services with externalized state
- Caching layers (CDN, reverse proxy, app cache)
- Messaging/streaming for async workflows

## 6) Data Flow and Operations

- Read path: cache strategy, replica usage, consistency guarantees
- Write path: validation, transactions, idempotency, queues
- Batch/stream jobs: ETL, indexing, analytics

## 7) Scaling Plan

- Vertical vs horizontal scaling; autoscaling triggers
- Sharding/partitioning strategies; consistency implications
- Hotspot mitigation; backpressure; rate limiting and quotas

## 8) Reliability and Resilience

- Timeouts, retries (with jitter), circuit breakers, bulkheads
- Health checks, failover, multi-region strategy
- Disaster recovery: RPO/RTO, backups, restoration drills

## 9) Security and Privacy

- TLS everywhere; key management; secrets handling
- Access controls (RBAC/ABAC), auditing, multi-tenant isolation
- PII handling: minimization, retention, compliance (GDPR/CCPA)

## 10) Observability and Operations

- Metrics (RED/USE), tracing, structured logging
- SLOs and error budgets; alerting; canary and blue/green deploys
- Runbooks, incident response, postmortems

## 11) Risks, Trade-offs, and Evolution

- Call out trade-offs explicitly (complexity vs benefits)
- Phased rollout plan; feature flags; migration strategies
- Cost estimates and guardrails

