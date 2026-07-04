export const product = {
  name: 'Mandate',
  tagline: 'The enterprise authority fabric for AI agents',
  thesis: 'One company agent. Many authority checks. Every gate teaches.',
  demoPrompt:
    '@Mandate make FastTax cheaper for launch, speed up OCR, test a new tax data provider, and onboard a vendor-risk agent'
};

export type CoreObservation = {
  id: string;
  title: string;
  body: string;
  proof: string;
};

export const coreObservations: CoreObservation[] = [
  {
    id: 'company-agent',
    title: 'One logical company agent',
    body:
      'The requester starts the run, but the agent acts for FastTax, not under the requester. An intern can ask; Mandate still routes money, vendor, KYC, procurement, grid, and release actions to the company owners who hold authority.',
    proof:
      'Specialist demos and integration rails become tools of the company agent, then Mandate releases only the scoped capability that passed policy.'
  },
  {
    id: 'teaching-gates',
    title: 'Every gate can teach',
    body:
      'A refusal is not dead-end compliance. It tells the employee and future agents which evidence, owner, replay, eval, or memory check is missing, then stores that lesson in the receipt trail.',
    proof:
      'Approvals, denials, receipts, and replay results become reusable guidance for safer future work.'
  }
];

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

export type IntegrationTrack = {
  id: string;
  name: string;
  ask: string;
  mandateMove: string;
  crowding: 'crowded' | 'moderate' | 'open';
  examples: string[];
};

