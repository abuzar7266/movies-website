# Architecture Diagrams Guide (C4 Model)

## Why C4

- Consistent notation; scales from high-level to detailed views
- Helps communicate boundaries, responsibilities, and interactions quickly

## Levels

- Context: system in environment; users and external systems
- Container: major deployable components (web app, API, DB, cache)
- Component: internal modules/services and their interactions
- Code: optional class-level details; avoid in interviews unless needed

## Notation Tips

- Boxes: components/containers; clear names and responsibilities
- Arrows: dependencies; label with protocols (HTTP, gRPC, MQ)
- Boundaries: draw dashed lines for bounded contexts/tenants
- Styles: color-code by type (edge, service, data store, async)

## Rapid Diagram Checklist

- Start at context: actors + external systems
- Define containers: edge (CDN/LB), services, data stores, async workers
- Add cross-cutting: cache layers, auth, observability, feature flags
- Call out consistency domains and async flows (queues/streams)
- Highlight hotspots: rate limiting, retries, circuit breakers

## ASCII Diagram Example (Current Implementation)

```
[User] --HTTPS--> [Edge/CDN] --HTTPS--> [API Gateway]
API Gateway --HTTPS--> [API Service (Express, REST)]
API Service --SQL-->  [Postgres]
API Service --Cache--> [Redis] (cache + optional rate limiting)
API Service --S3--> [Object Storage/CDN] (media)
Observability: [/healthz][/metrics][OpenAPI /docs][Structured Logs]
Security: [JWT Cookies][CSRF][Helmet][Rate Limiting]
```
