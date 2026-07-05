<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ArrowLeft,
    BadgeCheck,
    Check,
    CircuitBoard,
    Clock3,
    FileCheck2,
    KeyRound,
    LockKeyhole,
    Network,
    RadioTower,
    Route,
    ShieldCheck,
    X
  } from '@lucide/svelte';
  import {
    authorityFindings,
    evidenceShots,
    product,
    receipts,
    type AuthorityFinding
  } from '$lib/demoData';

  type FundingDecision = {
    rank: number;
    applicant: string;
    status: 'fund' | 'reserve' | 'decline';
    score: number;
    recommendedAwardGbp: number;
    counterfactual: string;
    receiptHash: string;
  };

  type AgentLedgerStep = {
    state: string;
    actor: string;
    message: string;
    receiptHash: string;
  };

  type PublicFundingFlow = {
    publicBody: string;
    budgetGbp: number;
    gcc: {
      allocationHash: string;
      decisions: FundingDecision[];
      reusableInterfaces: string[];
    };
    verifierProcurement: {
      coralSession: {
        sessionId: string;
        agents: string[];
      };
      award: {
        winner: string;
        reason: string;
        score: number;
      };
      escrow: {
        chain: string;
        reference: string;
        amountLamports: number;
        releaseCapability: string;
      };
      ledger: AgentLedgerStep[];
    };
  };

  let released: Record<string, string> = {
    perf: 'Capability released: scoped merge command, 300s TTL'
  };
  let pending: Record<string, boolean> = {};
  let errors: Record<string, string> = {};
  let receiptRail = 'local';
  let fundingFlow: PublicFundingFlow | null = null;
  let fundingLoading = true;
  let fundingError = '';
  let fundingReleasePending: Record<string, boolean> = {};
  let fundingReleaseNotes: Record<string, string> = {};

  $: releasedCount = authorityFindings.filter((finding) => finding.status === 'released').length;
  $: waitingCount = authorityFindings.filter((finding) => finding.status === 'waiting').length;
  $: blockedCount = authorityFindings.filter((finding) => finding.status === 'blocked').length;
  $: proofCount = authorityFindings.filter((finding) => finding.status === 'proof').length;

  function statusLabel(status: AuthorityFinding['status']) {
    if (status === 'released') return 'released';
    if (status === 'proof') return 'proof ready';
    if (status === 'blocked') return 'blocked';
    return 'waiting';
  }

  async function loadFundingFlow() {
    fundingLoading = true;
    fundingError = '';

    try {
      const response = await fetch('/api/public-funding/verifier-procurement');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Could not load grant workflow.');
      }

      fundingFlow = payload as PublicFundingFlow;
    } catch (error) {
      fundingError = error instanceof Error ? error.message : 'Could not load grant workflow.';
    } finally {
      fundingLoading = false;
    }
  }

  async function releaseFundingCapability(
    id: string,
    capability: string,
    approvals: string[],
    evidenceKeys: string[],
    rail = receiptRail
  ) {
    fundingReleasePending = { ...fundingReleasePending, [id]: true };
    fundingReleaseNotes = { ...fundingReleaseNotes, [id]: '' };

    try {
      const response = await fetch('/api/capability/release', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability,
          dryRun: true,
          status: 'proof',
          approvals,
          evidenceKeys,
          receiptRail: rail
        })
      });
      const receipt = await response.json();

      if (!response.ok) {
        throw new Error(receipt.message || `Capability ${capability} was not released.`);
      }

      fundingReleaseNotes = {
        ...fundingReleaseNotes,
        [id]: `Release recorded in the audit log for ${receipt.capability}.`
      };
    } catch (error) {
      fundingReleaseNotes = {
        ...fundingReleaseNotes,
        [id]: error instanceof Error ? error.message : 'Capability release failed.'
      };
    } finally {
      fundingReleasePending = { ...fundingReleasePending, [id]: false };
    }
  }

  function releaseGccAllocation() {
    return releaseFundingCapability(
      'gcc-allocation',
      'allocate.public_funding',
      ['@programme-owner', '@finance', '@public-audit'],
      ['public_sources', 'rubric_weights', 'counterfactual_analysis', 'milestone_plan', 'appeal_record'],
      'ethereum:eas'
    );
  }

  function releaseVerifierPayment(flow: PublicFundingFlow) {
    return releaseFundingCapability(
      'coral-payment',
      flow.verifierProcurement.escrow.releaseCapability,
      ['@finance'],
      ['budget_lane', 'acceptance_test', 'delivery_proof'],
      'solana:devnet'
    );
  }

  async function releaseCapability(finding: AuthorityFinding) {
    if (finding.capability === 'none' || finding.status === 'blocked') return;
    pending = { ...pending, [finding.id]: true };
    errors = { ...errors, [finding.id]: '' };

    try {
      const response = await fetch('/api/capability/release', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability: finding.capability,
          dryRun: true,
          status: finding.status,
          approvals: finding.approvals,
          evidenceKeys: finding.evidenceKeys,
          prNumber: finding.prNumber,
          targetRepo: 'yavol/fast-tax',
          receiptRail
        })
      });
      const receipt = await response.json();

      if (!response.ok) {
        throw new Error(receipt.message || `Capability ${finding.capability} was not released.`);
      }

      released = {
        ...released,
        [finding.id]: `Release recorded in the audit log for ${receipt.capability}.`
      };
    } catch (error) {
      errors = {
        ...errors,
        [finding.id]: error instanceof Error ? error.message : 'Capability release failed.'
      };
    } finally {
      pending = { ...pending, [finding.id]: false };
    }
  }

  onMount(() => {
    void loadFundingFlow();
  });
