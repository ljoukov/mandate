<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    AtSign,
    Bell,
    ChevronDown,
    Circle,
    Check,
    FileDiff,
    Hash,
    KeyRound,
    LayoutDashboard,
    LockKeyhole,
    MoreHorizontal,
    Paperclip,
    Plus,
    Search,
    Send,
    ShieldCheck
  } from '@lucide/svelte';
  import {
    channels,
    coreObservations,
    demoExamples,
    personas,
    product,
    seedMessages,
    integrationTracks,
    type Message
  } from '$lib/demoData';

  type ReleaseOptions = {
    prNumber?: number;
    targetRepo?: string;
    status?: string;
    approvals?: string[];
    evidenceKeys?: string[];
    receiptRail?: string;
  };

  let selectedChannelId = 'agent-approvals';
  let selectedPersonaId = 'agent';
  let searchText = '';
  let composer = '';
  let composerEl: HTMLTextAreaElement;
  let messagesEl: HTMLDivElement;
  let messages: Message[] = [...seedMessages];
  const demoPrompt = product.demoPrompt;
  const pricingPrNumber = 1;
  const pricingRepo = 'yavol/fast-tax';
  const pricingPrUrl = `https://github.com/${pricingRepo}/pull/${pricingPrNumber}`;
  const finalPricingEvidence = ['pricing_replay', 'pricing_contract_tests', 'checkout_integration_tests'];
  let receiptRail = 'local';
  let botStatus = '';
  let demoRunId = 0;
  let tryReleasePending = false;
  let pricingDemo = {
    active: false,
    productApproved: false,
    productPending: false,
    financeApproved: false,
    financePending: false,
    checksPassed: false,
    released: false,
    releasePending: false,
    approvalError: '',
    releaseError: ''
  };

  $: selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  $: selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0];
  $: channelMessages = messages.filter((message) => message.channelId === selectedChannelId);
  $: filteredChannels = channels.filter((channel) =>
    `${channel.name} ${channel.topic} ${channel.layer}`.toLowerCase().includes(searchText.toLowerCase())
  );

  function nowLabel() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date());
  }

  function nextMessageId() {
    return Math.max(0, ...messages.map((message) => message.id)) + 1;
  }

  async function scrollMessagesToBottom() {
    await tick();
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function appendMessages(newMessages: Omit<Message, 'id' | 'time'>[]) {
    let nextId = nextMessageId();
    const time = nowLabel();
    messages = [
      ...messages,
      ...newMessages.map((message) => ({
        ...message,
        id: nextId++,
        time
      }))
    ];
    void scrollMessagesToBottom();
  }

  function delay(minMs = 1800, maxMs = 2600) {
    const duration = Math.round(minMs + Math.random() * (maxMs - minMs));
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async function appendScriptedMessages(
    runId: number,
    newMessages: Omit<Message, 'id' | 'time'>[],
    status = 'Mandate is working...'
  ) {
    for (const message of newMessages) {
      if (runId !== demoRunId) return;
      botStatus = status;
      await scrollMessagesToBottom();
      await delay();
      if (runId !== demoRunId) return;
      botStatus = '';
      appendMessages([message]);
      await delay(1200, 1900);
    }
  }

  async function startPricingDemo() {
    const runId = ++demoRunId;
    botStatus = '';
    pricingDemo = {
      active: true,
      productApproved: false,
      productPending: false,
      financeApproved: false,
      financePending: false,
      checksPassed: false,
      released: false,
      releasePending: false,
      approvalError: '',
      releaseError: ''
    };

    selectedChannelId = 'agent-approvals';
    tryReleasePending = false;
    appendMessages([
      {
        channelId: 'agent-approvals',
        author: selectedPersona.name,
        role: selectedPersona.role,
        avatar: selectedPersona.avatar,
        body: demoPrompt,
        kind: 'normal'
      }
    ]);
    await appendScriptedMessages(
      runId,
      [
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'enterprise agent',
          avatar: 'MA',
          body:
            `Working across Fast Tax as the company-level agent, not as the requester. Found one safe performance change, one pricing change, one provider switch, one recommendation threshold, one protected test deletion, and one procurement action. Opened PR #${pricingPrNumber}: Launch promo pricing.`,
          kind: 'agent',
          tags: ['company agent', `${pricingRepo}#${pricingPrNumber}`, 'authority peel']
        },
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'authority fabric',
          avatar: 'MA',
          body:
            'Authority report: performance can release now; money.pricing needs @finance and @product; vendor.api_provider needs platform and security; commercial.external_commitment needs legal and delivery; deleted integration test is blocked. Capabilities stay withheld until each policy passes.',
          kind: 'report',
          tags: ['money.pricing', 'provider', 'tender', 'test oracle']
        },
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'coverage router',
          avatar: 'MA',
          body:
            'Coverage map: this one run covers ERP pricing replay, vendor privacy, KYC and tender commitments, clinical-style eligibility review, grid dispatch, and proof-before-pay agent spend. Those are plugins under one authority fabric, not separate demos. Every waiting or blocked gate also teaches the next safe step.',
          kind: 'report',
          tags: ['pricing', 'vendor', 'KYC', 'clinical', 'grid', 'agent spend', 'teaching loop']
        }
      ],
      'Mandate is peeling the agent run...'
    );
  }

  async function releaseCapability(capability: string, options: ReleaseOptions = {}) {
    const response = await fetch('/api/capability/release', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ capability, ...options })
    });
    const receipt = await response.json();

    if (!response.ok) {
      throw new Error(receipt.message || `Capability provider refused ${capability}.`);
    }

    return receipt;
  }

  function pricingApprovals() {
    return [
      ...(pricingDemo.financeApproved ? ['@finance'] : []),
      ...(pricingDemo.productApproved ? ['@product'] : [])
    ];
  }

  function pricingEvidenceKeys() {
    return pricingDemo.checksPassed ? finalPricingEvidence : ['pricing_replay'];
  }

  async function approvePricing(group: 'product' | 'finance') {
    const capability = group === 'product' ? 'approve.product' : 'approve.finance';
    const isProduct = group === 'product';

    pricingDemo = {
      ...pricingDemo,
      productPending: isProduct ? true : pricingDemo.productPending,
      financePending: !isProduct ? true : pricingDemo.financePending,
      approvalError: '',
      releaseError: ''
    };

    try {
      const receipt = await releaseCapability(capability);

      pricingDemo = {
        ...pricingDemo,
        productApproved: isProduct ? true : pricingDemo.productApproved,
        productPending: isProduct ? false : pricingDemo.productPending,
        financeApproved: !isProduct ? true : pricingDemo.financeApproved,
        financePending: !isProduct ? false : pricingDemo.financePending,
        approvalError: ''
      };

      appendMessages([
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'approval receipt gate',
          avatar: 'MA',
          body: `Approval receipt recorded for ${isProduct ? '@product' : '@finance'}. Secret exposed to model: ${receipt.secretExposedToModel}. Receipt type: ${receipt.receiptType}.`,
          kind: 'report',
          tags: ['demo approval receipt', capability]
        },
        {
          channelId: 'agent-approvals',
          author: isProduct ? 'Maya Chen' : 'Owen Rao',
          role: isProduct ? '@product' : '@finance',
          avatar: isProduct ? 'MC' : 'OR',
          body: isProduct
            ? 'Approved the launch promo from product. Keep it isolated in the pricing PR.'
            : 'Approved the $15 promo from finance for the launch window.',
          kind: 'approval',
          tags: [isProduct ? '@product approved' : '@finance approved']
        }
      ]);
    } catch (error) {
      pricingDemo = {
        ...pricingDemo,
        productPending: isProduct ? false : pricingDemo.productPending,
        financePending: !isProduct ? false : pricingDemo.financePending,
        approvalError: error instanceof Error ? error.message : 'Approval receipt failed.'
      };
    }
  }

  async function passPricingChecks() {
    const runId = demoRunId;
    pricingDemo = { ...pricingDemo, checksPassed: true, releaseError: '' };
    await appendScriptedMessages(
      runId,
      [
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'CI runner',
          avatar: 'MA',
          body:
            `pricing_replay, pricing_contract_tests, and checkout_integration_tests passed for PR #${pricingPrNumber}. Pricing policy now has the evidence it needs, but only the scoped pricing capability can release.`,
          kind: 'agent',
          tags: ['checks passed']
        }
      ],
      'Mandate is running pricing checks...'
    );
  }

  async function tryReleasePricingEarly() {
    tryReleasePending = true;
    pricingDemo = { ...pricingDemo, releaseError: '' };

    try {
      await releaseCapability('merge.money.pricing', {
        prNumber: pricingPrNumber,
        targetRepo: pricingRepo,
        status: 'waiting',
        approvals: pricingApprovals(),
        evidenceKeys: pricingEvidenceKeys(),
        receiptRail
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mandate withheld pricing capability.';
      pricingDemo = { ...pricingDemo, releaseError: message };
      appendMessages([
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'capability gate',
          avatar: 'MA',
          body: `Refused early release for merge.money.pricing. ${message}`,
          kind: 'report',
          tags: ['withheld', 'policy enforced']
        }
      ]);
    } finally {
      tryReleasePending = false;
    }
  }

  async function releasePricingCredential() {
    pricingDemo = { ...pricingDemo, releasePending: true, releaseError: '' };

    try {
      const receipt = await releaseCapability('merge.money.pricing', {
        prNumber: pricingPrNumber,
        targetRepo: pricingRepo,
        status: 'proof',
        approvals: ['@finance', '@product'],
        evidenceKeys: finalPricingEvidence,
        receiptRail
      });

      pricingDemo = { ...pricingDemo, releasePending: false, released: true };
      await appendScriptedMessages(
        demoRunId,
        [
          {
            channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'capability gate',
          avatar: 'MA',
          body: `Mandate released ${receipt.capability} for one approved action. Secret exposed to model: ${receipt.secretExposedToModel}. TTL: ${receipt.ttlSeconds}s. Rail: ${receipt.receiptRail}. Evidence: ${receipt.evidenceHash}. Receipt: ${receipt.receiptHash}. ${pricingRepo}#${pricingPrNumber} is ready for the controlled merge path.`,
          kind: 'report',
          tags: ['receipt', 'capability released', receipt.receiptRail]
          }
        ],
        'Mandate is releasing merge.money.pricing...'
      );
    } catch (error) {
      pricingDemo = {
        ...pricingDemo,
        releasePending: false,
        releaseError: error instanceof Error ? error.message : 'Release failed.'
      };
    }
  }

  function sendMessage() {
    const text = (composer || composerEl?.value || '').trim();
    if (!text) return;

    if (/@(codeonion|mandate)/i.test(text) && /price|pricing|\$15|15|provider|vendor|ocr/.test(text.toLowerCase())) {
      startPricingDemo();
      composer = '';
      if (composerEl) composerEl.value = '';
      return;
    }

    messages = [
      ...messages,
      {
        id: nextMessageId(),
        channelId: selectedChannelId,
        author: selectedPersona.name,
        role: selectedPersona.role,
        avatar: selectedPersona.avatar,
        time: nowLabel(),
        body: text,
        kind: selectedPersona.id === 'agent' ? 'agent' : 'normal',
        tags: selectedPersona.id === 'agent' ? ['draft'] : undefined
      }
    ];

    composer = '';
    if (composerEl) composerEl.value = '';
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      void startPricingDemo();
    }
  });
