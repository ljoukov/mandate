# Mandate Evidence Producer

This package is optional demo infrastructure for Mandate. It produces the JSON evidence packet that the control room can treat as the output of an isolated agent run.

Integration language:

- isolated agent run
- evidence packet
- authority peel
- scoped capability release
- receipt

For the finals demo, the runner emits a `mandate-run-42.json` like:

```json
{
  "runId": "mandate-run-42",
  "agent": "coding-agent",
  "repo": "yavol/fast-tax",
  "findings": [
    "implementation.performance",
    "money.pricing",
    "vendor.api_provider",
    "product_quality.recommendation_tradeoff",
    "test_oracle.integration",
    "commercial.external_commitment",
    "agent_economy.spend",
    "regulated.customer_decision"
  ],
  "suggestedSplits": [
    "safe-performance-pr",
    "pricing-authority-pr",
    "provider-authority-pr",
    "recommendation-eval-task",
    "blocked-test-oracle-change",
    "procurement-response-task",
    "agent-spend-settlement-task",
    "kyc-outreach-review-task"
  ]
}
```

## Environment

No external account is required for the deterministic evidence producer or the public-funding agent-economy artifact.

The Fetch.ai entry point requires Python dependencies from `requirements.txt` if you want to run the local `uagents` server.

## Run

```bash
cd agent
npm install
npm run fast-tax:evidence
npm run public-funding:agent-economy
```

The default output path is `agent/output/mandate-run-42.json`. Override it with `-- --output output/custom-run.json`.

The public-funding and agent-economy artifact is `agent/output/public-funding-agent-economy.json`. It contains:

- GCC & ETH allocation decisions and encoded attestation data.
- CoralOS/STUK-style agent economy states from WANT through RELEASED.
- Hash-only receipt action metadata for verifier-agent payment release.

Fetch.ai local action-readiness agent:

```bash
pip install -r requirements.txt
python fetch_action_readiness_agent.py
```
