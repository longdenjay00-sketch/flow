<script lang="ts">
  import { entries, formatDate, formatWriters } from './lib/entries'

  let activeSlug = $state(entries[0]?.slug ?? '')
  let entry = $derived(entries.find((item) => item.slug === activeSlug) ?? null)

  function choose(slug: string) {
    activeSlug = slug
  }
</script>

<div class="page">
  <header class="top">
    <p class="mark">flow</p>
    {#if entries.length > 0}
      <nav class="dates" aria-label="Entries">
        {#each entries as item (item.slug)}
          <button
            type="button"
            class:active={item.slug === entry?.slug}
            aria-current={item.slug === entry?.slug ? 'page' : undefined}
            onclick={() => choose(item.slug)}
          >
            {item.date}
          </button>
        {/each}
      </nav>
    {/if}
  </header>

  <main>
    {#if entry}
      <article>
        <p class="date">{formatDate(entry.date)}</p>
        <h1>{entry.title}</h1>
        {#if entry.writers.length > 0}
          <p class="writers">Written by {formatWriters(entry.writers)}</p>
        {/if}

        {#each entry.sections as section, index (`${section.label}-${index}`)}
          <section>
            {#if section.label}
              <h2>{section.label}</h2>
            {/if}
            {#each section.lines as line}
              <p>{line}</p>
            {/each}
          </section>
        {/each}
      </article>
    {:else}
      <p class="empty">No entries yet.</p>
    {/if}
  </main>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    align-items: baseline;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--line);
  }

  .mark {
    margin: 0;
    font-family: var(--font-mono);
    letter-spacing: 0.22em;
    text-transform: lowercase;
    font-size: 0.78rem;
  }

  .dates {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .dates button {
    padding: 0;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .dates button.active {
    color: var(--ice);
  }

  main {
    width: min(40rem, calc(100% - 2.5rem));
    margin: 0 auto;
    padding: 4.5rem 0 6rem;
  }

  .date,
  .writers,
  h2 {
    font-family: var(--font-mono);
    color: var(--muted);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.72rem;
    font-weight: 500;
  }

  .date,
  .writers {
    margin: 0;
  }

  h1 {
    margin: 0.7rem 0 0.85rem;
    font-size: clamp(3rem, 8vw, 5.4rem);
    font-weight: 550;
    letter-spacing: -0.045em;
    line-height: 0.9;
  }

  section {
    margin-top: 2.4rem;
  }

  h2 {
    margin: 0 0 0.85rem;
    color: var(--ice);
  }

  section p {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.55;
  }

  .empty {
    color: var(--muted);
  }

  @media (max-width: 640px) {
    .top {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.8rem;
    }

    .dates {
      justify-content: flex-start;
    }

    main {
      padding-top: 2.5rem;
    }
  }
</style>
