# Interview Q&A: Explained

## Consistency vs Availability (CAP)

- CAP: under network partitions you can choose consistency or availability
- CP: prefer consistency (e.g., majority-committed writes); may reject requests
- AP: prefer availability (e.g., eventual consistency); accept stale results
- Choice is per-operation; hybrid systems mix CP for writes, AP for reads

## Idempotency

- Same operation can be applied multiple times without changing the result
- Use idempotency keys, natural IDs, or upserts
- Consumers dedupe by message ID; producers avoid duplicate sends
- Critical for retries, at-least-once delivery, and user actions

## Rate Limiting

- Token bucket: steady refill, burst tolerance
- Leaky bucket: fixed outflow; smooths bursts
- Where: edge proxy, per-user/service, per-endpoint
- Return 429 with retry-after; expose headers for limits

## Sagas and Distributed Transactions

- Break long transactions into local steps with compensations
- Orchestration (central coordinator) vs choreography (events drive steps)
- Ensure idempotency of steps; handle partial failures explicitly

## Pagination at Scale

- Prefer cursor-based (stable ordering, no gaps) over offset
- Use ASC on indexed columns; include tie-breakers (id)
- Backfill logic for new items; cache cursors for popular views

## Hot Key Mitigation

- Randomize keys (salt/bucket), client-side sharding, pre-splitting
- Use write batching and queueing; rate limit hot partitions

## Backpressure

- Limit concurrency; bounded queues; drop/timeout under overload
- Signal upstream via errors or specific responses; autoscaling with cooldowns

## REST vs gRPC

- REST: human-readable, cache-friendly, broad ecosystem
- gRPC: binary, HTTP/2, streaming; stronger contracts; faster
- Choose REST for public APIs; gRPC for internal service RPCs

## Choosing a Database

- Relational: strong consistency, complex queries, transactions
- Document/Key-Value: flexible schema, high write throughput
- Columnar: analytics; time-series: metrics/logs; search: text relevance
- Pick based on access patterns, consistency needs, and scale

## Retry Strategies

- Exponential backoff with jitter; cap attempts; respect idempotency
- Perceived success: only retry safe operations; use circuit breakers

## Estimation Cheat Sheet

- Storage: items × size × retention; add 20–30% headroom
- QPS: daily ops ÷ seconds; peak multiplier (3–10x)
- Bandwidth: read/write sizes × QPS; egress costs awareness

