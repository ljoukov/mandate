export const product = {
  name: 'Mandate',
  tagline: 'Authority controls for governed AI work',
  thesis: 'Route agent actions through accountable owners, evidence, and receipts.',
  requestTemplate:
    '@Mandate review the launch pricing change, OCR performance fix, provider fallback, and vendor-risk request'
};

export type Persona = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
};

export type Channel = {
  id: string;
  name: string;
  topic: string;
  unread?: number;
  status: 'active' | 'quiet' | 'locked';
  layer: string;
};

export type Message = {
  id: number;
  channelId: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  body: string;
  kind?: 'normal' | 'agent' | 'report' | 'approval';
  tags?: string[];
  reactions?: { emoji: string; count: number }[];
};

export type ApprovalStatus = 'waiting' | 'approved' | 'blocked' | 'released';

export type Approval = {
  id: string;
  title: string;
  layer: string;
  file: string;
  request: string;
  required: string[];
  capability: string;
  status: ApprovalStatus;
  severity: 'safe' | 'review' | 'blocked';
};

export type AuthorityFinding = {
  id: string;
  action: string;
  layer: string;
  source: string;
  evidence: string;
  evidenceKeys: string[];
  approvals: string[];
  gate: string;
  capability: string;
  status: 'released' | 'waiting' | 'blocked' | 'proof';
  integrationHook: string;
  prNumber?: number;
};

export type Receipt = {
  id: string;
  title: string;
  body: string;
  hash: string;
  tone: 'ok' | 'warning' | 'danger' | 'neutral';
};

export type EvidenceShot = {
  id: string;
  title: string;
  source: string;
  caption: string;
  rows: string[];
  tone: 'ok' | 'warning' | 'danger' | 'neutral';
};

export const personas: Persona[] = [
  {
    id: 'agent',
    name: 'Mandate Agent',
    role: 'enterprise agent',
    avatar: 'MA',
    color: '#244c3b'
  },
  {
    id: 'finance',
    name: 'Owen Rao',
    role: '@finance',
    avatar: 'OR',
    color: '#7a4e19'
  },
  {
    id: 'product',
    name: 'Maya Chen',
    role: '@product',
    avatar: 'MC',
    color: '#7b3f53'
  },
  {
    id: 'security',
    name: 'Priya Shah',
    role: '@security',
    avatar: 'PS',
    color: '#24445f'
  },
  {
    id: 'qa',
    name: 'Ben Alvarez',
    role: '@qa',
    avatar: 'BA',
    color: '#52512d'
  },
  {
    id: 'compliance',
    name: 'Amara Lewis',
    role: '@compliance',
    avatar: 'AL',
    color: '#4d455d'
  }
];

export const channels: Channel[] = [
  {
    id: 'agent-approvals',
    name: 'agent-approvals',
    topic: 'Mandate authority reports, approvals, scoped capabilities, and receipts',
    unread: 6,
    status: 'active',
    layer: 'authority'
  },
  {
    id: 'authority-map',
    name: 'authority-map',
    topic: 'Cross-system actions, owners, evidence, receipts, and blocked paths',
    unread: 4,
    status: 'active',
    layer: 'authority'
  },
  {
    id: 'tax-engine',
    name: 'tax-engine',
    topic: 'Federal/state filing rules, deduction graph, and e-file validations',
    unread: 2,
    status: 'quiet',
    layer: 'domain'
  },
  {
    id: 'pricing',
    name: 'pricing',
    topic: 'Plan packaging, coupons, refund policy, and seasonal promo risk',
    unread: 1,
    status: 'locked',
    layer: 'money.pricing'
  },
  {
    id: 'procurement',
    name: 'procurement',
    topic: 'Vendor risk, tender commitments, buyer agents, and spend authority',
    unread: 3,
    status: 'locked',
    layer: 'vendor.procurement'
  },
  {
    id: 'release-room',
    name: 'release-room',
    topic: 'Cutover plan for FastTax 2026 filing season',
    unread: 3,
    status: 'active',
    layer: 'deploy'
  },
  {
    id: 'qa-test-oracles',
    name: 'qa-test-oracles',
    topic: 'Protected test fixtures, behavior diffs, and paid-customer filing workflows',
    status: 'locked',
    layer: 'test_oracle'
  }
];

