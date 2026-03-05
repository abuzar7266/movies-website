# Production Readiness Checklist

## Reliability

- Health checks: /healthz endpoint; dependency checks optional
- Graceful shutdown: handle SIGTERM; drain connections; flush queues
- Timeouts: per call and overall; cancellation propagation
- Retries: bounded + jitter; idempotency guarantees; circuit breakers

## Observability

- Metrics: Prometheus via /metrics (RED/USE); per endpoint; percentiles
- Logs: structured with pino; correlation IDs; PII scrubbing; log levels policy
- OpenAPI: /openapi.json and /docs for API visibility
- Alerts: actionable; on-call rotation; SLO-based thresholds

## Performance and Capacity

- Load testing: representative scenarios; peak/mix; tail latency targets
- Autoscaling: triggers, cooldowns; limit guardrails
- Caching: hit/miss metrics; invalidation strategy; stampede protection
- Backpressure: queue bounds; graceful shedding; priority handling

## Data and Schema

- Migrations: Prisma expand/contract pattern; backward compat
- Backups: frequency, retention, restore drills; RPO/RTO defined
- DR: failover strategy; multi-region plans; runbooks
- PII handling: minimization, masking, retention, deletion workflows

## Security and Compliance

- TLS, cert rotation; strong ciphers
- Secrets: env/vault-managed; rotation; least privilege access
- AuthZ: audited policies; role reviews; tenant isolation tested
- Compliance: audit logs; access reviews; data locality guarantees
- CSRF: tokens via cookie/header; exempted safe paths
- Rate limiting: express-rate-limit or Redis-backed limiter

## Operations

- CI/CD: gated deploys; Prisma migrations; rollbacks; canary/blue-green
- Runbooks: incident response; escalation paths; postmortem templates
- Feature flags: rollout plans; kill switches; blast radius limits
- Cost guardrails: budgets, alerts; usage dashboards; efficiency reviews
