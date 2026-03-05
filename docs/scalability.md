# Scalability Strategies and Patterns

## Estimation First

- Traffic: QPS, peak vs average, read/write ratios
- Storage: item size, growth rate, retention
- Latency budgets: P50/P95/P99 targets; SLAs/SLOs
- Cost awareness: bandwidth, storage, compute, external dependencies

## Scale Reads

- Caching: CDN for static; reverse proxy; app-level caches (LRU/LFU)
- Cache-aside for reads; write-through for critical paths
- Read replicas: asynchronous replication; read-after-write considerations
- Denormalization: precompute views, materialized queries

## Scale Writes

- Partitioning/sharding: by user ID, hash, geo; avoid skew
- Queueing: buffer spikes; backpressure and consumer concurrency control
- Idempotent producers/consumers: dedupe keys; outbox pattern
- Database strategies: batching, delayed writes, compaction windows

## Balance and Distribution

- Load balancers: L4 vs L7; sticky sessions only if necessary
- Stateless services: externalize session/state; use caches/DBs
- Client-side sharding: reduce coordinator hotspots
- Rate limiting and quotas: protect downstreams; fairness

## Reliability Under Load

- Circuit breakers: fail fast on dependency failure
- Bulkheads: isolate resource pools to prevent cascade
- Timeouts and retries: bounded + jitter; avoid retry storms
- Adaptive throttling: shed load gracefully; queue length signals

## Data Strategies

- Consistency choices: strong vs eventual; per operation
- Schema evolution: expand/contract; backward compatibility
- Multi-region: read-local, write-forward; conflict resolution strategies
- Hot key mitigation: randomized keys, bucketing, pre-splitting

## Observability and Operations

- Metrics: RED (rate, errors, duration) and USE (utilization, saturation, errors)
- Tracing: propagate context; sample intelligently
- Logging: structure logs; correlation IDs; avoid high-volume noise
- Scaling policies: autoscaling triggers; cooldowns; predictive scaling
- Testing at scale: load tests, chaos experiments, canary analysis

## Common Pitfalls

- Cache stampedes: use locks, request coalescing, jittered TTLs
- Global transactions: prefer local transactions + sagas
- Centralized coordinators: avoid single bottlenecks; distribute responsibility
- Over-optimization early: measure first; optimize hot paths only