export const evidenceShots: EvidenceShot[] = [
  {
    id: 'policy',
    title: 'Base Policy Wins',
    source: 'mandate-policy-v7',
    caption: 'The agent cannot loosen the policy inside the same run.',
    rows: ['test_oracle.integration -> blocked_by_default', 'base branch policy -> active', 'override -> QA + domain owner'],
    tone: 'danger'
  },
  {
    id: 'memory',
    title: 'Permission Path',
    source: 'lineage:8 sources -> 3 reports',
    caption: 'Sensitive source ACLs are enforced before content reaches a model.',
    rows: ['source_acl: pass', 'derived_lineage: pass', 'revocation_log: active'],
    tone: 'neutral'
  },
  {
    id: 'receipt',
    title: 'Receipt Digest',
    source: 'audit reference',
    caption: 'External audit systems receive receipt references after authority checks pass.',
    rows: ['policy digest', 'evidence digest', 'capability + TTL'],
    tone: 'ok'
  },
  {
    id: 'ledger',
    title: 'Permissioned Ledger Path',
    source: 'Canton DevNet validator',
    caption: 'Party allocation and Token Standard transfer commands are gated before coin movement.',
    rows: ['party allocation: prepared', 'preapproval contract: prepared', 'ACS balance: indexed'],
    tone: 'neutral'
  },
  {
    id: 'teaching',
    title: 'Teaching Loop',
    source: 'approval receipts -> next run',
    caption: 'Every blocked or waiting action explains what proof would make it safe.',
    rows: ['missing owner', 'missing evidence', 'next safe capability'],
    tone: 'ok'
  }
];

export const authorityFindings: AuthorityFinding[] = [
  {
    id: 'perf',
    action: 'OCR hot path optimized',
    layer: 'implementation.performance',
    source: 'src/document_ocr/line_score.js',
    evidence: 'Golden documents match; p95 extraction down 18%.',
    evidenceKeys: ['unit_tests', 'golden_document_tests', 'benchmark_no_regression'],
    approvals: [],
    gate: 'unit tests + benchmark',
    capability: 'merge.implementation.performance',
    status: 'released',
    prNumber: 2,
    integrationHook: 'Safe implementation work can release immediately'
  },
  {
    id: 'pricing',
    action: 'Pro Monthly price dropped to $15',
    layer: 'money.pricing',
    source: 'src/prices/prices.json',
    evidence: 'Promo calendar and checkout contract tests attached.',
    evidenceKeys: ['pricing_replay'],
    approvals: [],
    gate: '@finance + @product + pricing replay',
    capability: 'merge.money.pricing',
    status: 'waiting',
    prNumber: 1,
    integrationHook: 'Business authority is separate from code authorship'
  },
  {
    id: 'provider',
    action: 'Tax data provider fallback added',
    layer: 'vendor.api_provider',
    source: 'src/providers/tax_data_provider.js',
    evidence: 'PII retention note, privacy regression suite, cost delta.',
    evidenceKeys: ['data_retention_note'],
    approvals: ['@platform'],
    gate: '@platform + @security',
    capability: 'merge.vendor.api_provider',
    status: 'waiting',
    prNumber: 3,
    integrationHook: 'Vendor evidence is required before tool access'
  },
  {
    id: 'recs',
    action: 'Deduction ANN threshold changed',
    layer: 'product_quality.recommendation_tradeoff',
    source: 'src/recommendations/ann_config.js',
    evidence: 'Recall +0.7%, p95 latency +3%, dismissal rate within gate.',
    evidenceKeys: ['offline_eval', 'metric_receipt', 'recall_gate', 'latency_gate'],
    approvals: [],
    gate: 'offline eval + metric receipt',
    capability: 'run.product_quality.recommendation_eval',
    status: 'proof',
    integrationHook: 'Action readiness is explainable before release'
  },
  {
    id: 'test',
    action: 'Paid-customer assertion deleted',
    layer: 'test_oracle.integration',
    source: 'tests/integration/checkout_paid_customer.spec.js',
    evidence: 'Protected test oracle weakened.',
    evidenceKeys: [],
    approvals: [],
    gate: 'blocked unless QA + checkout override',
    capability: 'none',
    status: 'blocked',
    integrationHook: 'Protected tests define a hard trust boundary'
  },
  {
    id: 'tender',
    action: 'Tender liability response drafted',
    layer: 'commercial.external_commitment',
    source: 'bidframe.requirements.matrix',
    evidence: 'Public liability clause cites row 12 and legal owner note.',
    evidenceKeys: ['source_citations', 'clause_matrix'],
    approvals: ['@legal'],
    gate: '@legal + @delivery + source proof',
    capability: 'submit.procurement.response',
    status: 'waiting',
    integrationHook: 'External commitments need a transparent decision record'
  },
  {
    id: 'spend',
    action: 'External verifier agent selected',
    layer: 'verifier_procurement.spend',
    source: 'public-grant-verification-market.ledger.json',
    evidence: 'Request, bid, award, budget lane, delivery proof, and acceptance test are attached.',
    evidenceKeys: ['budget_lane', 'acceptance_test', 'delivery_proof'],
    approvals: ['@finance'],
    gate: '@finance + acceptance proof + settlement receipt',
    capability: 'pay.agent.vendor',
    status: 'proof',
    integrationHook: 'Verifier work settles only after acceptance'
  },
  {
    id: 'public-funding',
    action: 'Public digital commons grants allocated',
    layer: 'public_capital.allocation',
    source: 'gcc.public-funding.allocations.json',
    evidence: 'Rubric weights, counterfactual analysis, public sources, milestone plan, and appeal record are attached.',
    evidenceKeys: [
      'public_sources',
      'rubric_weights',
      'counterfactual_analysis',
      'milestone_plan',
      'appeal_record'
    ],
    approvals: ['@programme-owner', '@finance', '@public-audit'],
    gate: '@programme-owner + @finance + @public-audit + appeal-ready receipt',
    capability: 'allocate.public_funding',
    status: 'proof',
    integrationHook: 'This is an allocation decision, not a chat response'
  },
  {
    id: 'grant-milestone',
    action: 'Milestone verifier agent delivery accepted',
    layer: 'public_capital.milestone_verification',
    source: 'milestone-verifier-premium.delivery.json',
    evidence: 'Source citation check, repo artifact hash, and milestone acceptance test pass.',
    evidenceKeys: ['source_citation_check', 'repo_artifact_hash', 'milestone_acceptance_test'],
    approvals: ['@programme-owner'],
    gate: '@programme-owner + verifier pass + artifact hash',
    capability: 'verify.public_grant_milestone',
    status: 'proof',
    integrationHook: 'Milestone verification can be a paid specialist service'
  },
  {
    id: 'canton-transfer',
    action: 'Canton Coin verifier payment prepared',
    layer: 'permissioned_ledger.token_transfer',
    source: 'canton.low_level_lab.receipts.json',
    evidence:
      'Party allocation, PreApproval contract, ACS balance snapshot, and Token Standard transfer command are prepared.',
    evidenceKeys: ['preapproval_contract', 'coin_balance', 'transfer_command_hash', 'recipient_party'],
    approvals: ['@finance', '@ledger-ops'],
    gate: '@finance + @ledger-ops + preapproval + ACS balance',
    capability: 'canton.token.transfer',
    status: 'proof',
    integrationHook: 'Permissioned ledger transfers require validator-hosted party authority'
  },
  {
    id: 'kyc',
    action: 'KYC outreach drafted',
    layer: 'regulated.customer_decision',
    source: 'kyc.scorecard.acme-ltd',
    evidence: 'Source-backed scorecard and neutral document request are ready.',
    evidenceKeys: ['source_backed_scorecard', 'tipping_off_firewall'],
    approvals: [],
    gate: '@compliance + permissioned memory check',
    capability: 'send.kyc.request_or_approve',
    status: 'waiting',
    integrationHook: 'The agent researches; the accountable owner decides'
  }
];

