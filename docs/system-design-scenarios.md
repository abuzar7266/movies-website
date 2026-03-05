# System Design Scenarios: Walkthroughs

Use these scenario outlines to practice end-to-end designs. For each, follow the template: requirements → estimates → APIs → schema → architecture → scaling → reliability → trade-offs.

## URL Shortener

- Requirements: create short URL, redirect, expiration, analytics optional
- Estimates: write-heavy at creation spikes; read-heavy on redirects
- APIs: POST /shorten, GET /{code}, DELETE /{code}
- Schema: urls(id, code, long_url, created_at, expires_at, owner_id)
- Architecture: edge cache, LB, stateless redirect service, key generation
- Storage: hash-based code; collision handling; DB with unique index on code
- Scaling: cache hot redirects; pre-warm popular codes; CDN for 301 responses
- Reliability: idempotent shorten; rate limiting; monitoring for 404 spikes

## News Feed / Timeline

- Requirements: personalized feed, ranking, pagination, freshness
- Write path: fans-out-on-write for small follower counts; hybrid approach
- Read path: precomputed feed store; cursor-based pagination
- Storage: posts, follows, feed items; denormalized views per user
- Ranking: signals (recency, interactions); offline batch + online scoring
- Scaling: sharding by user ID; backfill; background workers; cache
- Reliability: dedupe, eventual consistency; fallback to on-read compose

## Chat / Messaging

- Requirements: real-time messaging, typing, read receipts, history
- Transport: WebSocket with auth; fallback to long-polling
- Persistence: conversations, messages, participants; append-only log
- Ordering: server-side timestamp; per-conversation ordering guarantees
- Delivery: at-least-once; idempotent message IDs; ack/retry flows
- Scaling: partition by conversation ID; stream processing for fanout
- Reliability: presence service isolation; durable queues; backpressure

## E-commerce Core

- Requirements: product catalog, cart, checkout, payment, inventory
- APIs: products, carts, orders, payments, inventory reservations
- Storage: products, orders, line_items, inventory, payments
- Transactions: reserve inventory, charge payment, finalize order (saga)
- Scaling: read-heavy catalog with caching/CDN; write hotspots during sales
- Reliability: idempotent order creation; compensation for failed steps
- Security: PCI considerations; tokenized payments; audit logs

## Notification Service

- Requirements: multi-channel (email, push, SMS), templating, scheduling
- Producer: enqueue notifications with dedupe key and metadata
- Consumer: per-channel workers; retry with backoff; DLQ
- Storage: notifications, deliveries, templates, preferences
- Scaling: rate limiting per provider; batching; parallel workers
- Reliability: provider failover; outbox pattern; idempotent sends

## Search Autocomplete

- Requirements: low-latency suggestions, relevance, typo tolerance
- Indexing: prefix indexes, edge n-grams; periodic rebuilds
- Serving: in-memory index per shard; L7 LB; cache popular queries
- Metrics: tail latency focus; cache hit rate; index freshness
- Scaling: shard indexes; streaming updates; A/B relevance tuning
- Reliability: fallback to server-side results; circuit break slow shards

