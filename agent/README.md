# Mandate Evidence Producer

This package produces JSON evidence packets that the control room can treat as the output of isolated agent work.

Integration language:

- isolated agent run
- evidence packet
- authority peel
- scoped capability release
- receipt

The runner emits a `mandate-run-42.json` like:

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
    "verifier_procurement.spend",
    "regulated.customer_decision"
  ],
  "suggestedSplits": [
    "safe-performance-pr",
    "pricing-authority-pr",
    "provider-authority-pr",
    "recommendation-eval-task",
    "blocked-test-oracle-change",
    "procurement-response-task",
    "verifier-payment-settlement-task",
    "kyc-outreach-review-task"
  ]
}
```

## Environment

No external account is required for the deterministic evidence producer or the public-funding verifier-procurement artifact.

The Fetch.ai entry point requires Python dependencies from `requirements.txt` if you want to run the local `uagents` server.

## Run

```bash
cd agent
npm install
npm run fast-tax:evidence
npm run public-funding:verifier-procurement
```

The default output path is `agent/output/mandate-run-42.json`. Override it with `-- --output output/custom-run.json`.

The public-funding and verifier-procurement artifact is `agent/output/public-funding-verifier-procurement.json`. It contains:

- GCC & ETH allocation decisions and encoded attestation data.
- Verifier procurement states from request through release.
- Hash-only receipt action metadata for verifier payment release.

Fetch.ai local action-readiness agent:

```bash
pip install -r requirements.txt
python fetch_action_readiness_agent.py
```