export const receipts: Receipt[] = [
  {
    id: 'safe',
    title: 'Safe implementation capability released',
    body: 'Policy v7, tests passed, scoped merge command, 300s TTL, secret exposed to model: false.',
    hash: 'receipt:policy-v7:perf:7fd191ac',
    tone: 'ok'
  },
  {
    id: 'based',
    title: 'Permissioned evidence check passed',
    body: 'Vendor PII note stays hidden from roles without privacy access; derived reports keep source ACLs.',
    hash: 'memory:lineage:8-sources:3-reports',
    tone: 'neutral'
  },
  {
    id: 'chain',
    title: 'External audit reference prepared',
    body: 'External audit systems receive the receipt reference after authority passes; they do not decide authority.',
    hash: 'anchor:pending:receipt-hash-only',
    tone: 'neutral'
  },
  {
    id: 'pricing',
    title: 'Pricing authority waiting',
    body: 'Finance and product have not both approved. Pricing merge capability remains unavailable.',
    hash: 'receipt:waiting:money.pricing',
    tone: 'warning'
  },
  {
    id: 'test',
    title: 'Protected test oracle blocked',
    body: 'The agent removed a paid-customer guarantee. No normal merge or deploy capability can be released.',
    hash: 'receipt:block:test_oracle.integration',
    tone: 'danger'
  },
  {
    id: 'kyc',
    title: 'KYC action waiting',
    body: 'Neutral outreach is drafted, but customer decision authority needs compliance and permissioned memory proof.',
    hash: 'receipt:waiting:regulated.customer_decision',
    tone: 'warning'
  },
  {
    id: 'teaching',
    title: 'Follow-up recorded',
    body: 'The denied early release explains the missing owner and evidence for the next review.',
    hash: 'lesson:missing-proof:money.pricing',
    tone: 'ok'
  },
  {
    id: 'gcc',
    title: 'Public funding allocation ready',
    body: 'Grant recommendations include rubric weights, eligibility checks, milestone gates, and appeal-ready audit records.',
    hash: 'gcc:allocation:public-digital-commons',
    tone: 'ok'
  },
  {
    id: 'coral-stuk',
    title: 'Verifier procurement receipt',
    body: 'Procurement, delivery, verification, and release records are linked before payment.',
    hash: 'settlement:verifier-procurement:public-grant',
    tone: 'neutral'
  },
  {
    id: 'canton',
    title: 'Canton ledger command prepared',
    body: 'Party allocation, pre-approval, ACS balance, and Token Standard transfer receipts are linked before Canton Coin moves.',
    hash: 'canton:devnet:token-transfer-prepared',
    tone: 'neutral'
  }
];

