# Design Principles and Architectural Patterns

## SOLID

- Single Responsibility: one reason to change per module
- Open/Closed: extend behavior without modifying stable code
- Liskov Substitution: derived types must honor base contracts
- Interface Segregation: lean interfaces; avoid fat ones
- Dependency Inversion: depend on abstractions, not concretions

## Clean/Layered Architecture

- Domain (entities, business rules)
- Use Cases (application services orchestrating domain)
- Interfaces (ports) define boundaries
- Adapters implement ports for web, DB, cache, messaging
- Benefits: testability, replaceable infrastructure, clear dependencies

## Hexagonal (Ports and Adapters)

- Ports: domain-defined interfaces (inbound/outbound)
- Adapters: technology-specific implementations
- Domain core stays pure; easy to test and evolve

## Domain-Driven Design (DDD)

- Bounded contexts: explicit domain partitions with clear interfaces
- Aggregates: transactional consistency boundaries; enforce invariants
- Entities: identity + lifecycle; Value Objects: immutable, equality by value
- Ubiquitous language: align model and domain terminology
- Context mapping: shared kernel, anti-corruption layer, conformist

## CQRS

- Separate read and write models for scalability
- Read side: denormalized, query-optimized stores
- Write side: validates invariants, emits events
- Trade-offs: eventual consistency, operational complexity

## Event Sourcing

- Persist events; rebuild state via projections
- Auditability and temporal queries; easy to publish changes
- Requires careful versioning and projection management

## Microservices vs Monolith

- Monolith: simpler ops, consistent transactions, faster initially
- Microservices: independent deploys, scaling per service, isolation
- Choose microservices for team autonomy and clear bounded contexts
- Avoid nano-services; keep services meaningful

## Cross-Cutting Concerns

- Observability: tracing, metrics, logs
- Resilience: retries, timeouts, circuit breakers, bulkheads
- Security: zero trust, least privilege, secrets, encryption
- Governance: API standards, schema evolution, compatibility contracts

