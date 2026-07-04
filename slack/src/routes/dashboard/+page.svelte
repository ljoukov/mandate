<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ArrowLeft,
    BadgeCheck,
    Bot,
    Check,
    CircuitBoard,
    Clock3,
    FileCheck2,
    GitPullRequest,
    KeyRound,
    LockKeyhole,
    Network,
    RadioTower,
    Route,
    ShieldCheck,
    SplitSquareHorizontal,
    X
  } from '@lucide/svelte';
  import {
    agentPlugins,
    authorityFindings,
    coreObservations,
    demoExamples,
    evidenceShots,
    product,
    receipts,
    integrationTracks,
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

  type BountyFlow = {
    publicBody: string;
    budgetGbp: number;
    gcc: {
      allocationHash: string;
      decisions: FundingDecision[];
      reusableInterfaces: string[];
    };
    coralStuk: {
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
  let bountyFlow: BountyFlow | null = null;
  let bountyLoading = true;
  let bountyError = '';
  let bountyReleasePending: Record<string, boolean> = {};
  let bountyReleaseNotes: Record<string, string> = {};

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

  function pluginLabel(status: string) {
    if (status === 'proof') return 'evidence gate';
    if (status === 'allowed') return 'allowed';
    return status;
  }

  async function loadBountyFlow() {
    bountyLoading = true;
    bountyError = '';

    try {
      const response = await fetch('/api/public-funding/agent-economy');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Could not load bounty workflow.');
      }

      bountyFlow = payload as BountyFlow;
    } catch (error) {
      bountyError = error instanceof Error ? error.message : 'Could not load bounty workflow.';
    } finally {
      bountyLoading = false;
    }
  }

  async function releaseBountyCapability(
    id: string,
    capability: string,
    approvals: string[],
    evidenceKeys: string[],
    rail = receiptRail
  ) {
    bountyReleasePending = { ...bountyReleasePending, [id]: true };
    bountyReleaseNotes = { ...bountyReleaseNotes, [id]: '' };

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

      bountyReleaseNotes = {
        ...bountyReleaseNotes,
        [id]: `${receipt.capability} released for ${receipt.ttlSeconds}s, ${receipt.receiptRail}, ${receipt.receiptHash}`
      };
    } catch (error) {
      bountyReleaseNotes = {
        ...bountyReleaseNotes,
        [id]: error instanceof Error ? error.message : 'Capability release failed.'
      };
    } finally {
      bountyReleasePending = { ...bountyReleasePending, [id]: false };
    }
  }

  function releaseGccAllocation() {
    return releaseBountyCapability(
      'gcc-allocation',
      'allocate.public_funding',
      ['@programme-owner', '@finance', '@public-audit'],
      ['public_sources', 'rubric_weights', 'counterfactual_analysis', 'milestone_plan', 'appeal_record'],
      'ethereum:eas'
    );
  }

  function releaseCoralPayment(flow: BountyFlow) {
    return releaseBountyCapability(
      'coral-payment',
      flow.coralStuk.escrow.releaseCapability,
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
        [finding.id]: `${receipt.capability} released, TTL ${receipt.ttlSeconds ?? 300}s, ${receipt.receiptRail} rail, ${receipt.receiptHash}`
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
    void loadBountyFlow();
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
        Agent plugins
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
        <p class="eyebrow">Hackathon finals demo</p>
        <h1>{product.name}</h1>
        <p class="subtitle">{product.tagline}. {product.thesis}</p>
      </div>
      <div class="hero-panel">
        <Bot size={22} />
        <div>
          <strong>One enterprise agent, many possible actions</strong>
          <p>Merge code, send KYC requests, submit tenders, buy agent work, dispatch grid actions, or publish receipts.</p>
        </div>
      </div>
    </header>

    <section class="observation-band" aria-label="Core Mandate observations">
      {#each coreObservations as observation}
        <article>
          <span>{observation.id}</span>
          <h2>{observation.title}</h2>
          <p>{observation.body}</p>
          <strong>{observation.proof}</strong>
        </article>
      {/each}
    </section>

    <section class="integration-rail" aria-label="Integration coverage rail">
      {#each integrationTracks.slice(0, 8) as track}
        <article>
          <strong>{track.name}</strong>
          <span>{track.examples.join(' / ')}</span>
        </article>
      {/each}
    </section>

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

    <section class="thesis-band">
      <div>
        <p class="eyebrow">Category claim</p>
        <h2>Every vertical agent becomes a Mandate plugin.</h2>
      </div>
      <p>
        The other demos prepare evidence, simulate outcomes, route tasks, or recommend action.
        Mandate is the layer that decides whether the action can actually happen: who approves,
        what proof is required, which capability is released, and what receipt survives audit.
      </p>
    </section>

    <section class="coverage-band" aria-label="Coverage matrix">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Field coverage</p>
          <h2>The other demos become release gates.</h2>
        </div>
        <label class="rail-picker" for="receipt-rail">
          Receipt rail
          <select id="receipt-rail" bind:value={receiptRail}>
            <option value="local">Local</option>
            <option value="ethereum:eas">Ethereum EAS</option>
            <option value="solana:devnet">Solana devnet</option>
          </select>
        </label>
      </div>
      <div class="example-grid">
        {#each demoExamples as example}
          <article>
            <span>{example.borrowedFrom}</span>
            <h3>{example.action}</h3>
            <p>{example.gate}</p>
            <code>{example.capability}</code>
            <small>{example.receipt} · {example.rail}</small>
          </article>
        {/each}
      </div>
    </section>

    <section class="bounty-band" aria-label="CoralOS STUK and GCC bounties">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Real bounty code path</p>
          <h2>Public funding decisions buy verifier agents.</h2>
        </div>
        <button class="secondary-action" type="button" on:click={loadBountyFlow}>
          <Route size={15} />
          {bountyLoading ? 'loading' : 'refresh'}
        </button>
      </div>

      {#if bountyError}
        <p class="release-error">{bountyError}</p>
      {:else if bountyFlow}
        <div class="bounty-grid">
          <article class="bounty-card gcc-card">
            <div class="bounty-card-head">
              <div>
                <span>GCC public capital</span>
                <h3>{bountyFlow.publicBody}</h3>
              </div>
              <strong>£{bountyFlow.budgetGbp.toLocaleString()}</strong>
            </div>

            <div class="decision-table" aria-label="Public funding decisions">
              {#each bountyFlow.gcc.decisions.slice(0, 4) as decision}
                <div class={`decision-row ${decision.status}`}>
                  <span>#{decision.rank}</span>
                  <strong>{decision.applicant}</strong>
                  <small>{decision.score}/100</small>
                  <em>£{decision.recommendedAwardGbp.toLocaleString()}</em>
                  <code>{decision.status}</code>
                </div>
              {/each}
            </div>

            <p>{bountyFlow.gcc.decisions[0]?.counterfactual}</p>
            <code>{bountyFlow.gcc.allocationHash}</code>

            <button
              type="button"
              on:click={releaseGccAllocation}
            >
              {#if bountyReleasePending['gcc-allocation']}
                <Clock3 size={15} />
                checking
              {:else}
                <Check size={15} />
                release allocation receipt
              {/if}
            </button>

            {#if bountyReleaseNotes['gcc-allocation']}
              <p class="release-note">{bountyReleaseNotes['gcc-allocation']}</p>
            {/if}
          </article>

          <article class="bounty-card coral-card">
            <div class="bounty-card-head">
              <div>
                <span>CoralOS / STUK agent economy</span>
                <h3>{bountyFlow.coralStuk.award.winner}</h3>
              </div>
              <strong>{bountyFlow.coralStuk.award.score}</strong>
            </div>

            <div class="agent-session">
              <span>{bountyFlow.coralStuk.coralSession.sessionId}</span>
              <small>{bountyFlow.coralStuk.coralSession.agents.length} agents</small>
            </div>

            <div class="ledger-strip" aria-label="Agent economy state ledger">
              {#each bountyFlow.coralStuk.ledger as step}
                <div>
                  <strong>{step.state}</strong>
                  <span>{step.actor}</span>
                </div>
              {/each}
            </div>

            <p>{bountyFlow.coralStuk.award.reason}</p>
            <code>{bountyFlow.coralStuk.escrow.chain}:{bountyFlow.coralStuk.escrow.reference}</code>

            <button
              type="button"
              on:click={() => bountyFlow && releaseCoralPayment(bountyFlow)}
            >
              {#if bountyReleasePending['coral-payment']}
                <Clock3 size={15} />
                checking
              {:else}
                <Check size={15} />
                release verifier payment
              {/if}
            </button>

            {#if bountyReleaseNotes['coral-payment']}
              <p class="release-note">{bountyReleaseNotes['coral-payment']}</p>
            {/if}
          </article>
        </div>
      {:else}
        <p class="loading-line">Loading bounty workflow...</p>
      {/if}
    </section>

    <section class="track-band" aria-label="Integration tracks">
      <div class="section-heading">
        <p class="eyebrow">Integrations</p>
        <h2>One demo, four concrete integration paths.</h2>
      </div>
      <div class="tracks">
        {#each integrationTracks as track}
          <article class={`track ${track.crowding}`}>
            <div>
              <span>{track.crowding}</span>
              <h3>{track.name}</h3>
            </div>
            <p>{track.ask}</p>
            <strong>{track.mandateMove}</strong>
            <div class="track-chips">
              {#each track.examples as example}
                <span>{example}</span>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section class="workflow">
      <div class="workflow-card">
        <p class="eyebrow">Live request</p>
        <h2>{product.demoPrompt}</h2>
        <div class="flow">
          <span>request</span>
          <Route size={15} />
          <span>evidence</span>
          <Route size={15} />
          <span>authority layer</span>
          <Route size={15} />
          <span>capability</span>
          <Route size={15} />
          <span>receipt</span>
        </div>
      </div>

      <div class="split-card">
        <p class="eyebrow">Suggested split</p>
        <ol>
          <li>Safe PR: OCR performance optimization can land now.</li>
          <li>Pricing PR: waits for finance, product, and replay proof.</li>
          <li>Provider PR: waits for privacy, security, and retention proof.</li>
          <li>Eval PR: threshold change ships only if metric gates hold.</li>
          <li>Blocked PR: restore the paid-customer test oracle.</li>
          <li>Tender action: legal and delivery approve before submission.</li>
          <li>Agent spend: budget, acceptance proof, and settlement receipt before payment.</li>
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
        <p class="eyebrow">Gate types</p>
        <h2>Absorb the field</h2>
      </div>
      <div class="plugin-list">
        {#each agentPlugins as plugin}
          <article class={`plugin ${plugin.status}`}>
            <div>
              <span>{pluginLabel(plugin.status)}</span>
              <h3>{plugin.name}</h3>
            </div>
            <p>{plugin.action}</p>
            <p>{plugin.evidence}</p>
            <code>{plugin.authorityLayer}</code>
            <code>{plugin.capability}</code>
            <small>{plugin.borrowedFrom}</small>
            <div class="plugin-fit">
              {#each plugin.integrationFit as fit}
                <span>{fit}</span>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section>
      <div class="section-head">
        <p class="eyebrow">Evidence shots</p>
        <h2>What Mandate checks</h2>
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

    <section class="close-card">
      <LockKeyhole size={18} />
      <strong>Judge line</strong>
      <p>A vertical agent demo shows one workflow. Mandate shows how the enterprise safely runs all of them.</p>
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
  .thesis-band p,
  .track p,
  .finding p,
  .plugin p,
  .receipt p,
  .close-card p,
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

  .observation-band {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
    margin-bottom: 14px;
  }

  .observation-band article {
    display: grid;
    gap: 8px;
    min-width: 0;
    border: 1px solid #c3af8b;
    border-left: 5px solid #244c3b;
    border-radius: 8px;
    background: #fff8ea;
    padding: 14px;
  }

  .observation-band span,
  .observation-band p,
  .observation-band strong {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    overflow-wrap: anywhere;
  }

  .observation-band span {
    color: #80643e;
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .observation-band p {
    color: #5f574b;
    font-size: 0.88rem;
    line-height: 1.38;
  }

  .observation-band strong {
    color: #244c3b;
    font-size: 0.82rem;
    font-weight: 950;
    line-height: 1.3;
  }

  .integration-rail {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 9px;
    margin-bottom: 14px;
  }

  .integration-rail article {
    display: grid;
    gap: 3px;
    min-width: 0;
    border: 1px solid #c8b696;
    border-radius: 8px;
    background: #fbf1df;
    padding: 10px;
  }

  .integration-rail strong,
  .integration-rail span,
  .rail-picker,
  .rail-picker select,
  .example-grid span,
  .example-grid small,
  .secondary-action,
  .bounty-card span,
  .bounty-card small,
  .bounty-card code,
  .decision-row,
  .agent-session,
  .ledger-strip,
  .track-chips span,
  .plugin-fit span,
  .shot span,
  .shot li {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .integration-rail strong {
    min-width: 0;
    overflow: hidden;
    color: #1c2b22;
    font-size: 0.82rem;
    font-weight: 950;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .integration-rail span {
    min-width: 0;
    overflow: hidden;
    color: #715f48;
    font-size: 0.72rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hero-panel strong,
  .scoreboard strong,
  .track strong,
  .receipt strong,
  .close-card strong,
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

  .thesis-band,
  .workflow {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }

  .thesis-band {
    grid-template-columns: minmax(250px, 0.42fr) 1fr;
    align-items: center;
    border: 1px solid #c3af8b;
    border-radius: 8px;
    background: #1e2b23;
    color: #fff4dc;
    padding: 18px;
  }

  .thesis-band .eyebrow,
  .thesis-band p {
    color: #e8c47d;
  }

  .thesis-band p {
    font-size: 0.95rem;
  }

  .track-band {
    display: grid;
    gap: 13px;
    margin-bottom: 14px;
  }

  .coverage-band {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
    border: 1px solid #c3af8b;
    border-radius: 8px;
    background: #fff8ea;
    padding: 14px;
  }

  .bounty-band {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
    border: 1px solid #b9c6a1;
    border-radius: 8px;
    background: #f8fbef;
    padding: 14px;
  }

  .rail-picker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #5d4930;
    font-size: 0.78rem;
    font-weight: 950;
  }

  .rail-picker select {
    min-height: 34px;
    border: 1px solid #c9b797;
    border-radius: 8px;
    background: #f6ead4;
    color: #2d2921;
    font-weight: 900;
    padding: 0 8px;
  }

  .example-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .example-grid article {
    display: grid;
    gap: 6px;
    min-width: 0;
    border: 1px solid #d3c0a0;
    border-radius: 8px;
    background: #fffdf7;
    padding: 10px;
  }

  .example-grid span {
    color: #855f35;
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .example-grid small {
    color: #705f48;
    font-size: 0.72rem;
    font-weight: 850;
    line-height: 1.25;
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

  .bounty-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .bounty-card {
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

  .bounty-card-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 14px;
  }

  .bounty-card-head > div,
  .bounty-card p,
  .bounty-card code {
    min-width: 0;
  }

  .bounty-card-head span,
  .agent-session span {
    color: #6a734b;
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .bounty-card-head strong {
    color: #263b2d;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 1.05rem;
    font-weight: 950;
    white-space: nowrap;
  }

  .bounty-card p,
  .loading-line {
    color: #5e6155;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.84rem;
    line-height: 1.36;
  }

  .bounty-card code {
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
    grid-template-columns: repeat(7, minmax(68px, 1fr));
    gap: 5px;
    overflow-x: auto;
    padding-bottom: 3px;
  }

  .ledger-strip div {
    display: grid;
    gap: 4px;
    min-width: 68px;
    border: 1px solid #ded7ed;
    border-radius: 8px;
    background: #faf7ff;
    padding: 7px;
  }

  .ledger-strip strong {
    color: #4f3e86;
    font-size: 0.68rem;
    line-height: 1;
  }

  .ledger-strip span {
    overflow: hidden;
    color: #665b79;
    font-size: 0.65rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bounty-card button {
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

  .tracks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 11px;
  }

  .track,
  .workflow-card,
  .split-card,
  .finding,
  .plugin,
  .receipt,
  .close-card {
    border: 1px solid #cfbd9e;
    border-radius: 8px;
    background: #fff8ea;
  }

  .track {
    display: grid;
    gap: 9px;
    padding: 13px;
    border-top-width: 5px;
  }

  .track.open {
    border-top-color: #2d7770;
  }

  .track.moderate {
    border-top-color: #7a68a5;
  }

  .track.crowded {
    border-top-color: #b5652a;
  }

  .track div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .track span,
  .finding-head strong,
  .plugin span {
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

  .track-chips,
  .plugin-fit {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .track-chips span,
  .plugin-fit span {
    border-radius: 999px;
    background: #eee1ca;
    color: #5d4930;
    font-size: 0.66rem;
    font-weight: 900;
    padding: 4px 6px;
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

  .plugin-list,
  .receipt-list,
  .shot-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
  }

  .plugin {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-left-width: 5px;
  }

  .plugin.proof,
  .plugin.allowed {
    border-left-color: #2d7770;
  }

  .plugin.waiting {
    border-left-color: #b5652a;
  }

  .plugin.blocked {
    border-left-color: #af3d37;
  }

  .plugin div {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 8px;
  }

  .plugin h3 {
    min-width: 0;
    text-align: left;
    overflow-wrap: anywhere;
  }

  .plugin small {
    color: #715e45;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.72rem;
    font-weight: 850;
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

  .close-card {
    display: grid;
    gap: 9px;
    padding: 13px;
    background: #17211b;
    color: #fff4dc;
  }

  .close-card p {
    color: #e4d6be;
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

    .bounty-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .content {
      padding: 16px;
    }

    .hero,
    .thesis-band,
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
    .tracks,
    .findings,
    .observation-band,
    .integration-rail,
    .example-grid,
    .bounty-grid {
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