</script>

<svelte:head>
  <title>Mandate Slack Demo</title>
</svelte:head>

<main class="shell">
  <aside class="workspace-rail" aria-label="Workspaces">
    <a class="workspace active" href="/" aria-label="FastTax Slack workspace">FT</a>
    <a class="workspace muted" href="/dashboard" aria-label="Mandate dashboard">
      <ShieldCheck size={18} strokeWidth={2.3} />
    </a>
    <button class="round-button" aria-label="Add workspace">
      <Plus size={17} />
    </button>
  </aside>

  <aside class="sidebar" aria-label="FastTax channels">
    <div class="team-block">
      <div>
        <p class="eyebrow">Workspace</p>
      <h1>FastTax</h1>
      </div>
      <button class="icon-button" aria-label="Workspace menu">
        <ChevronDown size={18} />
      </button>
    </div>

    <label class="search-box" for="channel-search">
      <Search size={16} />
      <input id="channel-search" bind:value={searchText} placeholder="Search channels" />
    </label>

    <section class="nav-section">
      <div class="section-title">
        <span>Channels</span>
        <button class="mini-button" aria-label="Create channel">
          <Plus size={14} />
        </button>
      </div>

      <div class="channel-list">
        {#each filteredChannels as channel}
          <button
            class:current={channel.id === selectedChannelId}
            class="channel-row"
            type="button"
            on:click={() => (selectedChannelId = channel.id)}
          >
            <span class="channel-main">
              {#if channel.status === 'locked'}
                <LockKeyhole size={14} />
              {:else}
                <Hash size={14} />
              {/if}
              <span>{channel.name}</span>
            </span>
            {#if channel.unread}
              <span class="unread">{channel.unread}</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="nav-section compact">
      <div class="section-title">
        <span>Direct messages</span>
      </div>
      {#each personas.slice(1) as persona}
        <button class="dm-row" type="button">
          <span class="avatar tiny" style={`--avatar:${persona.color}`}>{persona.avatar}</span>
          <span>{persona.name}</span>
          <span class="presence"><Circle size={8} /></span>
        </button>
      {/each}
    </section>
  </aside>

  <section class="conversation" aria-label={`${selectedChannel.name} messages`}>
    <header class="topbar">
      <div class="channel-heading">
        <div class="channel-title">
          {#if selectedChannel.status === 'locked'}
            <LockKeyhole size={18} />
          {:else}
            <Hash size={19} />
          {/if}
          <h2>{selectedChannel.name}</h2>
        </div>
        <p>{selectedChannel.topic}</p>
      </div>

      <div class="top-actions">
        <a class="dashboard-link" href="/dashboard">
          <LayoutDashboard size={16} />
          Mandate
        </a>
        <label class="persona-picker" for="persona">
          <span>Acting as</span>
          <select id="persona" bind:value={selectedPersonaId}>
            {#each personas as persona}
              <option value={persona.id}>{persona.name}</option>
            {/each}
          </select>
        </label>
        <button class="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button class="demo-launch" type="button" on:click={startPricingDemo}>
          <FileDiff size={16} />
          Run finals demo
        </button>
        <button class="icon-button" aria-label="More actions">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>

    <section class="integration-strip" aria-label="Integration coverage">
      {#each integrationTracks.slice(0, 7) as track}
        <article>
          <strong>{track.name}</strong>
          <span>{track.examples.slice(0, 2).join(' / ')}</span>
        </article>
      {/each}
    </section>

    <section class="premise-strip" aria-label="Mandate operating model">
      {#each coreObservations as observation}
        <article>
          <strong>{observation.title}</strong>
          <p>{observation.body}</p>
          <span>{observation.proof}</span>
        </article>
      {/each}
    </section>

    <div class="messages" bind:this={messagesEl} aria-live="polite">
      {#each channelMessages as message}
        <article class:agent={message.kind === 'agent'} class:report={message.kind === 'report'} class="message">
          <span class="avatar" style={`--avatar:${message.avatar === 'MA' ? '#244c3b' : '#6b5441'}`}>
            {message.avatar}
          </span>
          <div class="message-body">
            <div class="message-meta">
              <strong>{message.author}</strong>
              <span>{message.role}</span>
              <time>{message.time}</time>
            </div>
            <p>{message.body}</p>

            {#if message.tags?.length}
              <div class="tags">
                {#each message.tags as tag}
                  <span>{tag}</span>
                {/each}
              </div>
            {/if}

            {#if message.reactions?.length}
              <div class="reactions">
                {#each message.reactions as reaction}
                  <button type="button">{reaction.emoji} {reaction.count}</button>
                {/each}
              </div>
            {/if}
          </div>
        </article>
      {/each}

      {#if botStatus}
        <article class="message agent typing-row">
          <span class="avatar" style="--avatar:#244c3b">MA</span>
          <div class="message-body">
            <div class="message-meta">
              <strong>Mandate Agent</strong>
              <span>working</span>
            </div>
            <p>{botStatus}</p>
            <div class="typing-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </article>
      {/if}
    </div>

    {#if pricingDemo.active}
      <section class="demo-card" aria-label="Pricing authority workflow">
        <div>
          <p class="eyebrow">Live finals demo</p>
          <div class="demo-heading">
            <h3>Mandate run #42: company-wide agent request</h3>
            <a class="pr-link" href={pricingPrUrl} target="_blank" rel="noreferrer">
              {pricingRepo}#{pricingPrNumber}
            </a>
          </div>
          <p>
            One broad agent request touched pricing, providers, recommendation quality, procurement
            commitments, safe implementation code, and a protected test oracle. The pricing PR is
            shown here; the dashboard shows the full authority peel.
          </p>
        </div>

        <div class="coverage-list" aria-label="Capability coverage examples">
          {#each demoExamples as example}
            <article>
              <span>{example.id}</span>
              <strong>{example.action}</strong>
              <small>{example.gate}</small>
            </article>
          {/each}
        </div>

        <div class="demo-steps">
          <label class="receipt-rail" for="slack-receipt-rail">
            <span>Receipt rail</span>
            <select id="slack-receipt-rail" bind:value={receiptRail}>
              <option value="local">Local</option>
              <option value="ethereum:eas">Ethereum</option>
              <option value="solana:devnet">Solana</option>
            </select>
          </label>
          <button
            class="try-release"
            type="button"
            on:click={tryReleasePricingEarly}
            disabled={pricingDemo.released || tryReleasePending}
          >
            <LockKeyhole size={15} />
            {tryReleasePending ? 'checking' : 'Try release now'}
          </button>
          <button
            class:done={pricingDemo.productApproved}
            type="button"
            on:click={() => approvePricing('product')}
            disabled={pricingDemo.productApproved || pricingDemo.productPending}
          >
            <Check size={15} />
            {pricingDemo.productPending ? 'recording' : '@product'}
          </button>
          <button
            class:done={pricingDemo.financeApproved}
            type="button"
            on:click={() => approvePricing('finance')}
            disabled={pricingDemo.financeApproved || pricingDemo.financePending}
          >
            <Check size={15} />
            {pricingDemo.financePending ? 'recording' : '@finance'}
          </button>
          <button
            class:done={pricingDemo.checksPassed}
            type="button"
            on:click={passPricingChecks}
            disabled={!pricingDemo.productApproved || !pricingDemo.financeApproved || pricingDemo.checksPassed}
          >
            <FileDiff size={15} />
            tests
          </button>
          <button
            class="release"
            class:done={pricingDemo.released}
            type="button"
            on:click={releasePricingCredential}
            disabled={!pricingDemo.checksPassed || pricingDemo.released || pricingDemo.releasePending}
          >
            <KeyRound size={15} />
            {pricingDemo.releasePending
              ? 'releasing'
              : pricingDemo.released
                ? 'released'
              : 'Release capability'}
          </button>
        </div>

        {#if pricingDemo.approvalError}
          <p class="release-error">{pricingDemo.approvalError}</p>
        {/if}

        {#if pricingDemo.releaseError}
          <p class="release-error">{pricingDemo.releaseError}</p>
        {/if}
      </section>
    {/if}

    <form class="composer" on:submit|preventDefault={sendMessage}>
      <button class="quick-demo" type="button" on:click={startPricingDemo}>
        <FileDiff size={16} />
        Run finals demo
      </button>
      <div class="composer-tools">
        <button type="button" aria-label="Attach file">
          <Paperclip size={17} />
        </button>
        <button type="button" aria-label="Mention">
          <AtSign size={17} />
        </button>
        <button type="button" aria-label="Run price drop demo" on:click={startPricingDemo}>
          <FileDiff size={17} />
        </button>
      </div>
      <textarea
        bind:this={composerEl}
        bind:value={composer}
        rows="2"
        placeholder={`Try ${demoPrompt}`}
        on:keydown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
          }
        }}
      ></textarea>
      <button class="send-button" type="submit" aria-label="Send message">
        <Send size={18} />
        Send
      </button>
    </form>
  </section>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    background: #f4f1ea;
    color: #1e211e;
    font-family:
      ui-serif,
      Georgia,
      Cambria,
      'Times New Roman',
      serif;
  }

  :global(html),
  :global(body) {
    height: 100%;
    overflow: hidden;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select) {
    font: inherit;
  }

  :global(button) {
    cursor: pointer;
  }

  .shell {
    display: grid;
    grid-template-columns: 72px 292px minmax(0, 1fr);
    width: 100%;
    max-width: 100vw;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .workspace-rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 18px 12px;
    background: #19241d;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    min-height: 0;
    overflow-y: auto;
  }

  .workspace,
  .round-button,
  .icon-button,
  .mini-button {
    display: inline-grid;
    place-items: center;
    border: 0;
  }

  .workspace {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #e9dfc9;
    color: #1e241f;
    font-weight: 900;
    letter-spacing: 0;
    text-decoration: none;
    box-shadow: inset 0 -3px rgba(0, 0, 0, 0.16);
  }

  .workspace.active {
    outline: 3px solid #ffcf53;
    outline-offset: 2px;
  }

  .workspace.muted {
    background: #2e3d34;
    color: #dfe8dd;
  }

  .round-button {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #e6ecdf;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
    min-height: 0;
    padding: 18px 14px;
    background: #233329;
    color: #edf2e9;
    border-right: 1px solid #17251d;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .team-block,
  .section-title,
  .topbar,
  .top-actions,
  .channel-title,
  .composer-tools,
  .message-meta {
    display: flex;
    align-items: center;
  }

  .integration-strip {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    min-width: 0;
    padding: 10px 18px;
    border-bottom: 1px solid #d8cbb9;
    background: #faf2e3;
  }

  .integration-strip article {
    display: grid;
    gap: 2px;
    min-width: 0;
    border: 1px solid #ddcfb9;
    border-radius: 8px;
    background: #fffaf0;
    padding: 8px;
  }

  .integration-strip strong,
  .integration-strip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .integration-strip strong {
    color: #263126;
    font-size: 0.74rem;
    font-weight: 950;
  }

  .integration-strip span {
    color: #6d604e;
    font-size: 0.68rem;
    font-weight: 800;
  }

  .premise-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    min-width: 0;
    padding: 10px 18px;
    border-bottom: 1px solid #d8cbb9;
    background: #fff8eb;
  }

  .premise-strip article {
    display: grid;
    gap: 4px;
    min-width: 0;
    border: 1px solid #dcc9a7;
    border-left: 5px solid #244c3b;
    border-radius: 8px;
    background: #fffdf7;
    padding: 10px;
  }

  .premise-strip strong,
  .premise-strip p,
  .premise-strip span {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .premise-strip strong {
    color: #1f2d24;
    font-size: 0.84rem;
    font-weight: 950;
  }

  .premise-strip p,
  .premise-strip span {
    color: #665947;
    font-size: 0.74rem;
    line-height: 1.28;
  }

  .premise-strip span {
    color: #7b5b2b;
    font-weight: 900;
  }

  .team-block {
    justify-content: space-between;
    gap: 16px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: #9eb0a4;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-size: 1.55rem;
    line-height: 1;
  }

  h2 {
    font-size: 1.28rem;
    line-height: 1.15;
  }

  .icon-button,
  .mini-button {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.09);
    color: inherit;
  }

  .mini-button {
    width: 25px;
    height: 25px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 11px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.09);
    color: #b8c5b8;
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #f7faf4;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.92rem;
  }

  .search-box input::placeholder {
    color: #adb9ae;
  }

  .nav-section {
    display: grid;
    gap: 9px;
  }

  .nav-section.compact {
    margin-top: auto;
  }

  .section-title {
    justify-content: space-between;
    padding: 0 4px;
    color: #c4d0c5;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .channel-list {
    display: grid;
    gap: 3px;
  }

  .channel-row,
  .dm-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 34px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #e3eadf;
    text-align: left;
  }

  .channel-row {
    padding: 0 8px;
  }

  .channel-row.current {
    background: #f3b93f;
    color: #1c211d;
    font-weight: 900;
  }

  .channel-main {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  .channel-main span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unread {
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: #e45241;
    color: #fff;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.76rem;
    font-weight: 900;
    text-align: center;
    line-height: 20px;
  }

  .dm-row {
    justify-content: flex-start;
    gap: 8px;
    padding: 3px 7px;
    color: #dce5dc;
  }

  .presence {
    margin-left: auto;
    color: #89d18a;
    fill: currentColor;
  }

  .conversation {
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto auto;
    width: 100%;
    max-width: 100vw;
    height: 100dvh;
    min-height: 0;
    min-width: 0;
    background: rgba(255, 253, 247, 0.9);
    overflow: hidden;
  }

  .topbar {
    justify-content: space-between;
    gap: 22px;
    padding: 17px 22px 14px;
    border-bottom: 1px solid #ddd4c3;
    background: rgba(255, 253, 247, 0.96);
    min-width: 0;
  }

  .channel-heading {
    min-width: 0;
  }

  .channel-title {
    gap: 8px;
  }

  .channel-heading p {
    max-width: 820px;
    margin-top: 5px;
    color: #665f52;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .top-actions {
    gap: 9px;
    flex-shrink: 0;
    min-width: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .dashboard-link,
  .demo-launch,
  .persona-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border: 1px solid #d5c9b5;
    border-radius: 8px;
    background: #fffaf0;
    color: #1f241f;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.8rem;
    font-weight: 900;
    text-decoration: none;
  }

  .dashboard-link {
    padding: 0 11px;
    white-space: nowrap;
  }

  .demo-launch {
    border: 1px solid #b45f2d;
    padding: 0 12px;
    background: #bb5b2a;
    color: #fff8ed;
    white-space: nowrap;
  }

  .persona-picker {
    min-width: 210px;
    max-width: 260px;
    padding: 7px 9px;
    color: #615b50;
    font-size: 0.76rem;
    text-transform: uppercase;
  }

  .persona-picker select {
    min-width: 0;
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: #1f241f;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: none;
  }

  .conversation .icon-button {
    background: #eee5d3;
    color: #2e332e;
  }

  .messages {
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    padding: 14px 18px 22px;
  }

  .message {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 11px;
    padding: 11px 10px;
    border-radius: 8px;
  }

  .message:hover {
    background: #f3eadc;
  }

  .message.report {
    border: 1px solid #d7c8aa;
    background: #fff7e6;
    box-shadow: 0 10px 30px rgba(77, 58, 30, 0.08);
  }

  .message.agent:not(.report) {
    background: rgba(36, 76, 59, 0.07);
  }

  .typing-row {
    position: sticky;
    bottom: 0;
    border: 1px solid #d6c6ad;
    background: #fff8e9;
    box-shadow: 0 -8px 22px rgba(52, 42, 27, 0.08);
  }

  .avatar {
    display: inline-grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: var(--avatar);
    color: #fffdf6;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
  }

  .avatar.tiny {
    width: 24px;
    height: 24px;
    font-size: 0.66rem;
  }

  .message-body {
    min-width: 0;
  }

  .message-meta {
    gap: 8px;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .message-meta strong {
    color: #1e241f;
    font-size: 0.95rem;
  }

  .message-meta span,
  .message-meta time {
    color: #777067;
    font-size: 0.78rem;
  }

  .message-body p {
    max-width: 86ch;
    margin-top: 4px;
    color: #282821;
    font-size: 0.98rem;
    line-height: 1.43;
  }

  .tags,
  .reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 9px;
  }

  .tags span {
    border-radius: 999px;
    background: #e7dbc5;
    color: #5e4932;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.73rem;
    font-weight: 800;
    padding: 4px 8px;
  }

  .reactions button {
    border: 1px solid #d9cfbd;
    border-radius: 999px;
    background: #fffbf2;
    color: #39372f;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.74rem;
    font-weight: 800;
    padding: 3px 8px;
  }

  .typing-dots {
    display: flex;
    gap: 5px;
    margin-top: 8px;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #244c3b;
    animation: typing-pulse 1.1s infinite ease-in-out;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes typing-pulse {
    0%,
    80%,
    100% {
      opacity: 0.35;
      transform: translateY(0);
    }

    40% {
      opacity: 1;
      transform: translateY(-3px);
    }
  }

  .demo-card {
    display: grid;
    grid-template-columns: minmax(300px, 0.85fr) minmax(420px, 1.15fr);
    gap: 16px;
    align-items: start;
    margin: 0 18px 14px;
    padding: 14px;
    border: 1px solid #d5ad51;
    border-radius: 8px;
    background: #fff3d0;
    box-shadow: 0 16px 38px rgba(90, 61, 15, 0.13);
    max-height: 34dvh;
    overflow-y: auto;
  }

  .demo-card > div {
    min-width: 0;
  }

  .demo-card h3 {
    margin: 0;
    color: #201c13;
    font-size: 1rem;
    line-height: 1.15;
  }

  .demo-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .pr-link {
    color: #244c3b;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .demo-card p {
    max-width: 68ch;
    color: #5e513a;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.88rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .demo-steps {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 7px;
  }

  .coverage-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
    min-width: 0;
  }

  .coverage-list article {
    display: grid;
    gap: 3px;
    min-width: 0;
    border: 1px solid #ddc890;
    border-radius: 8px;
    background: #fffaf0;
    padding: 8px;
  }

  .coverage-list span,
  .coverage-list small,
  .receipt-rail,
  .receipt-rail select {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .coverage-list span {
    color: #93683a;
    font-size: 0.66rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .coverage-list strong {
    overflow-wrap: anywhere;
    color: #201c13;
    font-size: 0.76rem;
    line-height: 1.15;
  }

  .coverage-list small {
    color: #6c5f4c;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .receipt-rail {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    color: #4f432f;
    font-size: 0.76rem;
    font-weight: 900;
  }

  .receipt-rail select {
    height: 34px;
    border: 1px solid #d0ba85;
    border-radius: 8px;
    background: #fffaf0;
    color: #322a1a;
    font-size: 0.78rem;
    font-weight: 900;
    padding: 0 8px;
  }

  .demo-steps button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    border: 1px solid #d0ba85;
    border-radius: 8px;
    background: #fffaf0;
    color: #322a1a;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    padding: 0 10px;
  }

  .demo-steps button:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .demo-steps button.done {
    border-color: #2d6b4f;
    background: #244c3b;
    color: #fffdf5;
    opacity: 1;
  }

  .demo-steps button.release:not(:disabled) {
    border-color: #a65a28;
    background: #bb5b2a;
    color: #fff8ed;
  }

  .demo-steps button.try-release:not(:disabled) {
    border-color: #9f4f42;
    background: #f1ded8;
    color: #7d352d;
  }

  .release-error {
    grid-column: 1 / -1;
    color: #8c2f22;
    font-weight: 800;
  }

  .composer {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: end;
    margin: 0 18px 18px;
    padding: 10px;
    border: 1px solid #d2c6b4;
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 16px 40px rgba(53, 42, 27, 0.13);
  }

  .composer-tools {
    display: none;
    gap: 5px;
    align-self: stretch;
    padding-top: 3px;
  }

  .quick-demo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 150px;
    min-height: 38px;
    border: 0;
    border-radius: 7px;
    background: #bb5b2a;
    color: #fff8ed;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.8rem;
    font-weight: 900;
    padding: 0 12px;
    white-space: nowrap;
  }

  .composer-tools button,
  .send-button {
    display: inline-grid;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: #eee5d4;
    color: #454238;
  }

  .composer-tools button {
    width: 34px;
    height: 34px;
  }

  .composer textarea {
    width: 100%;
    min-height: 44px;
    max-height: 110px;
    border: 0;
    outline: 0;
    resize: none;
    overflow-y: auto;
    background: transparent;
    color: #1d211e;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.94rem;
    line-height: 1.4;
  }

  .send-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 82px;
    height: 38px;
    background: #244c3b;
    color: #fff;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.82rem;
    font-weight: 900;
    padding: 0 13px;
  }

  @media (max-width: 900px) {
    .shell {
      grid-template-columns: 64px minmax(0, 1fr);
    }

    .sidebar {
      display: none;
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .top-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .persona-picker {
      min-width: min(100%, 320px);
    }

    .demo-launch {
      display: none;
    }

    .integration-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .premise-strip {
      grid-template-columns: 1fr;
    }

    .demo-card {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .coverage-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .shell {
      grid-template-columns: 1fr;
      height: 100dvh;
      min-height: 0;
      overflow: hidden;
    }

    .workspace-rail {
      display: none;
    }

    .conversation {
      width: 100%;
      max-width: 100vw;
      height: 100dvh;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: block;
      min-height: 56px;
      padding: 14px 18px 10px;
      overflow-x: hidden;
    }

    .channel-heading p,
    .top-actions {
      display: none;
    }

    .channel-heading,
    .channel-title,
    .top-actions,
    .top-actions > *,
    .integration-strip,
    .premise-strip,
    .messages,
    .demo-card,
    .composer {
      max-width: 100%;
    }

    .channel-title h2,
    .premise-strip strong,
    .premise-strip p,
    .premise-strip span,
    .message-body p,
    .coverage-list strong,
    .coverage-list small {
      overflow-wrap: anywhere;
    }

    .composer {
      grid-template-columns: 1fr auto;
      margin: 0;
      border-radius: 0;
    }

    .quick-demo {
      grid-column: 1 / -1;
      width: 100%;
    }

    .composer-tools {
      display: none;
    }

    .composer textarea {
      min-height: 58px;
    }

    .integration-strip,
    .premise-strip,
    .coverage-list {
      grid-template-columns: 1fr;
    }

    .integration-strip,
    .premise-strip {
      padding: 10px 18px;
    }

    .demo-card {
      margin: 0 10px 10px;
      max-height: 38dvh;
    }
  }
</style>
