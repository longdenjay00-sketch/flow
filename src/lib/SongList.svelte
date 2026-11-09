<script lang="ts">
  import type { Entry } from './entries'
  import type { LocalSong } from './localSongs'

  let {
    entries,
    songs,
    activeKey,
    onselect,
  }: {
    entries: Entry[]
    songs: LocalSong[]
    activeKey: string
    onselect: (key: string) => void
  } = $props()
</script>

<aside class="list">
  <section>
    <h2>On this device</h2>
    {#if songs.length === 0}
      <p class="hint">New song starts a page only you can see, saved in this browser.</p>
    {:else}
      <ul>
        {#each songs as song (song.id)}
          <li>
            <button
              type="button"
              class:active={activeKey === `local:${song.id}`}
              aria-current={activeKey === `local:${song.id}` ? 'true' : undefined}
              onclick={() => onselect(`local:${song.id}`)}
            >
              <span>{song.title.trim() || 'Untitled'}</span>
              <small>yours</small>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2>On the site</h2>
    {#if entries.length === 0}
      <p class="hint">No songs shipped with the site yet.</p>
    {:else}
      <ul>
        {#each entries as entry (entry.slug)}
          <li>
            <button
              type="button"
              class:active={activeKey === `repo:${entry.slug}`}
              aria-current={activeKey === `repo:${entry.slug}` ? 'page' : undefined}
              onclick={() => onselect(`repo:${entry.slug}`)}
            >
              <span>{entry.title}</span>
              <small>{entry.date}</small>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</aside>

<style>
  .list {
    min-height: 0;
    overflow: auto;
    border-right: 1px solid var(--line);
    padding: 1rem 0.9rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h2 {
    margin: 0 0 0.7rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  button {
    width: 100%;
    text-align: left;
    padding: 0.55rem 0.6rem;
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: baseline;
    color: var(--text);
  }

  button.active {
    background: #19191c;
    color: var(--ice);
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    flex: none;
  }

  .hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.45;
  }
</style>