export const approvals: Approval[] = authorityFindings.map((finding) => ({
  id: finding.id,
  title: finding.action,
  layer: finding.layer,
  file: finding.source,
  request: finding.evidence,
  required: finding.gate.split(' + '),
  capability: finding.capability,
  status:
    finding.status === 'released'
      ? 'released'
      : finding.status === 'blocked'
        ? 'blocked'
        : 'waiting',
  severity:
    finding.status === 'released' || finding.status === 'proof'
      ? 'safe'
      : finding.status === 'blocked'
        ? 'blocked'
        : 'review'
}));

export const seedMessages: Message[] = [
  {
    id: 1,
    channelId: 'agent-approvals',
    author: 'Mandate Agent',
    role: 'enterprise agent',
    avatar: 'MA',
    time: '9:04 AM',
    kind: 'report',
    body:
      'Authority report ready. High-risk actions are routed to accountable owners with scoped capability release and recorded receipts.',
    tags: ['approval-routing', 'release-control', 'audit-record'],
    reactions: [{ emoji: 'OK', count: 4 }]
  },
  {
    id: 2,
    channelId: 'agent-approvals',
    author: 'Maya Chen',
    role: '@product',
    avatar: 'MC',
    time: '9:06 AM',
    body:
      'Product can approve the launch promo only if Mandate keeps pricing separate from the provider switch and blocked test change.',
    reactions: [{ emoji: 'thread', count: 2 }]
  },
  {
    id: 3,
    channelId: 'agent-approvals',
    author: 'Owen Rao',
    role: '@finance',
    avatar: 'OR',
    time: '9:08 AM',
    body:
      'For pricing: I need the promo window, refund exposure, and replay receipt before the pricing capability is released.',
    tags: ['money.pricing']
  },
  {
    id: 4,
    channelId: 'agent-approvals',
    author: 'Ben Alvarez',
    role: '@qa',
    avatar: 'BA',
    time: '9:11 AM',
    kind: 'approval',
    body:
      'Deleting or weakening integration tests is blocked. Agents can add coverage; they cannot erase the business oracle.',
    tags: ['blocked', 'test_oracle.integration']
  },
  {
    id: 5,
    channelId: 'authority-map',
    author: 'Mandate Agent',
    role: 'authority router',
    avatar: 'MA',
    time: '9:18 AM',
    kind: 'report',
    body:
      'Authority map ready: code changes, vendor work, grant allocation, verifier payment, and public receipts are separated into scoped actions with owners and evidence.',
    tags: ['authority map', 'scoped actions', 'receipts']
  },
  {
    id: 6,
    channelId: 'tax-engine',
    author: 'Mandate Agent',
    role: 'agent',
    avatar: 'MA',
    time: '8:59 AM',
    kind: 'agent',
    body:
      'I found a redundant traversal in the deduction graph. Proposed a refactor behind existing fixtures; no business authority layer touched.',
    tags: ['auto-merge eligible']
  },
  {
    id: 7,
    channelId: 'procurement',
    author: 'Amara Lewis',
    role: '@compliance',
    avatar: 'AL',
    time: '10:15 AM',
    body:
      'A tender answer, a KYC email, and a vendor-risk recommendation are all external commitments. Mandate should require source proof and owner approval before sending.',
    tags: ['external commitment']
  },
  {
    id: 8,
    channelId: 'release-room',
    author: 'Priya Shah',
    role: '@security',
    avatar: 'PS',
    time: '12:31 PM',
    body:
      'Provider changes must show data-retention terms and encryption posture before staging deploy. Separate PR, separate capability.'
  }
];
