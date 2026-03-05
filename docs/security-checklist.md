# Security Checklist for System Design

## Identity and Access

- AuthN: short-lived tokens, refresh flows, device binding for mobile
- AuthZ: RBAC/ABAC; centralized policy engine; least privilege
- MFA where appropriate; session management with inactivity timeouts

## Data Protection

- TLS everywhere; HSTS; secure cipher suites; cert rotation
- Encryption at rest with KMS; key rotation; envelope encryption
- Secrets: managed vault; access via workload identity; never in code or logs

## Input and Boundary Hardening

- Validate and sanitize inputs; escape outputs; content-type headers
- Prevent injection: SQL/NoSQL, command, template injection
- Web security: CSRF tokens, XSS protection, clickjacking headers

## API Security

- Rate limiting and quotas; abuse detection; app-level keys
- Idempotency keys; replay protection (nonce/timestamp)
- Audit logging for sensitive operations; tamper-evident logs

## Multi-Tenant Isolation

- Enforce tenant scopes at all layers; data partitioning
- Per-tenant rate limits and quotas; noisy neighbor protections

## Storage and Schema

- PII minimization; retention policies; right-to-erasure flows
- Access patterns reviewed for least privilege; masked test data

## Operations

- Secure supply chain: signed artifacts; SBOM; vulnerability scanning
- Patching/updates: automation; maintenance windows
- Incident response: runbooks; forensics; breach notification procedures

## Monitoring and Detection

- Centralized logs; anomaly detection; alerting on auth/privileged events
- Threat modeling: regular reviews; address findings with owners
- Chaos tests: validate isolation and fail-safes without exposing data