</script>

<svelte:head>
  <title>{product.name} Control Room</title>
</svelte:head>

<main class="control-room">
  <aside class="rail" aria-label="Mandate navigation">
    <a class="back-link" href="/">
      <ArrowLeft size={16} />
      Slack
    </a>

    <div class="brand-mark">
      <ShieldCheck size={26} />
    </div>

    <div class="brand-copy">
      <strong>{product.name}</strong>
    </div>

    <nav>
      <a class="active" href="/dashboard">
        <RadioTower size={17} />
        Control room
      </a>
      <a href="/dashboard">
        <Network size={17} />
        Policies
      </a>
      <a href="/dashboard">
        <FileCheck2 size={17} />
        Receipts
      </a>
    </nav>

    <section class="rail-note">
      <p>Agents propose. Mandate grants authority only after evidence, owners, and capability gates pass.</p>
    </section>
  </aside>

  <section class="content">
    <header class="hero">
      <div>
        <p class="eyebrow">FastTax production</p>
        <h1>Authority control room</h1>
        <p class="subtitle">Open governed actions, missing evidence, accountable owners, and release receipts.</p>
      </div>
      <div class="hero-panel">
        <RadioTower size={22} />
        <div>
          <strong>Launch readiness run</strong>
          <p>Pricing, provider fallback, protected tests, procurement, and grant operations are under review.</p>
        </div>
      </div>
    </header>

    <section class="scoreboard" aria-label="Authority summary">
      <article>
        <strong>{releasedCount}</strong>
        <span>released</span>
      </article>
      <article>
        <strong>{proofCount}</strong>
        <span>proof ready</span>
      </article>
      <article>
        <strong>{waitingCount}</strong>
        <span>waiting</span>
      </article>
      <article>
        <strong>{blockedCount}</strong>
        <span>blocked</span>
      </article>
    </section>

    <section class="funding-band" aria-label="Public funding and verifier work">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Public grant operations</p>
          <h2>Funding decisions can buy independent verifier work.</h2>
        </div>
        <button class="secondary-action" type="button" on:click={loadFundingFlow}>
          <Route size={15} />
          {fundingLoading ? 'loading' : 'refresh'}
        </button>
      </div>

      {#if fundingError}
        <p class="release-error">{fundingError}</p>
      {:else if fundingFlow}
        <div class="funding-grid">
          <article class="funding-card gcc-card">
            <div class="funding-card-head">
              <div>
                <span>Public capital</span>
                <h3>{fundingFlow.publicBody}</h3>
              </div>
              <strong>£{fundingFlow.budgetGbp.toLocaleString()}</strong>
            </div>

            <div class="decision-table" aria-label="Public funding decisions">
              {#each fundingFlow.gcc.decisions.slice(0, 4) as decision}
                <div class={`decision-row ${decision.status}`}>
                  <span>#{decision.rank}</span>
                  <strong>{decision.applicant}</strong>
                  <small>{decision.score}/100</small>
                  <em>£{decision.recommendedAwardGbp.toLocaleString()}</em>
                  <code>{decision.status}</code>
                </div>
              {/each}
            </div>

            <p>{fundingFlow.gcc.decisions[0]?.counterfactual}</p>
            <code>{fundingFlow.gcc.allocationHash}</code>

            <button
              type="button"
              on:click={releaseGccAllocation}
            >
              {#if fundingReleasePending['gcc-allocation']}
                <Clock3 size={15} />
                checking
              {:else}
                <Check size={15} />
                release allocation receipt
              {/if}
            </button>

            {#if fundingReleaseNotes['gcc-allocation']}
              <p class="release-note">{fundingReleaseNotes['gcc-allocation']}</p>
            {/if}
          </article>

          <article class="funding-card coral-card">
            <div class="funding-card-head">
              <div>
                <span>External verification</span>
                <h3>{fundingFlow.verifierProcurement.award.winner}</h3>
              </div>
              <strong>{fundingFlow.verifierProcurement.award.score}</strong>
            </div>

            <div class="agent-session">
              <span>{fundingFlow.verifierProcurement.coralSession.sessionId}</span>
              <small>{fundingFlow.verifierProcurement.coralSession.agents.length} reviewers</small>
            </div>

            <div class="ledger-strip" aria-label="Verifier work state ledger">
              {#each fundingFlow.verifierProcurement.ledger as step}
                <div>
                  <strong>{step.state}</strong>
                  <span>{step.actor}</span>
                </div>
              {/each}
            </div>

            <p>{fundingFlow.verifierProcurement.award.reason}</p>
            <code>{fundingFlow.verifierProcurement.escrow.reference}</code>

            <button
              type="button"
              on:click={() => fundingFlow && releaseVerifierPayment(fundingFlow)}
            >
              {#if fundingReleasePending['coral-payment']}
                <Clock3 size={15} />
                checking
              {:else}
                <Check size={15} />
                release verifier payment
              {/if}
            </button>

            {#if fundingReleaseNotes['coral-payment']}
              <p class="release-note">{fundingReleaseNotes['coral-payment']}</p>
            {/if}
          </article>
        </div>
      {:else}
        <p class="loading-line">Loading grant workflow...</p>
      {/if}
    </section>

    <section class="workflow">
      <div class="workflow-card">
        <p class="eyebrow">Current request</p>
        <h2>{product.requestTemplate}</h2>
        <div class="flow">
          <span>request</span>
          <Route size={15} />
          <span>evidence</span>
          <Route size={15} />
          <span>policy</span>
          <Route size={15} />
          <span>capability</span>
          <Route size={15} />
          <span>audit log</span>
        </div>
      </div>

      <div class="split-card">
        <p class="eyebrow">Action split</p>
        <ol>
          <li>Safe PR: OCR performance optimization can land now.</li>
          <li>Pricing PR: waits for finance, product, and replay proof.</li>
          <li>Provider PR: waits for privacy, security, and retention proof.</li>
          <li>Eval PR: threshold change ships only if metric gates hold.</li>
          <li>Blocked PR: restore the paid-customer test oracle.</li>
          <li>Tender action: legal and delivery approve before submission.</li>
          <li>Verifier payment: budget, acceptance proof, and settlement receipt before payment.</li>
          <li>KYC outreach: source-backed scorecard waits for compliance review.</li>
        </ol>
      </div>
    </section>

    <section class="findings" aria-label="Authority peel">
      {#each authorityFindings as finding}
        <article class={`finding ${finding.status}`}>
          <div class="finding-head">
            <span>{finding.layer}</span>
            <strong>{statusLabel(finding.status)}</strong>
          </div>

          <h3>{finding.action}</h3>
          <p>{finding.evidence}</p>
          <code>{finding.source}</code>

          <div class="gate-row">
            <span>{finding.gate}</span>
            <span>{finding.integrationHook}</span>
          </div>

          <div class="capability-row">
            <div>
              <KeyRound size={15} />
              <span>{finding.capability}</span>
            </div>
            {#if finding.status === 'blocked'}
              <button class="blocked-action" type="button">
                <X size={15} />
                no release
              </button>
            {:else if released[finding.id]}
              <button class="released-action" type="button">
                <BadgeCheck size={15} />
                receipt
              </button>
            {:else}
              <button type="button" on:click={() => releaseCapability(finding)}>
                {#if pending[finding.id]}
                  <Clock3 size={15} />
                  releasing
                {:else}
                  <Check size={15} />
                  {finding.status === 'waiting' ? 'try release' : 'release'}
                {/if}
              </button>
            {/if}
          </div>

          {#if released[finding.id]}
            <p class="release-note">{released[finding.id]}</p>
          {/if}

          {#if errors[finding.id]}
            <p class="release-error">{errors[finding.id]}</p>
          {/if}
        </article>
      {/each}
    </section>
  </section>

  <aside class="activity" aria-label="Plugins and receipts">
    <section>
      <div class="section-head">
        <p class="eyebrow">Evidence review</p>
        <h2>Required controls</h2>
      </div>
      <div class="shot-list">
        {#each evidenceShots as shot}
          <article class={`shot ${shot.tone}`}>
            <div>
              <strong>{shot.title}</strong>
              <span>{shot.source}</span>
            </div>
            <p>{shot.caption}</p>
            <ul>
              {#each shot.rows as row}
                <li>{row}</li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    </section>

    <section>
      <div class="section-head">
        <p class="eyebrow">Audit receipts</p>
        <h2>Proof after action</h2>
      </div>
      <div class="receipt-list">
        {#each receipts as receipt}
          <article class={`receipt ${receipt.tone}`}>
            <CircuitBoard size={16} />
            <div>
              <strong>{receipt.title}</strong>
              <p>{receipt.body}</p>
              <code>{receipt.hash}</code>
            </div>
          </article>
        {/each}
      </div>
    </section>

  </aside>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    height: 100%;
    overflow: hidden;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    background:
      linear-gradient(90deg, rgba(19, 36, 28, 0.05) 1px, transparent 1px),
      linear-gradient(0deg, rgba(19, 36, 28, 0.05) 1px, transparent 1px),
      #eee4d0;
    background-size: 30px 30px;
    color: #171b17;
    font-family:
      ui-serif,
      Georgia,
      Cambria,
      'Times New Roman',
      serif;
  }

  :global(button) {
    font: inherit;
    cursor: pointer;
  }

  .control-room {
    display: grid;
    grid-template-columns: 238px minmax(0, 1fr) 385px;
    width: 100%;
    max-width: 100vw;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .rail,
  .activity {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 18px;
    background: #17211b;
    color: #f7edd8;
  }

  .back-link,
  .rail nav a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.86rem;
    font-weight: 900;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    background: #e8aa30;
    color: #151a16;
    box-shadow: inset 0 -5px rgba(0, 0, 0, 0.18);
  }

  .brand-copy {
    display: grid;
    gap: 4px;
  }

  .brand-copy strong {
    font-size: 1.65rem;
    line-height: 1;
  }

  .brand-copy span,
  .rail-note,
  .subtitle,
  .hero-panel p,
  .finding p,
  .receipt p,
  .split-card li {
    color: #6a6256;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.88rem;
    line-height: 1.4;
  }

  .brand-copy span,
  .rail-note {
    color: rgba(247, 237, 216, 0.72);
  }

  .rail nav {
    display: grid;
    gap: 8px;
  }

  .rail nav a {
    min-height: 38px;
    border-radius: 8px;
    color: #e9ddc8;
    padding: 0 10px;
  }

  .rail nav a.active {
    background: rgba(255, 255, 255, 0.1);
  }

  .rail-note {
    margin-top: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 16px;
  }

  .rail-note p,
  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  .content {
    min-width: 0;
    max-width: 100vw;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 28px;
    scrollbar-gutter: stable;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    min-width: 0;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0 0 6px;
    color: #80643e;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(2.9rem, 7vw, 6rem);
    letter-spacing: 0;
    line-height: 0.9;
  }

  h2 {
    font-size: 1.35rem;
    line-height: 1.05;
  }

  h3 {
    font-size: 1rem;
    line-height: 1.12;
  }

  .subtitle {
    margin-top: 10px;
    max-width: 720px;
    color: #4f4a41;
    font-size: 1rem;
  }

  .hero-panel {
    display: flex;
    gap: 12px;
    min-width: 0;
    width: min(390px, 38%);
    border: 1px solid #c6b390;
    border-radius: 8px;
    background: #fff7e8;
    padding: 13px;
  }

  .hero-panel > div {
    min-width: 0;
  }

  .secondary-action,
  .funding-card span,
  .funding-card small,
  .funding-card code,
  .decision-row,
  .agent-session,
  .ledger-strip,
  .shot span,
  .shot li {
    font-family:
      ui-sans-serif,
      system-ui,
    sans-serif;
  }

  .hero-panel strong,
  .scoreboard strong,
  .receipt strong,
  .finding-head,
  .gate-row,
  .capability-row,
  .flow {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .scoreboard {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 11px;
    margin-bottom: 14px;
  }

  .scoreboard article {
    display: grid;
    gap: 2px;
    min-height: 75px;
    border: 1px solid #c8b696;
    border-radius: 8px;
    background: #fbf1df;
    padding: 12px;
  }

  .scoreboard strong {
    font-size: 2rem;
    line-height: 1;
  }

  .scoreboard span {
    color: #6a5a44;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .workflow {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }

  .funding-band {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
    border: 1px solid #b9c6a1;
    border-radius: 8px;
    background: #f8fbef;
    padding: 14px;
  }

  .secondary-action {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    border: 1px solid #c9b797;
    border-radius: 8px;
    background: #fffdf7;
    color: #2a4f3c;
    font-size: 0.76rem;
    font-weight: 950;
    padding: 0 10px;
    text-transform: uppercase;
  }

  .funding-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .funding-card {
    display: grid;
    align-content: start;
    gap: 11px;
    min-width: 0;
    border: 1px solid #c7d2b1;
    border-radius: 8px;
    background: #fffef8;
    padding: 13px;
  }

  .gcc-card {
    border-top: 5px solid #365f46;
  }

  .coral-card {
    border-top: 5px solid #7b5cb7;
  }

  .funding-card-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 14px;
  }

  .funding-card-head > div,
  .funding-card p,
  .funding-card code {
    min-width: 0;
  }

  .funding-card-head span,
  .agent-session span {
    color: #6a734b;
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .funding-card-head strong {
    color: #263b2d;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 1.05rem;
    font-weight: 950;
    white-space: nowrap;
  }

  .funding-card p,
  .loading-line {
    color: #5e6155;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.84rem;
    line-height: 1.36;
  }

  .funding-card code {
    overflow: hidden;
    color: #345c47;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .decision-table {
    display: grid;
    gap: 6px;
  }

  .decision-row {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 62px 72px 70px;
    align-items: center;
    gap: 7px;
    min-width: 0;
    border: 1px solid #d8dfc9;
    border-radius: 8px;
    background: #fbfff2;
    padding: 7px;
  }

  .decision-row.reserve {
    background: #fff8e8;
  }

  .decision-row.decline {
    background: #fff0ed;
  }

  .decision-row span,
  .decision-row small,
  .decision-row em,
  .decision-row code {
    min-width: 0;
    overflow: hidden;
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .decision-row strong {
    min-width: 0;
    overflow: hidden;
    color: #22392b;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .decision-row code {
    justify-self: end;
    border-radius: 999px;
    background: #e7efda;
    color: #2d573b;
    padding: 3px 6px;
  }

  .decision-row.decline code {
    background: #f2d6d0;
    color: #7f2f24;
  }

  .agent-session {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #ded7ed;
    border-radius: 8px;
    background: #fbf8ff;
    padding: 8px 10px;
  }

  .agent-session span,
  .agent-session small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ledger-strip {
    display: grid;
    gap: 6px;
  }

  .ledger-strip div {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    min-height: 30px;
    border: 1px solid #ded7ed;
    border-radius: 8px;
    background: #faf7ff;
    padding: 6px 8px;
  }

  .ledger-strip strong {
    color: #4f3e86;
    font-size: 0.72rem;
    line-height: 1.05;
  }

  .ledger-strip span {
    overflow: hidden;
    color: #665b79;
    font-size: 0.65rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .funding-card button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: fit-content;
    min-height: 34px;
    border: 0;
    border-radius: 8px;
    background: #1f4935;
    color: #fff8ea;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 950;
    padding: 0 11px;
  }

  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
  }

  .workflow-card,
  .split-card,
  .finding,
  .receipt {
    border: 1px solid #cfbd9e;
    border-radius: 8px;
    background: #fff8ea;
  }

  .finding-head strong {
    border-radius: 999px;
    background: #e7dbc5;
    color: #5d4930;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.68rem;
    font-weight: 950;
    padding: 4px 7px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .workflow {
    grid-template-columns: 1fr minmax(300px, 0.44fr);
  }

  .workflow-card,
  .split-card {
    padding: 15px;
  }

  .workflow-card h2 {
    font-size: 1.65rem;
    max-width: 760px;
  }

  .flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
  }

  .flow span {
    border: 1px solid #cfbd9e;
    border-radius: 999px;
    background: #f2e6d0;
    color: #4d4336;
    font-size: 0.78rem;
    font-weight: 900;
    padding: 6px 9px;
  }

  .split-card ol {
    margin: 0;
    padding-left: 21px;
  }

  .findings {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
  }

  .finding {
    display: grid;
    gap: 9px;
    min-width: 0;
    border-left-width: 5px;
    padding: 13px;
  }

  .finding.released {
    border-left-color: #2f684d;
  }

  .finding.proof {
    border-left-color: #2d7770;
  }

  .finding.waiting {
    border-left-color: #b5652a;
  }

  .finding.blocked {
    border-left-color: #af3d37;
  }

  .finding-head,
  .gate-row,
  .capability-row,
  .capability-row div,
  .receipt {
    display: flex;
    align-items: center;
  }

  .finding-head {
    min-width: 0;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    color: #72552e;
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .finding-head > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .finding.released .finding-head strong,
  .finding.proof .finding-head strong {
    background: #d9eadc;
    color: #2d5e46;
  }

  .finding.waiting .finding-head strong {
    background: #f0dfbd;
    color: #815a20;
  }

  .finding.blocked .finding-head strong {
    background: #edd7d2;
    color: #89342e;
  }

  code {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid #e0d2bb;
    border-radius: 7px;
    background: #f2e6d2;
    color: #493d2e;
    font-family:
      'SFMono-Regular',
      Consolas,
      'Liberation Mono',
      monospace;
    font-size: 0.73rem;
    padding: 7px;
  }

  .gate-row {
    flex-wrap: wrap;
    gap: 7px;
  }

  .gate-row span {
    border-radius: 999px;
    background: #e9ddc8;
    color: #564633;
    font-size: 0.72rem;
    font-weight: 850;
    padding: 5px 8px;
  }

  .capability-row {
    justify-content: space-between;
    gap: 9px;
    min-width: 0;
  }

  .capability-row div {
    min-width: 0;
    gap: 6px;
    color: #2b675b;
    font-family:
      'SFMono-Regular',
      Consolas,
      'Liberation Mono',
      monospace;
    font-size: 0.74rem;
  }

  .capability-row div span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .capability-row button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    border: 0;
    border-radius: 7px;
    background: #1f3529;
    color: #fff7df;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.76rem;
    font-weight: 950;
    padding: 0 10px;
    white-space: nowrap;
  }

  .capability-row .released-action {
    background: #2f684d;
  }

  .capability-row .blocked-action {
    background: #ecd9d3;
    color: #8a342d;
  }

  .release-note,
  .release-error {
    border-radius: 7px;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 850;
    padding: 7px 9px;
  }

  .release-note {
    background: #dcebdc;
    color: #28523c;
  }

  .release-error {
    background: #f0d8d2;
    color: #87382e;
  }

  .activity {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 18px;
    border-left: 1px solid #c9b797;
    background: rgba(255, 248, 234, 0.72);
    padding: 22px 18px;
  }

  .section-head {
    margin-bottom: 10px;
  }

  .receipt-list,
  .shot-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
  }

  .shot {
    display: grid;
    gap: 8px;
    border: 1px solid #cfbd9e;
    border-left-width: 5px;
    border-radius: 8px;
    background: #fff8ea;
    padding: 11px;
  }

  .shot.ok {
    border-left-color: #2f684d;
  }

  .shot.warning {
    border-left-color: #b5652a;
  }

  .shot.danger {
    border-left-color: #af3d37;
  }

  .shot.neutral {
    border-left-color: #2d7770;
  }

  .shot div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .shot span {
    color: #6f5c44;
    font-size: 0.68rem;
    font-weight: 900;
  }

  .shot ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .shot li {
    border-radius: 6px;
    background: #f2e6d2;
    color: #4e4232;
    font-size: 0.72rem;
    font-weight: 850;
    padding: 5px 6px;
  }

  .receipt {
    align-items: flex-start;
    gap: 9px;
    padding: 11px;
    border-left-width: 5px;
  }

  .receipt.ok {
    border-left-color: #2f684d;
  }

  .receipt.warning {
    border-left-color: #b5652a;
  }

  .receipt.danger {
    border-left-color: #af3d37;
  }

  .receipt.neutral {
    border-left-color: #2d7770;
  }

  .receipt code {
    margin-top: 6px;
  }

  @media (max-width: 1180px) {
    :global(html),
    :global(body) {
      overflow: auto;
      overflow-x: hidden;
    }

    .control-room {
      grid-template-columns: minmax(0, 1fr);
      height: auto;
      min-height: 100dvh;
      overflow: visible;
    }

    .rail,
    .activity,
    .content {
      overflow: visible;
    }

    .content {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      scrollbar-gutter: auto;
    }

    .activity {
      width: 100%;
      max-width: 100%;
    }

    .rail {
      display: none;
    }

    .activity {
      border-left: 0;
      border-top: 1px solid #c9b797;
    }

    .funding-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .content {
      padding: 16px;
    }

    .hero,
    .workflow {
      grid-template-columns: 1fr;
      display: grid;
    }

    .hero-panel {
      max-width: 100%;
      width: 100%;
    }

    .hero-panel strong,
    .hero-panel p,
    h1,
    h2,
    h3,
    p,
    strong {
      overflow-wrap: anywhere;
    }

    .scoreboard,
    .findings,
    .funding-grid {
      grid-template-columns: 1fr;
    }

    .decision-row {
      grid-template-columns: 28px minmax(0, 1fr) 54px;
    }

    .decision-row em,
    .decision-row code {
      grid-column: 2 / -1;
      justify-self: start;
    }

    h1 {
      font-size: 2.75rem;
    }

    .section-heading,
    .capability-row {
      align-items: stretch;
      flex-direction: column;
    }

    .rail-picker {
      flex-wrap: wrap;
    }

    .capability-row button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
