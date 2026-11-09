<script lang="ts">
  import { lookupWord, type LookupResult } from './lookup'
  import { normalizeWord } from './lyrics'

  let {
    incoming,
    editing,
    onpick,
  }: {
    incoming: string
    editing: boolean
    onpick: (word: string) => void
  } = $props()

  let query = $state('')
  let result = $state<LookupResult | null>(null)
  let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle')
  let error = $state('')
  let player: HTMLAudioElement | undefined

  $effect(() => {
    query = incoming
  })

  $effect(() => {
    const word = normalizeWord(query)
    let controller: AbortController | undefined
    const timer = setTimeout(() => {
      if (!word) {
        result = null
        error = ''
        status = 'idle'
        return
      }
      controller = new AbortController()
      status = 'loading'
      error = ''
      lookupWord(word, controller.signal)
        .then((next) => {
          if (controller?.signal.aborted) return
          result = next
          status = 'ready'
        })
        .catch((reason: unknown) => {
          if (controller?.signal.aborted) return
          if (reason instanceof DOMException && reason.name === 'AbortError') return
          result = null
          status = 'error'
          error = 'Lookup failed. Check the connection and try that word again.'
        })
    }, 280)
    return () => {
      clearTimeout(timer)
      controller?.abort()
    }
  })

  function play(src: string) {
    if (!player) player = new Audio()
    player.src = src
    void player.play()
  }

  function use(word: string) {
    query = word
    if (editing) onpick(word)
  }
</script>

{#snippet chips(words: string[])}
  {#if words.length === 0}
    <p class="none">None.</p>
  {:else}
    <div class="chips">
      {#each words as word (word)}
        <button type="button" onmousedown={(event) => event.preventDefault()} onclick={() => use(word)}>
          {word}
        </button>
      {/each}
    </div>
  {/if}
{/snippet}

<aside class="desk">
  <label>
    <span>Look up</span>
    <input
      value={query}
      placeholder="Type a word"
      spellcheck="false"
      oninput={(event) => (query = event.currentTarget.value)}
    />
  </label>
  <p class="how">
    {#if editing}
      Click a word to drop it into the song.
    {:else}
      Click a word in the song, then chain from these lists.
    {/if}
  </p>

  {#if status === 'loading'}
    <p class="wait">Looking…</p>
  {/if}
  {#if status === 'idle'}
    <p class="wait">Dictionary, thesaurus, and rhymes show up here.</p>
  {:else if status === 'error'}
    <p class="wait">{error}</p>
  {:else if result}
    <section>
      <h2>Dictionary</h2>
      <p class="headword">
        {result.word}
        {#if result.phonetic}<span>{result.phonetic}</span>{/if}
        {#if result.audio}
          <button type="button" class="play" onclick={() => result && play(result.audio)}>Play</button>
        {/if}
      </p>
      {#if result.dictionaryNote}
        <p class="none">{result.dictionaryNote}</p>
      {/if}
      {#each result.definitions as item, index (`${item.partOfSpeech}-${index}`)}
        <p class="def">
          {#if item.partOfSpeech}<em>{item.partOfSpeech}</em>{/if}
          {item.definition}
        </p>
        {#if item.example}
          <p class="example">{item.example}</p>
        {/if}
      {/each}
    </section>

    <section>
      <h2>Thesaurus</h2>
      <h3>Synonyms</h3>
      {@render chips(result.synonyms)}
      <h3>Antonyms</h3>
      {@render chips(result.antonyms)}
      {#if result.synonyms.length < 3 && result.related.length > 0}
        <h3>Related</h3>
        {@render chips(result.related)}
      {/if}
    </section>

    <section>
      <h2>Rhymes</h2>
      <h3>Perfect</h3>
      {@render chips(result.rhymes)}
      <h3>Near</h3>
      {@render chips(result.nearRhymes)}
    </section>
  {/if}
</aside>

<style>
  .desk {
    min-height: 0;
    overflow: auto;
    border-left: 1px solid var(--line);
    padding: 1rem 1rem 2.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  label span,
  h2,
  h3,
  .play {
    font-family: var(--font-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.68rem;
    font-weight: 500;
  }

  label span,
  h3,
  .how,
  .wait,
  .none,
  .example {
    color: var(--muted);
  }

  h2 {
    margin: 0 0 0.7rem;
    color: var(--ice);
  }

  h3 {
    margin: 0.85rem 0 0.4rem;
  }

  input {
    width: 100%;
    background: transparent;
    color: var(--text);
    border: 0;
    border-bottom: 1px solid var(--line);
    font: inherit;
    font-size: 1.35rem;
    padding: 0.2rem 0 0.4rem;
  }

  .how,
  .wait,
  .none,
  .def,
  .example,
  .headword {
    line-height: 1.45;
  }

  .how,
  .wait {
    font-size: 0.92rem;
  }

  section {
    margin-top: 1.6rem;
  }

  .headword {
    margin: 0 0 0.7rem;
    font-size: 1.25rem;
  }

  .headword span,
  .play {
    margin-left: 0.45rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .def,
  .example,
  .none,
  .how,
  .wait,
  .headword {
    margin-top: 0;
  }

  .def em {
    margin-right: 0.4rem;
    color: var(--ice);
    font-style: normal;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .example {
    margin: -0.2rem 0 0.75rem;
    font-size: 0.92rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chips button {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.32rem 0.6rem;
    font-size: 0.92rem;
  }

  .chips button:hover,
  .chips button:focus-visible {
    border-color: var(--ice);
    color: var(--ice);
  }
</style>
