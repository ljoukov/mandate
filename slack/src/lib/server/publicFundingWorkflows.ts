import { createHash } from 'node:crypto';

export type GrantMilestone = {
  id: string;
  label: string;
  dueInDays: number;
  evidenceRequired: string[];
  releasePercent: number;
};

export type GrantApplication = {
  id: string;
  applicant: string;
  askGbp: number;
  category: 'public-funding' | 'ai-for-good';
  summary: string;
  requestedAgentService: string;
  metrics: {
    beneficiaries: number;
    unitCostGbp: number;
    evidenceConfidence: number;
    baselineProbability: number;
    milestoneClarity: number;
    openSourceReuse: number;
    governanceTransparency: number;
    privacyRightsFit: number;
    deliveryRisk: number;
    vanityProxyRisk: number;
  };
  milestones: GrantMilestone[];
};

export type RubricMetric = {
  id: string;
  label: string;
  weight: number;
  whyItIsHardToGame: string;
};

export type FundingDecision = {
  rank: number;
  applicationId: string;
  applicant: string;
  status: 'fund' | 'reserve' | 'decline';
  score: number;
  recommendedAwardGbp: number;
  metricBreakdown: Record<string, number>;
  counterfactual: string;
  rationale: string[];
  milestoneGate: string;
  requiredApprovals: string[];
  receiptHash: string;
};

export type AgentBid = {
  agent: string;
  service: string;
  priceLamports: number;
  priceGbp: number;
  qualityScore: number;
  reputationScore: number;
  deliveryMinutes: number;
  evidence: string[];
};

export type AgentEconomyLedgerStep = {
  state: 'WANT' | 'BID' | 'AWARD' | 'DEPOSITED' | 'DELIVERED' | 'VERIFIED' | 'RELEASED';
  actor: string;
  message: string;
  receiptHash: string;
};

export type AgentEconomyWorkflow = {
  coralSession: {
    namespace: string;
    sessionId: string;
    thread: string;
    agents: string[];
  };
  want: {
    buyer: string;
    service: string;
    maxPriceLamports: number;
    acceptanceTest: string[];
  };
  bids: AgentBid[];
  award: {
    winner: string;
    reason: string;
    score: number;
  };
  escrow: {
    chain: 'solana:devnet';
    reference: string;
    amountLamports: number;
    releaseCapability: string;
    explorerHint: string;
  };
  ledger: AgentEconomyLedgerStep[];
};

export type PublicFundingAgentEconomyWorkflow = {
  generatedAt: string;
  publicBody: string;
  budgetGbp: number;
  gcc: {
    rubric: RubricMetric[];
    applications: GrantApplication[];
    decisions: FundingDecision[];
    allocationHash: string;
    reusableInterfaces: string[];
  };
  coralStuk: AgentEconomyWorkflow;
};

const DEFAULT_BUDGET_GBP = 120_000;

export const fundingRubric: RubricMetric[] = [
  {
    id: 'impact',
    label: 'Expected public-good impact',
    weight: 0.22,
    whyItIsHardToGame:
      'Uses beneficiary count, cost, evidence confidence, and delivery risk together instead of raw reach.'
  },
  {
    id: 'counterfactual',
    label: 'Counterfactual additionality',
    weight: 0.18,
    whyItIsHardToGame:
      'Rewards work unlikely to happen without the grant, so wealthy or already-funded teams cannot win on polish alone.'
  },
  {
    id: 'milestone',
    label: 'Milestone verifiability',
    weight: 0.16,
    whyItIsHardToGame:
      'Funds release only against concrete artifacts, tests, deployment proofs, or independent verification.'
  },
  {
    id: 'commons',
    label: 'Forkable digital commons',
    weight: 0.16,
    whyItIsHardToGame:
      'Scores permissive licenses, reusable interfaces, and documentation rather than one-off closed outputs.'
  },
  {
    id: 'governance',
    label: 'Transparency and appeal record',
    weight: 0.12,
    whyItIsHardToGame:
      'Requires public reasons, cited evidence, and an appeal-ready receipt for the decision.'
  },
  {
    id: 'rights',
    label: 'Privacy and civic-rights fit',
    weight: 0.1,
    whyItIsHardToGame:
      'Gates sensitive data use, access controls, and rights impact before a recommendation can become spend.'
  },
  {
    id: 'antiGaming',
    label: 'Anti-gaming adjustment',
    weight: 0.06,
    whyItIsHardToGame:
      'Penalises vanity metrics, vague milestones, and score inflation signals before final ranking.'
  }
];