export type AgentPlugin = {
  id: string;
  name: string;
  borrowedFrom: string;
  action: string;
  evidence: string;
  authorityLayer: string;
  capability: string;
  integrationFit: string[];
  status: 'allowed' | 'waiting' | 'blocked' | 'proof';
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

export type DemoExample = {
  id: string;
  borrowedFrom: string;
  action: string;
  gate: string;
  capability: string;
  receipt: string;
  rail: string;
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
    id: 'integrations-room',
    name: 'integrations-room',
    topic: 'Conduct, Fetch.ai, CoralOS/STUK, and GCC & ETH integration fit',
    unread: 4,
    status: 'active',
    layer: 'integration'
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

export const integrationTracks: IntegrationTrack[] = [
  {
    id: 'conduct',
    name: 'Conduct AI',
    ask: 'Make slow enterprise work move faster while humans stay in control.',
    mandateMove:
      'One broad agent request becomes safe PRs, blocked actions, behavior gates, and owner approvals.',
    crowding: 'crowded',
    examples: ['pricing', 'legacy', 'kyc', 'field safety']
  },
  {
    id: 'fetch',
    name: 'Fetch.ai',
    ask: 'Expose a useful agent through Agentverse and complete work from conversation.',
    mandateMove:
      'A judge can ask: can this action proceed? Mandate returns allowed, waiting, or blocked with receipts.',
    crowding: 'crowded',
    examples: ['action readiness', 'vendor risk', 'grid']
  },
  {
    id: 'coral',
    name: 'CoralOS / STUK',
    ask: 'Build the agent economy: agents buy and sell useful work with verifiable settlement.',
    mandateMove:
      'A public authority buyer can hire verifier agents, escrow payment, verify delivery, then release only a scoped payment capability.',
    crowding: 'moderate',
    examples: ['WANT/BID/AWARD', 'escrow', 'verifier gate']
  },
  {
    id: 'gcc',
    name: 'GCC & ETH',
    ask: 'Transparent public capital allocation with metrics, counterfactuals, milestones, and reusable components.',
    mandateMove:
      'Grant applications become scored decisions, milestone release gates, appeal-ready receipts, and hash-only attestations.',
    crowding: 'moderate',
    examples: ['public funding', 'counterfactuals', 'milestones']
  }
];

export const demoExamples: DemoExample[] = [
  {
    id: 'pricing',
    borrowedFrom: 'Pactline / AlphaChange',
    action: 'Pro Monthly price dropped to $15',
    gate: '@finance + @product + pricing replay',
    capability: 'merge.money.pricing',
    receipt: 'withheld until approvals and checkout replay pass',
    rail: 'local or ETH hash'
  },
  {
    id: 'vendor',
    borrowedFrom: 'VendorVerdict / BioVault',
    action: 'Tax data provider fallback added',
    gate: '@platform + @security + retention proof',
    capability: 'merge.vendor.api_provider',
    receipt: 'permissioned evidence path before model access',
    rail: 'local'
  },
  {
    id: 'procurement',
    borrowedFrom: 'Bidframe / Conducting KYC',
    action: 'Tender or KYC external commitment',
    gate: '@legal + @delivery + source proof',
    capability: 'submit.procurement.response',
    receipt: 'human decision, source-backed scorecard',
    rail: 'Ethereum-style attestation'
  },
  {
    id: 'clinical',
    borrowedFrom: 'Trial matching / SwarmSight',
    action: 'Patient eligibility export',
    gate: 'PI + safety monitor + de-identification proof',
    capability: 'send.kyc.request_or_approve',
    receipt: 'review-ready, no auto-approval',
    rail: 'local audit pack'
  },
  {
    id: 'grid',
    borrowedFrom: 'Grid Balancer / BitHub',
    action: 'Dispatch flexibility action',
    gate: 'operator sign-off + telemetry receipt',
    capability: 'dispatch.grid.flexibility',
    receipt: 'commit before execute',
    rail: 'local hash'
  },
  {
    id: 'spend',
    borrowedFrom: 'CoralOS / STUK',
    action: 'Public authority buys milestone verification',
    gate: 'WANT/BID/AWARD + acceptance test + verifier pass',
    capability: 'pay.agent.vendor',
    receipt: 'devnet escrow release only after delivery proof',
    rail: 'Solana devnet'
  },
  {
    id: 'public-funding',
    borrowedFrom: 'GCC',
    action: 'Allocate public-good grant funding',
    gate: 'rubric + counterfactual + milestone plan + public audit',
    capability: 'allocate.public_funding',
    receipt: 'appeal-ready funding decision with reusable rubric',
    rail: 'Ethereum EAS-style'
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
    title: 'Hash-Only Rail',
    source: 'receipt rail adapter',
    caption: 'Crypto rails attest to receipt hashes; Mandate still decides authority.',
    rows: ['policy hash', 'evidence hash', 'capability + TTL'],
    tone: 'ok'
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

export const agentPlugins: AgentPlugin[] = [
  {
    id: 'legacy',
    name: 'Behavior diff gate',
    borrowedFrom: 'KEEL, Legacy Safety Net, LegacyLift, AlphaChange',
    action: 'Change a legacy tax rule and prove what behavior changed.',
    evidence: 'Golden-master replay: 2,847 held, 4 intended, 2 review-needed.',
    authorityLayer: 'legacy.behavior_contract',
    capability: 'merge.legacy.behavior_change',
    integrationFit: ['Conduct AI'],
    status: 'proof'
  },
  {
    id: 'pricing-impact',
    name: 'Pricing impact gate',
    borrowedFrom: 'Pactline, AlphaChange, Lumen',
    action: 'Change business-critical pricing or quant rules.',
    evidence: 'Contract replay, affected-customer set, margin and refund exposure.',
    authorityLayer: 'money.pricing',
    capability: 'merge.money.pricing',
    integrationFit: ['Conduct AI'],
    status: 'waiting'
  },
  {
    id: 'kyc',
    name: 'Compliance evidence gate',
    borrowedFrom: 'Conducting KYC, SwarmSight, BioVault',
    action: 'Onboard a business or cite sensitive evidence.',
    evidence: 'Source-backed scorecard, permissioned memory, tipping-off firewall.',
    authorityLayer: 'regulated.customer_decision',
    capability: 'send.kyc.request_or_approve',
    integrationFit: ['Conduct AI'],
    status: 'waiting'
  },
  {
    id: 'memory',
    name: 'Permissioned memory gate',
    borrowedFrom: 'BioVault, MemtOS, Andex',
    action: 'Let an agent read a derived report without leaking its hidden sources.',
    evidence: 'Transitive source ACLs, revocation path, deterministic access log.',
    authorityLayer: 'evidence.permissioned_memory',
    capability: 'read.permissioned_memory',
    integrationFit: ['Conduct AI'],
    status: 'proof'
  },
  {
    id: 'tender',
    name: 'Tender commitment gate',
    borrowedFrom: 'Bidframe, Remedia, VendorVerdict',
    action: 'Submit a procurement answer or vendor-risk email.',
    evidence: 'Clause matrix, deal-breaker proof, legal and delivery owner approvals.',
    authorityLayer: 'commercial.external_commitment',
    capability: 'submit.procurement.response',
    integrationFit: ['Conduct AI', 'GCC & ETH'],
    status: 'waiting'
  },
  {
    id: 'clinical',
    name: 'Clinical eligibility gate',
    borrowedFrom: 'Trial matching, SwarmSight, BioVault',
    action: 'Match a patient or applicant to a high-stakes eligibility decision.',
    evidence: 'Criteria trace, missing-data escalation, human-review queue.',
    authorityLayer: 'regulated.customer_decision',
    capability: 'send.kyc.request_or_approve',
    integrationFit: ['Conduct AI'],
    status: 'waiting'
  },
  {
    id: 'field-safety',
    name: 'Field safety gate',
    borrowedFrom: '3D RAMS, Cadzilla, fall-prevention demo',
    action: 'Prepare a physical-world work pack or safety intervention.',
    evidence: 'Method statement, hazard controls, source freshness, supervisor sign-off.',
    authorityLayer: 'physical_world.dispatch',
    capability: 'dispatch.grid.flexibility',
    integrationFit: ['Conduct AI', 'GCC & ETH'],
    status: 'blocked'
  },
  {
    id: 'grid',
    name: 'Dispatch and settlement gate',
    borrowedFrom: 'Grid Balancer, BitHub',
    action: 'Dispatch flexibility or hand an objective to a market.',
    evidence: 'Telemetry, policy objective DAG, operator sign-off, receipt hash.',
    authorityLayer: 'physical_world.dispatch',
    capability: 'dispatch.grid.flexibility',
    integrationFit: ['GCC & ETH'],
    status: 'blocked'
  },
  {
    id: 'spend',
    name: 'Agent spend gate',
    borrowedFrom: 'CoralOS / STUK, OmniQuantAI, hybrid work market',
    action: 'Buy external model, research, audit, or verifier-agent work.',
    evidence: 'WANT/BID/AWARD ledger, budget lane, acceptance test, provenance, settlement receipt.',
    authorityLayer: 'agent_economy.spend',
    capability: 'pay.agent.vendor',
    integrationFit: ['CoralOS / STUK'],
    status: 'proof'
  },
  {
    id: 'grant-allocation',
    name: 'Public funding allocation gate',
    borrowedFrom: 'GCC',
    action: 'Allocate civic/public-good funding without optimising an easy-to-game proxy.',
    evidence: 'Rubric weights, counterfactual additionality, milestone schedule, appeal-ready record.',
    authorityLayer: 'public_capital.allocation',
    capability: 'allocate.public_funding',
    integrationFit: ['GCC & ETH'],
    status: 'proof'
  },
  {
    id: 'grant-milestone',
    name: 'Public grant milestone gate',
    borrowedFrom: 'GCC, CoralOS / STUK',
    action: 'Release a milestone payment only after an independent verifier agent checks evidence.',
    evidence: 'Source citation check, repo artifact hash, milestone acceptance test.',
    authorityLayer: 'public_capital.milestone_verification',
    capability: 'verify.public_grant_milestone',
    integrationFit: ['GCC & ETH', 'CoralOS / STUK'],
    status: 'proof'
  },
  {
    id: 'planning',
    name: 'Civic planning gate',
    borrowedFrom: 'PlanningOS, Civic Property Intelligence, BitHub',
    action: 'Recommend a planning, property, or public-good decision.',
    evidence: 'Policy maps, objective DAG, public source citations, appeal-ready record.',
    authorityLayer: 'public_governance.decision',
    capability: 'publish.governance.receipt',
    integrationFit: ['GCC & ETH'],
    status: 'proof'
  },
  {
    id: 'incident',
    name: 'Incident precedent gate',
    borrowedFrom: 'Precedent, MemtOS',
    action: 'Repeat a known admin-console fix and prepare rollback.',
    evidence: 'Runbook match, blast-radius check, human approval, rollback command.',
    authorityLayer: 'ops.incident_precedent',
    capability: 'run.ops.precedent_fix',
    integrationFit: ['Conduct AI'],
    status: 'proof'
  },
  {
    id: 'transformation',
    name: 'Transformation simulation gate',
    borrowedFrom: 'TransformAI, AI Impact Radar, Andex',
    action: 'Recommend the next enterprise AI rollout or org change.',
    evidence: 'Impact radar, scenario simulation, readiness score, owner map.',
    authorityLayer: 'strategy.transformation_decision',
    capability: 'publish.transformation_plan',
    integrationFit: ['Conduct AI'],
    status: 'proof'
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
    integrationHook: 'Conduct: safe work moves immediately'
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
    integrationHook: 'Conduct: business authority, not line count'
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
    integrationHook: 'Conduct: source-backed vendor evidence before tool access'
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
    integrationHook: 'Fetch: agent can explain action readiness'
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
    integrationHook: 'Conduct: enterprise trust boundary'
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
    integrationHook: 'GCC: transparent decision record'
  },
  {
    id: 'spend',
    action: 'External verifier agent selected',
    layer: 'agent_economy.spend',
    source: 'public-grant-verification-market.ledger.json',
    evidence: 'WANT/BID/AWARD ledger, budget lane, delivery proof, and acceptance test are attached.',
    evidenceKeys: ['budget_lane', 'acceptance_test', 'delivery_proof'],
    approvals: ['@finance'],
    gate: '@finance + acceptance proof + settlement receipt',
    capability: 'pay.agent.vendor',
    status: 'proof',
    integrationHook: 'CoralOS/STUK: agent work settles after verifier acceptance'
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
    integrationHook: 'GCC: real allocation decision, not a chat response'
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
    integrationHook: 'GCC/CoralOS: milestone verification becomes a paid agent service'
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
    integrationHook: 'Conduct: agent researches, human decides'
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
    title: 'Optional chain anchor prepared',
    body: 'ETH-style receipt rails receive the hash after authority passes; they do not decide authority.',
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
    title: 'Teaching signal recorded',
    body: 'The denied early release explains the missing owner and evidence so employees and future agents know the next safe step.',
    hash: 'lesson:missing-proof:money.pricing',
    tone: 'ok'
  },
  {
    id: 'gcc',
    title: 'Public funding allocation ready',
    body: 'Grant recommendations include rubric weights, counterfactuals, milestone gates, and appeal-ready public receipts.',
    hash: 'gcc:allocation:public-digital-commons',
    tone: 'ok'
  },
  {
    id: 'coral-stuk',
    title: 'Verifier agent economy receipt',
    body: 'WANT, BID, AWARD, DEPOSITED, DELIVERED, VERIFIED, and RELEASED states are hash-bound before payment release.',
    hash: 'coral:agent-economy:public-grant-verifier',
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
      'Ready for demo day. I act as the company-level agent: anyone can ask, but every high-stakes action routes to company authority, scoped capability release, and a teachable receipt.',
    tags: ['ready', 'company agent', 'teaching gates'],
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
    channelId: 'integrations-room',
    author: 'Mandate Agent',
    role: 'integration router',
    avatar: 'MA',
    time: '9:18 AM',
    kind: 'report',
    body:
      'Integration fit: Conduct gets controlled enterprise change; Fetch gets an action-readiness agent; CoralOS/STUK coordinates paid verifier work; GCC & ETH get transparent public-funding receipts.',
    tags: ['Conduct', 'Fetch.ai', 'CoralOS/STUK', 'GCC & ETH']
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
