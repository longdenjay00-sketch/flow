<script lang="ts">
  import type { Section } from './lyrics'
  import {
    formatDate,
    formatWriters,
    lineTokens,
    normalizeWord,
    parseSections,
    replaceAt,
    splitWriters,
    wordAt,
  } from './lyrics'

  let {
    kind,
    songKey,
    title,
    writersText,
    dateLabel,
    lyrics,
    sections,
    status,
    onword,
    ontitle,
    onwriters,
    onlyrics,
    ondownload,
    ondelete,
    onduplicate,
    oninsert,
  }: {
    kind: 'local' | 'repo' | 'empty'
    songKey: string
    title: string
    writersText: string
    dateLabel: string
    lyrics: string
    sections: Section[]
    status: string
    onword: (word: string) => void
    ontitle: (value: string) => void
    onwriters: (value: string) => void
    onlyrics: (value: string) => void
    ondownload: () => void
    ondelete: () => void
    onduplicate: () => void
    oninsert: (insert: ((word: string) => void) | null) => void
  } = $props()

  let view = $state<'edit' | 'read'>('edit')
  let armedDelete = $state(false)
  let area = $state<HTMLTextAreaElement | null>(null)
  let caretStart = 0
  let caretEnd = 0

  $effect(() => {
    songKey
    view = kind === 'local' ? 'edit' : 'read'
    armedDelete = false
  })

  $effect(() => {
    void lyrics
    if (kind !== 'local' || view !== 'edit') {
      oninsert(null)
      return
    }
    oninsert((word: string) => {
      const next = replaceAt(lyrics, caretStart, caretEnd, word)
      caretStart = next.start
      caretEnd = next.end
      onlyrics(next.text)
      queueMicrotask(() => {
        area?.focus()
        if (!area) return
        area.selectionStart = next.start
        area.selectionEnd = next.end
      })
    })
    return () => oninsert(null)
  })

  function remember() {
    if (!area) return
    caretStart = area.selectionStart
    caretEnd = area.selectionEnd
    const picked = wordAt(lyrics, caretStart, caretEnd)
    if (picked) onword(picked)
  }

  function pickToken(token: string) {
    const picked = normalizeWord(token)
    if (picked) onword(picked)
  }

  let shownSections = $derived(kind === 'local' ? parseSections(lyrics) : sections)
</script>

<section class="sheet">
  {#if kind === 'empty'}
    <div class="empty">
      <h1>flow</h1>
      <p>Write a song here. It stays in this browser until you download it.</p>
    </div>
  {:else}
    <div class="tools">
      {#if kind === 'local'}
        <button type="button" class:on={view === 'edit'} onclick={() => (view = 'edit')}>Edit</button>
        <button type="button" class:on={view === 'read'} onclick={() => (view = 'read')}>Read</button>
        <button type="button" onclick={ondownload}>Download</button>
        {#if armedDelete}
          <button type="button" class="danger" onclick={ondelete}>Delete this song</button>
        {:else}
          <button type="button" onclick={() => (armedDelete = true)}>Delete</button>
        {/if}
      {:else}
        <button type="button" onclick={onduplicate}>Copy into my songs</button>
      {/if}
      {#if status}
        <p class="status">{status}</p>
      {/if}
    </div>

    {#if kind === 'local' && view === 'edit'}
      <input
        class="title"
        aria-label="Title"
        placeholder="Song title"
        value={title}
        oninput={(event) => ontitle(event.currentTarget.value)}
      />
      <input
        class="writers"
        aria-label="Writers"
        placeholder="Writers, separated by commas"
        value={writersText}
        oninput={(event) => onwriters(event.currentTarget.value)}
      />
      <textarea
        bind:this={area}
        aria-label="Lyrics"
        spellcheck="false"
        value={lyrics}
        oninput={(event) => {
          onlyrics(event.currentTarget.value)
          remember()
        }}
        onclick={remember}
        onkeyup={remember}
        onselect={remember}
      ></textarea>
      <p class="hint">Put a caret in a word, or select one. The desk on the side looks it up. Click a rhyme to drop it in.</p>
    {:else}
      <p class="date">{dateLabel ? formatDate(dateLabel) : ''}</p>
      <h1>{title.trim() || 'Untitled'}</h1>
      {#if splitWriters(writersText).length > 0}
        <p class="by">Written by {formatWriters(splitWriters(writersText))}</p>
      {/if}
      {#each shownSections as section, index (`${section.label}-${index}`)}
        <div class="block">
          {#if section.label}
            <h2>{section.label}</h2>
          {/if}
          {#each section.lines as line}
            <p class="line">
              {#each lineTokens(line) as token, tokenIndex (`${index}-${tokenIndex}`)}
                {#if token.trim()}
                  <button type="button" class="word" onclick={() => pickToken(token)}>{token}</button>
                {:else}
                  {token}
                {/if}
              {/each}
            </p>
          {/each}
        </div>
      {/each}
      <p class="hint">Click a word to open it in the dictionary, thesaurus, and rhymes.</p>
    {/if}
  {/if}
</section>

<style>
  .sheet {
    min-height: 0;
    overflow: auto;
    padding: 1.25rem 1.4rem 3rem;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.8rem;
    align-items: center;
    margin-bottom: 1.2rem;
  }

  .tools button,
  .hint {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .tools button.on,
  .danger {
    color: var(--ice);
  }

  .status {
    margin: 0 0 0 auto;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .title,
  .writers,
  textarea {
    width: 100%;
    color: var(--text);
    background: transparent;
    border: 0;
    font: inherit;
  }

  .title {
    font-size: clamp(2.2rem, 5vw, 4rem);
    letter-spacing: -0.045em;
    line-height: 0.95;
    padding: 0;
  }

  .writers {
    margin: 0.8rem 0 1rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0 0 0.45rem;
    border-bottom: 1px solid var(--line);
  }

  textarea {
    min-height: 18rem;
    resize: vertical;
    border: 1px solid var(--line);
    background: #0e0e10;
    padding: 0.9rem 1rem;
    line-height: 1.55;
    font-size: 1.05rem;
  }

  .date,
  .by,
  h2 {
    margin: 0;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0.65rem 0 0.8rem;
    font-size: clamp(2.6rem, 6vw, 4.6rem);
    font-weight: 550;
    letter-spacing: -0.045em;
    line-height: 0.92;
  }

  .block {
    margin-top: 2rem;
  }

  h2 {
    margin-bottom: 0.75rem;
    color: var(--ice);
  }

  .line {
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.55;
  }

  .word {
    padding: 0;
    border-bottom: 1px solid transparent;
  }

  .word:hover,
  .word:focus-visible {
    color: var(--ice);
    border-bottom-color: var(--ice);
  }

  .hint {
    margin: 1rem 0 0;
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--font-sans);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .empty {
    padding-top: 3rem;
  }

  .empty p {
    color: var(--muted);
    max-width: 28rem;
    line-height: 1.5;
  }
</style>
