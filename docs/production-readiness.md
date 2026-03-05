# Production Readiness Checklist

## Reliability

- Health checks: liveness/readiness; per dependency
- Graceful shutdown: handle SIGTERM; drain connections; flush queues
- Timeouts: per call and overall; cancellation propagation
- Retries: bounded + jitter; idempotency guarantees; circuit breakers

## Observability

- Metrics: RED/USE; per endpoint/service; percentiles
- Tracing: propagate context; span names; sampling strategy
- Logs: structured; correlation IDs; PII scrubbing; log levels policy
- Alerts: actionable; on-call rotation; SLO-based thresholds

## Performance and Capacity

- Load testing: representative scenarios; peak/mix; tail latency targets
- Autoscaling: triggers, cooldowns; limit guardrails
- Caching: hit/miss metrics; invalidation strategy; stampede protection
- Backpressure: queue bounds; graceful shedding; priority handling

## Data and Schema

- Migrations: expand/contract pattern; backward compat
- Backups: frequency, retention, restore drills; RPO/RTO defined
- DR: failover strategy; multi-region plans; runbooks
- PII handling: minimization, masking, retention, deletion workflows

## Security and Compliance

- TLS, cert rotation; strong ciphers
- Secrets: vault-managed; rotation; least privilege access
- AuthZ: audited policies; role reviews; tenant isolation tested
- Compliance: audit logs; access reviews; data locality guarantees

## Operations

- CI/CD: gated deploys; rollbacks; canary/blue-green; artifact signing
- Runbooks: incident response; escalation paths; postmortem templates
- Feature flags: rollout plans; kill switches; blast radius limits
- Cost guardrails: budgets, alerts; usage dashboards; efficiency reviews

