# Estimation Examples and Formulae

## QPS and Throughput

- Requests per second (avg): total requests / (days × 86400)
- Peak multiplier: apply 3–10x to avg for peak planning
- Read/write split: derive from requirements; validate with metrics

Example:
- 10M daily reads → ~116 QPS average; peak ~500–1000 QPS
- 1M daily writes → ~11.6 QPS average; peak ~50–100 QPS

## Storage

- Total size: item_size × count × retention
- Index overhead: add 10–30% depending on schema
- Replication: multiply by replica factor

Example:
- 200B/item × 1B items = 200 GB (raw)
- +20% index = 240 GB; ×3 replicas = 720 GB

## Bandwidth

- Egress per second: payload_size × QPS
- Monthly cost awareness: cloud provider egress pricing

Example:
- 5 KB avg payload × 1000 QPS ≈ 5 MB/s (≈ 16 TB/month)

## Latency Budgets

- Target P95 ≤ budget; distribute across call graph
- Example budget: 300ms end-to-end
  - Edge: 20ms, Auth: 20ms, Service: 120ms, DB: 120ms, Cache: 20ms

## Back-of-the-Envelope Tips

- Use powers-of-two approximations (KB≈1e3, MB≈1e6) for speed
- Round aggressively; justify assumptions explicitly
- Add 20–30% headroom for growth and variance
- Validate with canary metrics post-deploy

