import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REPO = 'yavol/fast-tax';
const DEFAULT_RUN_ID = 'mandate-run-42';

type FindingStatus = 'released' | 'proof' | 'waiting' | 'blocked';

type Finding = {
  layer: string;
  status: FindingStatus;
  action: string;
  evidence: string;
  approvals: string[];
  evidenceKeys: string[];
  gate: string;
  capability: string;
  receipt: string;
};

type EvidenceRun = {
  product: 'Mandate';
  runId: string;
  repo: string;
  request: string;
  createdAt: string;
  isolatedRun: {
    workspace: string;
    modelVisibleSecrets: false;
    protectedOraclesVisibleToAgent: false;
  };
  operatingModel: {
    logicalAgent: string;
    requesterAuthority: string;
    teachingLoop: string[];
  };
  findings: Finding[];
  suggestedSplit: string[];
};

type CliOptions = {
  runId: string;
  repo: string;
  output: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    runId: DEFAULT_RUN_ID,
    repo: DEFAULT_REPO,
    output: 'output/mandate-run-42.json'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--run-id' && next) {
      options.runId = next;
      index += 1;
      continue;
    }

    if (arg === '--repo' && next) {
      options.repo = next;
      index += 1;
      continue;
    }

    if (arg === '--output' && next) {
      options.output = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function buildEvidence(options: CliOptions): EvidenceRun {
  return {
    product: 'Mandate',
    runId: options.runId,
    repo: options.repo,
    request:
      '@Mandate make FastTax cheaper for launch, speed up OCR, test a new tax data provider, and onboard a vendor-risk agent.',
    createdAt: new Date().toISOString(),
    isolatedRun: {
      workspace: 'ephemeral-agent-workspace',
      modelVisibleSecrets: false,
      protectedOraclesVisibleToAgent: false
    },
    operatingModel: {
      logicalAgent: 'one company-level Mandate agent across FastTax',
      requesterAuthority:
        'the requester may start the run, but company policy and owners decide which capabilities can act',
      teachingLoop: [
        'waiting actions return missing approvers and evidence',
        'blocked actions explain the protected policy boundary',
        'receipts preserve sufficient proof for future employees and agents'
      ]
    },
    findings: [
      {
        layer: 'implementation.performance',
        status: 'released',
        action: 'OCR hot path optimized',
        evidence: 'Golden documents match; p95 extraction down 18%.',
        approvals: [],
        evidenceKeys: ['unit_tests', 'golden_document_tests', 'benchmark_no_regression'],
        gate: 'unit tests + benchmark',
        capability: 'merge.implementation.performance',
        receipt: 'kaspa:testnet:0x7fd1...91ac'
      },
      {
        layer: 'money.pricing',
        status: 'waiting',
        action: 'Launch promo changes checkout math',
        evidence: 'Refund exposure changes; needs finance and product approval.',
        approvals: [],
        evidenceKeys: ['pricing_replay'],
        gate: 'finance + product + replay',
        capability: 'merge.money.pricing',
        receipt: 'withheld'
      },
      {
        layer: 'vendor.api_provider',
        status: 'waiting',
        action: 'Tax data fallback provider added',
        evidence: 'New processor handles taxpayer data; privacy proof attached.',
        approvals: ['@platform'],
        evidenceKeys: ['data_retention_note'],
        gate: 'security + DPA',
        capability: 'merge.vendor.api_provider',
        receipt: 'withheld'
      },
      {
        layer: 'product_quality.recommendation_tradeoff',
        status: 'proof',
        action: 'Deduction ANN threshold changed',
        evidence: 'Recall +0.7%, p95 latency +3%, dismissal rate within gate.',
        approvals: [],
        evidenceKeys: ['offline_eval', 'metric_receipt', 'recall_gate', 'latency_gate'],
        gate: 'offline eval + metric receipt',
        capability: 'run.product_quality.recommendation_eval',
        receipt: 'metric-gate-ready'
      },
      {
        layer: 'test_oracle.integration',
        status: 'blocked',
        action: 'Agent tried to weaken paid-customer oracle',
        evidence: 'Protected integration test deleted in proposed bundle.',
        approvals: [],
        evidenceKeys: [],
        gate: 'blocked unless QA override',
        capability: 'none',
        receipt: 'blocked'
      },
      {
        layer: 'commercial.external_commitment',
        status: 'waiting',
        action: 'Vendor-risk procurement answer drafted',
        evidence: 'Tender response cites delivery SLO and security posture.',
        approvals: ['@legal'],
        evidenceKeys: ['source_citations', 'clause_matrix'],
        gate: 'legal + delivery owner',
        capability: 'submit.procurement.response',
        receipt: 'withheld'
      },
      {
        layer: 'agent_economy.spend',
        status: 'proof',
        action: 'External audit agent selected',
        evidence: 'Budget lane, delivery proof, and acceptance test are attached.',
        approvals: ['@finance'],
        evidenceKeys: ['budget_lane', 'acceptance_test', 'delivery_proof'],
        gate: 'finance + acceptance proof + settlement receipt',
        capability: 'pay.agent.vendor',
        receipt: 'settlement-ready'
      },
      {
        layer: 'regulated.customer_decision',
        status: 'waiting',
        action: 'KYC outreach drafted',
        evidence: 'Source-backed scorecard and neutral document request are ready.',
        approvals: [],
        evidenceKeys: ['source_backed_scorecard', 'tipping_off_firewall'],
        gate: 'compliance + permissioned memory check',
        capability: 'send.kyc.request_or_approve',
        receipt: 'withheld'
      }
    ],
    suggestedSplit: [
      'safe-performance-pr',
      'pricing-authority-pr',
      'provider-authority-pr',
      'recommendation-eval-task',
      'blocked-test-oracle-change',
      'procurement-response-task',
      'agent-spend-settlement-task',
      'kyc-outreach-review-task'
    ]
  };
}

function main(): void {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const options = parseArgs(process.argv.slice(2));
  const evidence = buildEvidence(options);
  const outputPath = path.resolve(agentRoot, options.output);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);

  console.log(`Mandate evidence run written: ${outputPath}`);
  console.log(`Findings: ${evidence.findings.length}`);
  console.log(`Released: ${evidence.findings.filter((finding) => finding.status === 'released').length}`);
  console.log(`Waiting: ${evidence.findings.filter((finding) => finding.status === 'waiting').length}`);
  console.log(`Blocked: ${evidence.findings.filter((finding) => finding.status === 'blocked').length}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Mandate evidence producer failed: ${message}`);
  process.exitCode = 1;
}
