import { error, json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';

type CapabilityConfig = {
  env: string;
  label: string;
  receiptType: 'approval_receipt' | 'action_capability';
  action?:
    | 'merge_pr'
    | 'resolve_only'
    | 'submit_external'
    | 'run_eval'
    | 'read_memory'
    | 'publish_receipt'
    | 'allocate_grant'
    | 'verify_milestone';
  requiredApprovals?: string[];
  requiredEvidence?: string[];
  ttlSeconds?: number;
};

type ReleaseRequest = {
  capability?: unknown;
  dryRun?: unknown;
  execute?: unknown;
  targetRepo?: unknown;
  prNumber?: unknown;
  status?: unknown;
  approvals?: unknown;
  evidenceKeys?: unknown;
  receiptRail?: unknown;
};

const RECEIPT_RAILS = new Set(['local', 'ethereum:eas', 'solana:devnet']);

const CAPABILITIES: Record<string, CapabilityConfig> = {
  'merge.implementation.performance': {
    env: 'MANDATE_LOW_RISK_MERGE_TOKEN',
    label: 'low-risk merge capability',
    receiptType: 'action_capability',
    action: 'merge_pr',
    requiredEvidence: ['unit_tests', 'golden_document_tests', 'benchmark_no_regression'],
    ttlSeconds: 300
  },
  'merge.money.pricing': {
    env: 'MANDATE_PRICING_MERGE_TOKEN',
    label: 'pricing merge capability',
    receiptType: 'action_capability',
    action: 'merge_pr',
    requiredApprovals: ['@finance', '@product'],
    requiredEvidence: ['pricing_replay', 'pricing_contract_tests', 'checkout_integration_tests'],
    ttlSeconds: 300
  },
  'merge.vendor.api_provider': {
    env: 'MANDATE_PROVIDER_CHANGE_TOKEN',
    label: 'provider-change merge capability',
    receiptType: 'action_capability',
    action: 'merge_pr',
    requiredApprovals: ['@platform', '@security'],
    requiredEvidence: ['provider_contract_tests', 'privacy_regression_tests', 'data_retention_note'],
    ttlSeconds: 300
  },
  'merge.legacy.behavior_change': {
    env: 'MANDATE_LEGACY_BEHAVIOR_TOKEN',
    label: 'legacy behavior-change capability',
    receiptType: 'action_capability',
    action: 'merge_pr',
    requiredApprovals: ['@domain-owner'],
    requiredEvidence: ['golden_master_replay', 'behavior_diff', 'fuzz_report'],
    ttlSeconds: 300
  },
  'run.product_quality.recommendation_eval': {
    env: 'MANDATE_RECS_EVAL_TOKEN',
    label: 'recommendation eval capability',
    receiptType: 'action_capability',
    action: 'run_eval',
    requiredEvidence: ['offline_eval', 'metric_receipt', 'recall_gate', 'latency_gate'],
    ttlSeconds: 900
  },
  'submit.procurement.response': {
    env: 'MANDATE_PROCUREMENT_SUBMIT_TOKEN',
    label: 'procurement submission capability',
    receiptType: 'action_capability',
    action: 'submit_external',
    requiredApprovals: ['@legal', '@delivery'],
    requiredEvidence: ['clause_matrix', 'source_citations', 'liability_review'],
    ttlSeconds: 300
  },
  'send.kyc.request_or_approve': {
    env: 'MANDATE_KYC_ACTION_TOKEN',
    label: 'regulated KYC action capability',
    receiptType: 'action_capability',
    action: 'submit_external',
    requiredApprovals: ['@compliance'],
    requiredEvidence: ['source_backed_scorecard', 'tipping_off_firewall', 'permissioned_memory_check'],
    ttlSeconds: 300
  },
  'read.permissioned_memory': {
    env: 'MANDATE_MEMORY_READ_TOKEN',
    label: 'permissioned memory read capability',
    receiptType: 'action_capability',
    action: 'read_memory',
    requiredEvidence: ['source_acl', 'derived_lineage', 'revocation_log', 'deterministic_access_log'],
    ttlSeconds: 180
  },
  'pay.agent.vendor': {
    env: 'MANDATE_AGENT_PAYMENT_TOKEN',
    label: 'agent payment capability',
    receiptType: 'action_capability',
    action: 'submit_external',
    requiredApprovals: ['@finance'],
    requiredEvidence: ['budget_lane', 'acceptance_test', 'delivery_proof'],
    ttlSeconds: 120
  },
  'allocate.public_funding': {
    env: 'MANDATE_PUBLIC_FUNDING_TOKEN',
    label: 'public funding allocation capability',
    receiptType: 'action_capability',
    action: 'allocate_grant',
    requiredApprovals: ['@programme-owner', '@finance', '@public-audit'],
    requiredEvidence: [
      'public_sources',
      'rubric_weights',
      'counterfactual_analysis',
      'milestone_plan',
      'appeal_record'
    ],
    ttlSeconds: 600
  },
  'verify.public_grant_milestone': {
    env: 'MANDATE_GRANT_MILESTONE_TOKEN',
    label: 'public grant milestone verification capability',
    receiptType: 'action_capability',
    action: 'verify_milestone',
    requiredApprovals: ['@programme-owner'],
    requiredEvidence: ['source_citation_check', 'repo_artifact_hash', 'milestone_acceptance_test'],
    ttlSeconds: 300
  },
  'dispatch.grid.flexibility': {
    env: 'MANDATE_DISPATCH_TOKEN',
    label: 'grid dispatch capability',
    receiptType: 'action_capability',
    action: 'submit_external',
    requiredApprovals: ['@operator', '@safety'],
    requiredEvidence: ['simulation', 'telemetry', 'carbon_or_reliability_goal', 'rollback_plan'],
    ttlSeconds: 90
  },
  'publish.governance.receipt': {
    env: 'MANDATE_GOVERNANCE_RECEIPT_TOKEN',
    label: 'public governance receipt capability',
    receiptType: 'action_capability',
    action: 'publish_receipt',
    requiredEvidence: ['public_sources', 'objective_dag', 'appeal_record'],
    ttlSeconds: 600
  },
  'run.ops.precedent_fix': {
    env: 'MANDATE_OPS_FIX_TOKEN',
    label: 'incident precedent fix capability',
    receiptType: 'action_capability',
    action: 'resolve_only',
    requiredApprovals: ['@ops-owner'],
    requiredEvidence: ['runbook_match', 'blast_radius', 'rollback_command'],
    ttlSeconds: 180
  },
  'publish.transformation_plan': {
    env: 'MANDATE_TRANSFORMATION_PLAN_TOKEN',
    label: 'transformation plan publication capability',
    receiptType: 'action_capability',
    action: 'publish_receipt',
    requiredEvidence: ['impact_radar', 'scenario_simulation', 'owner_map'],
    ttlSeconds: 600
  },
  'deploy.staging': {
    env: 'MANDATE_STAGING_DEPLOY_TOKEN',
    label: 'staging deploy capability',
    receiptType: 'action_capability',
    ttlSeconds: 300
  },
  'approve.product': {
    env: 'MANDATE_PRODUCT_APPROVAL_RECEIPT',
    label: 'product demo approval receipt',
    receiptType: 'approval_receipt'
  },
  'approve.finance': {
    env: 'MANDATE_FINANCE_APPROVAL_RECEIPT',
    label: 'finance demo approval receipt',
    receiptType: 'approval_receipt'
  },
  'approve.qa_override': {
    env: 'MANDATE_QA_OVERRIDE_RECEIPT',
    label: 'QA override demo approval receipt',
    receiptType: 'approval_receipt'
  }
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function missingItems(required: string[] = [], actual: string[]): string[] {
  const actualSet = new Set(actual);
  return required.filter((item) => !actualSet.has(item));
}

function buildEvidenceHash(
  capability: string,
  targetRepo: string,
  prNumber: number,
  approvals: string[],
  evidenceKeys: string[]
) {
  const payload = [capability, targetRepo, prNumber || 'none', ...approvals, ...evidenceKeys].join(':');
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

function getLiveExecutorToken(platform: App.Platform | undefined, envName: string) {
  return platform?.env?.[envName] ?? process.env[envName];
}

export async function POST({ request, platform }) {
  const body = (await request.json().catch(() => ({}))) as ReleaseRequest;
  const capability = String(body.capability ?? '');
  const config = CAPABILITIES[capability];
  const dryRun = body.dryRun !== false && body.execute !== true;

  if (!config) {
    throw error(403, `No releasable capability is configured for ${capability || 'empty request'}.`);
  }

  const targetRepo = String(body.targetRepo ?? 'yavol/fast-tax');
  if (targetRepo !== 'yavol/fast-tax') {
    throw error(403, `Target repo ${targetRepo} is not allowed for this demo.`);
  }

  const prNumber = Number.parseInt(String(body.prNumber ?? ''), 10);
  const shouldMergePr = config.action === 'merge_pr' && Number.isInteger(prNumber) && prNumber > 0;
  const approvals = toStringArray(body.approvals);
  const evidenceKeys = toStringArray(body.evidenceKeys);
  const receiptRail = String(body.receiptRail ?? 'local');
  const missingApprovals = missingItems(config.requiredApprovals, approvals);
  const missingEvidence = missingItems(config.requiredEvidence, evidenceKeys);

  if (!RECEIPT_RAILS.has(receiptRail)) {
    throw error(400, `Receipt rail ${receiptRail} is not available in this demo.`);
  }

  if (String(body.status ?? '') === 'blocked') {
    throw error(403, `Mandate refused ${capability}: the authority layer is blocked by base policy.`);
  }

  if (config.receiptType === 'action_capability' && (missingApprovals.length || missingEvidence.length)) {
    throw error(
      403,
      `Mandate withheld ${capability}. Missing approvals: ${
        missingApprovals.length ? missingApprovals.join(', ') : 'none'
      }. Missing evidence: ${missingEvidence.length ? missingEvidence.join(', ') : 'none'}.`
    );
  }

  const releasedAt = new Date().toISOString();
  const evidenceHash = buildEvidenceHash(capability, targetRepo, prNumber, approvals, evidenceKeys);
  const receiptHash = `receipt:${receiptRail}:${createHash('sha256')
    .update(`${releasedAt}:${capability}:${evidenceHash}`)
    .digest('hex')}`;

  if (dryRun) {
    return json({
      capability,
      label: config.label,
      releasedAt,
      receiptType: config.receiptType,
      ttlSeconds: config.ttlSeconds ?? 300,
      targetRepo,
      prNumber: shouldMergePr ? prNumber : null,
      merged: false,
      mergeCommandExecuted: false,
      subprocessOnly: true,
      secretExposedToModel: false,
      dryRun: true,
      policyVersion: 'mandate-policy-v7',
      approvals,
      evidenceKeys,
      missingApprovals,
      missingEvidence,
      evidenceHash,
      receiptRail,
      railAnchor:
        receiptRail === 'local'
          ? 'local-only'
          : `${receiptRail}:hash-only-anchor-prepared`,
      receiptHash,
      command:
        shouldMergePr
          ? `capability ${capability} would run a scoped merge for ${targetRepo}#${prNumber}`
          : `capability ${capability} verified as releasable for one approved action`
    });
  }

  if (!getLiveExecutorToken(platform, config.env)) {
    throw error(
      502,
      `The live executor for ${capability} is disabled. Set ${config.env} or use dryRun.`
    );
  }

  return json({
    capability,
    label: config.label,
    releasedAt,
    receiptType: config.receiptType,
    ...(config.ttlSeconds ? { ttlSeconds: config.ttlSeconds } : {}),
    ...(config.action === 'merge_pr'
      ? {
          targetRepo,
          prNumber: shouldMergePr ? prNumber : null,
          merged: shouldMergePr,
          mergeCommandExecuted: shouldMergePr
        }
      : {}),
    subprocessOnly: true,
    secretExposedToModel: false,
    liveExecutorResolved: true,
    scopedActionOnly: true,
    policyVersion: 'mandate-policy-v7',
    approvals,
    evidenceKeys,
    evidenceHash,
    receiptRail,
    railAnchor:
      receiptRail === 'local'
        ? 'local-only'
        : `${receiptRail}:hash-only-anchor-prepared`,
    receiptHash,
    command:
      shouldMergePr
        ? `capability ${capability} ran a scoped merge for ${targetRepo}#${prNumber}`
        : `capability ${capability} resolved inside a controlled subprocess`
  });
}