export const grantApplications: GrantApplication[] = [
  {
    id: 'app-planning-commons',
    applicant: 'Open Planning Evidence Commons',
    askGbp: 72_000,
    category: 'public-funding',
    summary:
      'Open-source planning appeal evidence index for councils, with cited policies, precedents, and reusable review rubrics.',
    requestedAgentService:
      'Independent milestone verifier for policy citation coverage and appeal-record completeness.',
    metrics: {
      beneficiaries: 520_000,
      unitCostGbp: 0.14,
      evidenceConfidence: 0.82,
      baselineProbability: 0.28,
      milestoneClarity: 0.9,
      openSourceReuse: 0.95,
      governanceTransparency: 0.88,
      privacyRightsFit: 0.8,
      deliveryRisk: 0.22,
      vanityProxyRisk: 0.08
    },
    milestones: [
      {
        id: 'm1',
        label: 'Publish schema, policy-source connector, and sample authority pack',
        dueInDays: 30,
        evidenceRequired: ['repo_commit', 'schema_docs', 'source_license_table'],
        releasePercent: 35
      },
      {
        id: 'm2',
        label: 'Run replay on 250 public appeal decisions with citation coverage report',
        dueInDays: 65,
        evidenceRequired: ['replay_dataset_hash', 'coverage_report', 'error_review'],
        releasePercent: 40
      },
      {
        id: 'm3',
        label: 'Council handover pack and appeal-record API',
        dueInDays: 90,
        evidenceRequired: ['api_contract', 'handover_docs', 'public_receipt'],
        releasePercent: 25
      }
    ]
  },
  {
    id: 'app-rights-advice',
    applicant: 'Tenant Rights Access Lab',
    askGbp: 46_000,
    category: 'ai-for-good',
    summary:
      'Privacy-preserving access-to-information agent that helps tenants prepare evidence bundles without exposing personal data to model providers.',
    requestedAgentService:
      'Privacy and milestone verifier for deterministic retrieval access checks and redaction logs.',
    metrics: {
      beneficiaries: 85_000,
      unitCostGbp: 0.54,
      evidenceConfidence: 0.76,
      baselineProbability: 0.34,
      milestoneClarity: 0.82,
      openSourceReuse: 0.86,
      governanceTransparency: 0.72,
      privacyRightsFit: 0.94,
      deliveryRisk: 0.3,
      vanityProxyRisk: 0.12
    },
    milestones: [
      {
        id: 'm1',
        label: 'Permissioned retrieval prototype with redaction audit log',
        dueInDays: 28,
        evidenceRequired: ['acl_test_log', 'redaction_log', 'threat_model'],
        releasePercent: 45
      },
      {
        id: 'm2',
        label: 'Advice bundle workflow tested with public sample cases',
        dueInDays: 70,
        evidenceRequired: ['case_replay', 'model_context_hashes', 'review_notes'],
        releasePercent: 35
      },
      {
        id: 'm3',
        label: 'Forkable deployment guide for advice charities',
        dueInDays: 95,
        evidenceRequired: ['deployment_docs', 'operator_checklist', 'public_receipt'],
        releasePercent: 20
      }
    ]
  },
  {
    id: 'app-env-monitor',
    applicant: 'River Watch Commons',
    askGbp: 38_000,
    category: 'ai-for-good',
    summary:
      'Open environmental monitoring workflow that turns public river quality data into cited alerts and remediation milestone checks.',
    requestedAgentService:
      'Data quality agent for public source freshness, anomaly evidence, and milestone verification.',
    metrics: {
      beneficiaries: 140_000,
      unitCostGbp: 0.27,
      evidenceConfidence: 0.71,
      baselineProbability: 0.5,
      milestoneClarity: 0.78,
      openSourceReuse: 0.82,
      governanceTransparency: 0.84,
      privacyRightsFit: 0.88,
      deliveryRisk: 0.34,
      vanityProxyRisk: 0.18
    },
    milestones: [
      {
        id: 'm1',
        label: 'Public data ingestion and freshness report',
        dueInDays: 25,
        evidenceRequired: ['source_registry', 'freshness_report', 'data_quality_tests'],
        releasePercent: 35
      },
      {
        id: 'm2',
        label: 'Cited alert workflow and false-positive review',
        dueInDays: 60,
        evidenceRequired: ['alert_replay', 'false_positive_review', 'operator_signoff'],
        releasePercent: 40
      },
      {
        id: 'm3',
        label: 'Reusable remediation milestone template',
        dueInDays: 85,
        evidenceRequired: ['template_docs', 'public_receipt', 'handover_notes'],
        releasePercent: 25
      }
    ]
  },
  {
    id: 'app-reach-dashboard',
    applicant: 'Civic Reach Dashboard',
    askGbp: 55_000,
    category: 'public-funding',
    summary:
      'Dashboard promising high social-media reach for civic campaigns, with unclear downstream impact and weak milestone evidence.',
    requestedAgentService:
      'Marketing metric agent for public engagement reporting.',
    metrics: {
      beneficiaries: 1_800_000,
      unitCostGbp: 0.03,
      evidenceConfidence: 0.38,
      baselineProbability: 0.72,
      milestoneClarity: 0.42,
      openSourceReuse: 0.35,
      governanceTransparency: 0.5,
      privacyRightsFit: 0.55,
      deliveryRisk: 0.48,
      vanityProxyRisk: 0.8
    },
    milestones: [
      {
        id: 'm1',
        label: 'Launch dashboard and audience report',
        dueInDays: 45,
        evidenceRequired: ['traffic_report'],
        releasePercent: 60
      },
      {
        id: 'm2',
        label: 'Publish final engagement summary',
        dueInDays: 90,
        evidenceRequired: ['engagement_summary'],
        releasePercent: 40
      }
    ]
  }
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function hashJson(value: unknown) {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function impactValue(application: GrantApplication) {
  const { beneficiaries, unitCostGbp, evidenceConfidence, deliveryRisk } = application.metrics;
  const costEfficiency = Math.sqrt(Math.max(1, beneficiaries) / Math.max(0.01, unitCostGbp));
  return costEfficiency * evidenceConfidence * (1 - deliveryRisk);
}

function scoreApplication(application: GrantApplication, maxImpact: number) {
  const metrics = application.metrics;
  const impact = clampScore((impactValue(application) / maxImpact) * 100);
  const counterfactual = clampScore((1 - metrics.baselineProbability) * 100);
  const milestone = clampScore(metrics.milestoneClarity * 100);
  const commons = clampScore(metrics.openSourceReuse * 100);
  const governance = clampScore(metrics.governanceTransparency * 100);
  const rights = clampScore(metrics.privacyRightsFit * 100);
  const antiGaming = clampScore((1 - metrics.vanityProxyRisk) * 100);
  const riskPenalty = metrics.deliveryRisk * 12 + Math.max(0, metrics.vanityProxyRisk - 0.45) * 22;
  const weighted =
    impact * 0.22 +
    counterfactual * 0.18 +
    milestone * 0.16 +
    commons * 0.16 +
    governance * 0.12 +
    rights * 0.1 +
    antiGaming * 0.06 -
    riskPenalty;

  return {
    score: clampScore(weighted),
    breakdown: {
      impact: Math.round(impact),
      counterfactual: Math.round(counterfactual),
      milestone: Math.round(milestone),
      commons: Math.round(commons),
      governance: Math.round(governance),
      rights: Math.round(rights),
      antiGaming: Math.round(antiGaming)
    }
  };
}

function decisionStatus(score: number, rank: number, askGbp: number, remainingBudget: number) {
  if (score < 60) return 'decline' as const;
  if (rank <= 2 && askGbp <= remainingBudget) return 'fund' as const;
  return 'reserve' as const;
}

function buildRationale(application: GrantApplication, score: number) {
  const rationale = [
    `Expected impact is adjusted by evidence confidence (${Math.round(
      application.metrics.evidenceConfidence * 100
    )}%) and delivery risk (${Math.round(application.metrics.deliveryRisk * 100)}%).`,
    `Counterfactual score uses baseline probability ${Math.round(
      application.metrics.baselineProbability * 100
    )}%, not the applicant's claimed reach.`,
    `Milestone release is tied to ${application.milestones
      .flatMap((milestone) => milestone.evidenceRequired)
      .slice(0, 4)
      .join(', ')}.`
  ];

  if (application.metrics.vanityProxyRisk > 0.45) {
    rationale.push('Vanity proxy risk is high, so the allocation engine applies a penalty.');
  }

  if (score >= 75) {
    rationale.push('Reusable public-good output and auditability are strong enough for funding.');
  }

  return rationale;
}

export function buildFundingWorkflow(options: { budgetGbp?: number } = {}) {
  const budgetGbp = options.budgetGbp ?? DEFAULT_BUDGET_GBP;
  const maxImpact = Math.max(...grantApplications.map(impactValue));
  const scored = grantApplications
    .map((application) => {
      const { score, breakdown } = scoreApplication(application, maxImpact);
      return { application, score, breakdown };
    })
    .sort((a, b) => b.score - a.score);

  let remainingBudget = budgetGbp;
  const decisions: FundingDecision[] = scored.map((entry, index) => {
    const rank = index + 1;
    const status = decisionStatus(entry.score, rank, entry.application.askGbp, remainingBudget);
    const recommendedAwardGbp =
      status === 'fund'
        ? Math.min(entry.application.askGbp, remainingBudget)
        : status === 'reserve'
          ? Math.min(entry.application.askGbp, Math.max(0, remainingBudget))
          : 0;

    if (status === 'fund') {
      remainingBudget -= recommendedAwardGbp;
    }

    const milestoneGate = entry.application.milestones
      .map((milestone) => `${milestone.releasePercent}% after ${milestone.label}`)
      .join(' | ');
    const decisionPayload = {
      applicationId: entry.application.id,
      score: Number(entry.score.toFixed(2)),
      status,
      recommendedAwardGbp,
      milestoneIds: entry.application.milestones.map((milestone) => milestone.id)
    };

    return {
      rank,
      applicationId: entry.application.id,
      applicant: entry.application.applicant,
      status,
      score: Number(entry.score.toFixed(2)),
      recommendedAwardGbp,
      metricBreakdown: entry.breakdown,
      counterfactual: `Baseline probability ${Math.round(
        entry.application.metrics.baselineProbability * 100
      )}% means additionality score ${entry.breakdown.counterfactual}/100.`,
      rationale: buildRationale(entry.application, entry.score),
      milestoneGate,
      requiredApprovals:
        status === 'fund'
          ? ['@programme-owner', '@finance', '@public-audit']
          : ['@programme-owner'],
      receiptHash: hashJson(decisionPayload)
    };
  });

  const allocationHash = hashJson({
    budgetGbp,
    rubric: fundingRubric.map(({ id, weight }) => ({ id, weight })),
    decisions: decisions.map(({ applicationId, status, recommendedAwardGbp, receiptHash }) => ({
      applicationId,
      status,
      recommendedAwardGbp,
      receiptHash
    }))
  });

  return {
    rubric: fundingRubric,
    applications: grantApplications,
    decisions,
    allocationHash,
    reusableInterfaces: [
      'POST /api/public-funding/agent-economy with budgetGbp to recalculate the grant portfolio',
      'FundingDecision.receiptHash for appeal-ready public receipts',
      'GrantMilestone.evidenceRequired for modular milestone verification',
      'AgentEconomyWorkflow.ledger for CoralOS-style WANT to RELEASED settlement records'
    ]
  };
}

function scoreBid(bid: AgentBid, maxPriceLamports: number) {
  const priceScore = clampScore((1 - bid.priceLamports / maxPriceLamports) * 100);
  return Number(
    (bid.qualityScore * 0.4 + bid.reputationScore * 0.25 + priceScore * 0.2 + (100 - bid.deliveryMinutes) * 0.15).toFixed(2)
  );
}

export function buildAgentEconomyWorkflow(fundingWorkflow = buildFundingWorkflow()): AgentEconomyWorkflow {
  const funded = fundingWorkflow.decisions.find((decision) => decision.status === 'fund');
  const service =
    funded?.applicant ??
    'Open Planning Evidence Commons';
  const maxPriceLamports = 35_000_000;
  const bids: AgentBid[] = [
    {
      agent: 'milestone-verifier-premium',
      service: 'Independent grant milestone verification',
      priceLamports: 27_500_000,
      priceGbp: 26.5,
      qualityScore: 92,
      reputationScore: 88,
      deliveryMinutes: 42,
      evidence: ['source_citation_check', 'repo_artifact_hash', 'milestone_acceptance_test']
    },
    {
      agent: 'impact-rubric-fast',
      service: 'Impact and counterfactual review',
      priceLamports: 18_000_000,
      priceGbp: 17.4,
      qualityScore: 78,
      reputationScore: 73,
      deliveryMinutes: 28,
      evidence: ['rubric_score_replay', 'counterfactual_note']
    },
    {
      agent: 'audit-pack-budget',
      service: 'Public receipt pack generation',
      priceLamports: 12_500_000,
      priceGbp: 12.1,
      qualityScore: 68,
      reputationScore: 66,
      deliveryMinutes: 18,
      evidence: ['receipt_template', 'appeal_record_outline']
    }
  ];
  const scoredBids = bids.map((bid) => ({ bid, score: scoreBid(bid, maxPriceLamports) }));
  const winner = scoredBids.sort((a, b) => b.score - a.score)[0];
  const deliveryHash = hashJson({
    service,
    winner: winner.bid.agent,
    evidence: winner.bid.evidence,
    allocationHash: fundingWorkflow.allocationHash
  });
  const reference = createHash('sha256')
    .update(`${winner.bid.agent}:${service}:${deliveryHash}`)
    .digest('hex')
    .slice(0, 32);
  const awardReason =
    'Highest combined quality, reputation, evidence coverage, and price-fit score under the Mandate budget cap.';

  const ledger: AgentEconomyLedgerStep[] = [
    {
      state: 'WANT',
      actor: 'mandate-public-authority-buyer',
      message: `Need milestone verification for ${service}; budget cap ${maxPriceLamports} lamports; acceptance test requires cited evidence and delivery hash.`,
      receiptHash: hashJson({ state: 'WANT', service, maxPriceLamports })
    },
    ...bids.map((bid) => ({
      state: 'BID' as const,
      actor: bid.agent,
      message: `${bid.service} for ${bid.priceLamports} lamports with evidence ${bid.evidence.join(', ')}.`,
      receiptHash: hashJson({ state: 'BID', bid })
    })),
    {
      state: 'AWARD',
      actor: 'mandate-public-authority-buyer',
      message: `Awarded to ${winner.bid.agent}. ${awardReason}`,
      receiptHash: hashJson({ state: 'AWARD', winner: winner.bid.agent, score: winner.score })
    },
    {
      state: 'DEPOSITED',
      actor: 'mandate-solana-escrow-adapter',
      message: `Prepared devnet escrow reference ${reference}; funds release is still gated by Mandate capability pay.agent.vendor.`,
      receiptHash: hashJson({ state: 'DEPOSITED', reference, amountLamports: winner.bid.priceLamports })
    },
    {
      state: 'DELIVERED',
      actor: winner.bid.agent,
      message: `Delivered verification bundle hash-bound to ${deliveryHash}.`,
      receiptHash: deliveryHash
    },
    {
      state: 'VERIFIED',
      actor: 'mandate-independent-verifier',
      message:
        'Verifier passed cited evidence, milestone acceptance tests, and public receipt completeness.',
      receiptHash: hashJson({ state: 'VERIFIED', deliveryHash, passed: true })
    },
    {
      state: 'RELEASED',
      actor: 'mandate-capability-gate',
      message:
        'Released pay.agent.vendor only after budget lane, acceptance test, delivery proof, and finance approval.',
      receiptHash: hashJson({ state: 'RELEASED', capability: 'pay.agent.vendor', deliveryHash })
    }
  ];

  return {
    coralSession: {
      namespace: 'mandate-public-funding',
      sessionId: `gcc-agent-economy-${reference.slice(0, 8)}`,
      thread: 'public-grant-verification-market',
      agents: [
        'mandate-public-authority-buyer',
        ...bids.map((bid) => bid.agent),
        'mandate-independent-verifier'
      ]
    },
    want: {
      buyer: 'mandate-public-authority-buyer',
      service: `Verify first milestone evidence for ${service}`,
      maxPriceLamports,
      acceptanceTest: ['budget_lane', 'acceptance_test', 'delivery_proof', 'public_receipt']
    },
    bids,
    award: {
      winner: winner.bid.agent,
      reason: awardReason,
      score: winner.score
    },
    escrow: {
      chain: 'solana:devnet',
      reference,
      amountLamports: winner.bid.priceLamports,
      releaseCapability: 'pay.agent.vendor',
      explorerHint: 'https://explorer.solana.com/?cluster=devnet'
    },
    ledger
  };
}

export function buildPublicFundingAgentEconomyWorkflow(
  options: { budgetGbp?: number } = {}
): PublicFundingAgentEconomyWorkflow {
  const fundingWorkflow = buildFundingWorkflow(options);
  return {
    generatedAt: new Date().toISOString(),
    publicBody: 'UK Public Digital Commons Fund',
    budgetGbp: options.budgetGbp ?? DEFAULT_BUDGET_GBP,
    gcc: fundingWorkflow,
    coralStuk: buildAgentEconomyWorkflow(fundingWorkflow)
  };
}
