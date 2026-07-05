<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    AtSign,
    Bell,
    ChevronDown,
    Circle,
    FileDiff,
    Hash,
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
    personas,
    product,
    seedMessages,
    type Message
  } from '$lib/demoData';

  let selectedChannelId = 'agent-approvals';
  let selectedPersonaId = '';
  let accountSelected = false;
  let searchText = '';
  let composer = '';
  let composerEl: HTMLTextAreaElement;
  let messagesEl: HTMLDivElement;
  let messages: Message[] = [...seedMessages];
  const requestPrompt = product.requestTemplate;
  const pricingPrNumber = 1;
  const pricingRepo = 'yavol/fast-tax';
  let botStatus = '';
  let requestRunId = 0;

  $: selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  $: accountOptions = personas.filter((persona) => persona.id !== 'agent');
  $: selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? accountOptions[0] ?? personas[0];
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
      if (runId !== requestRunId) return;
      botStatus = status;
      await scrollMessagesToBottom();
      await delay();
      if (runId !== requestRunId) return;
      botStatus = '';
      appendMessages([message]);
      await delay(1200, 1900);
    }
  }

  async function startLaunchRequest() {
    const runId = ++requestRunId;
    botStatus = '';

    selectedChannelId = 'agent-approvals';
    appendMessages([
      {
        channelId: 'agent-approvals',
        author: selectedPersona.name,
        role: selectedPersona.role,
        avatar: selectedPersona.avatar,
        body: requestPrompt,
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
            `Opened PR #${pricingPrNumber}: Launch promo pricing. I also found a safe OCR performance change, a provider fallback, a recommendation threshold change, a protected test deletion, and a procurement action that need separate review paths.`,
          kind: 'agent',
          tags: [`${pricingRepo}#${pricingPrNumber}`, 'review paths']
        },
        {
          channelId: 'agent-approvals',
          author: 'Mandate Agent',
          role: 'release control',
          avatar: 'MA',
          body:
            'OCR performance can release now. Pricing needs @finance, @product, and replay evidence. Provider fallback needs platform and security review. The deleted checkout test is blocked until QA restores coverage.',
          kind: 'report',
          tags: ['pricing', 'provider', 'checkout test']
        }
      ],
      'Mandate is checking the request...'
    );
  }

  function sendMessage() {
    const text = (composer || composerEl?.value || '').trim();
    if (!text) return;

    if (/@mandate/i.test(text) && /price|pricing|\$15|15|provider|vendor|ocr/.test(text.toLowerCase())) {
      startLaunchRequest();
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

  function chooseAccount(id: string) {
    selectedPersonaId = id;
    accountSelected = true;
    window.sessionStorage.setItem('mandateSelectedAccount', id);
  }

  onMount(() => {
    const savedAccount = window.sessionStorage.getItem('mandateSelectedAccount');
    if (savedAccount && accountOptions.some((persona) => persona.id === savedAccount)) {
      selectedPersonaId = savedAccount;
      accountSelected = true;
    }
  });
</script>

<svelte:head>
  <title>Mandate</title>
</svelte:head>

{#if !accountSelected}
  <main class="login-shell" aria-label="Choose account">
    <section class="login-panel">
      <div class="login-brand">
        <span class="workspace">FT</span>
        <div>
          <p class="eyebrow">FastTax workspace</p>
          <h1>Sign in to Mandate</h1>
          <p>Select a pre-configured employee account for this workspace.</p>
        </div>
      </div>

      <div class="account-list">
        {#each accountOptions as persona}
          <button type="button" on:click={() => chooseAccount(persona.id)}>
            <span class="avatar" style={`--avatar:${persona.color}`}>{persona.avatar}</span>
            <span>
              <strong>{persona.name}</strong>
              <small>{persona.role}</small>
            </span>
          </button>
        {/each}
      </div>
    </section>
  </main>
{:else}
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
          <span>Signed in as</span>
          <select id="persona" bind:value={selectedPersonaId}>
            {#each accountOptions as persona}
              <option value={persona.id}>{persona.name}</option>
            {/each}
          </select>
        </label>
        <button class="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button class="icon-button" aria-label="More actions">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>

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

    <form class="composer" on:submit|preventDefault={sendMessage}>
      <button class="quick-request" type="button" on:click={startLaunchRequest}>
        <FileDiff size={16} />
        New request
      </button>
      <div class="composer-tools">
        <button type="button" aria-label="Attach file">
          <Paperclip size={17} />
        </button>
        <button type="button" aria-label="Mention">
          <AtSign size={17} />
        </button>
        <button type="button" aria-label="Start request" on:click={startLaunchRequest}>
          <FileDiff size={17} />
        </button>
      </div>
      <textarea
        bind:this={composerEl}
        bind:value={composer}
        rows="1"
        placeholder={`Message #${selectedChannel.name}`}
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
{/if}

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

  .login-shell {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 100dvh;
    padding: 24px;
    background:
      linear-gradient(90deg, rgba(35, 51, 41, 0.05) 1px, transparent 1px),
      linear-gradient(0deg, rgba(35, 51, 41, 0.05) 1px, transparent 1px),
      #f4f1ea;
    background-size: 28px 28px;
  }

  .login-panel {
    display: grid;
    gap: 24px;
    width: min(100%, 560px);
    border: 1px solid #d3c4aa;
    border-radius: 8px;
    background: #fffdf7;
    padding: 24px;
    box-shadow: 0 24px 80px rgba(37, 33, 24, 0.14);
  }

  .login-brand {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .login-brand .workspace {
    flex: 0 0 auto;
  }

  .login-brand h1 {
    margin-bottom: 8px;
    color: #1f2d24;
  }

  .login-brand p:not(.eyebrow) {
    color: #655d51;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    line-height: 1.45;
  }

  .account-list {
    display: grid;
    gap: 10px;
  }

  .account-list button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    border: 1px solid #d5c9b5;
    border-radius: 8px;
    background: #fffaf0;
    padding: 12px;
    color: #1f241f;
    text-align: left;
  }

  .account-list button:hover,
  .account-list button:focus-visible {
    outline: 2px solid #f3b93f;
    outline-offset: 2px;
  }

  .account-list strong,
  .account-list small {
    display: block;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .account-list strong {
    font-weight: 900;
  }

  .account-list small {
    margin-top: 3px;
    color: #665f52;
    font-size: 0.86rem;
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
    grid-template-rows: auto minmax(0, 1fr) auto;
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

  .composer {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    margin: 0 18px 18px;
    padding: 8px 10px;
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

  .quick-request {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 150px;
    min-height: 40px;
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
    min-height: 40px;
    max-height: 110px;
    padding: 10px 2px;
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
    line-height: 20px;
  }

  .send-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 82px;
    height: 40px;
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
    .messages,
    .composer {
      max-width: 100%;
    }

    .channel-title h2,
    .message-body p {
      overflow-wrap: anywhere;
    }

    .composer {
      grid-template-columns: 1fr auto;
      margin: 0;
      border-radius: 0;
    }

    .quick-request {
      grid-column: 1 / -1;
      width: 100%;
    }

    .composer-tools {
      display: none;
    }

    .composer textarea {
      min-height: 42px;
      padding: 11px 2px;
    }

  }
</style>
