<script lang="ts">
  import SongList from './lib/SongList.svelte'
  import SongSheet from './lib/SongSheet.svelte'
  import WordDesk from './lib/WordDesk.svelte'
  import { entries } from './lib/entries'
  import { sectionsToLyrics } from './lib/lyrics'
  import {
    blankSong,
    downloadSong,
    loadSongs,
    saveSongs,
    type LocalSong,
  } from './lib/localSongs'

  let songs = $state<LocalSong[]>(loadSongs())
  let activeKey = $state(entries[0] ? `repo:${entries[0].slug}` : '')
  let panel = $state<'songs' | 'song' | 'words'>('song')
  let lookup = $state('')
  let saveNote = $state('')
  let insertWord = $state<((word: string) => void) | null>(null)

  let activeSong = $derived(songs.find((song) => activeKey === `local:${song.id}`) ?? null)
  let activeEntry = $derived(entries.find((entry) => activeKey === `repo:${entry.slug}`) ?? null)
  let editing = $derived(activeSong !== null)

  function select(key: string) {
    activeKey = key
    panel = 'song'
    saveNote = key.startsWith('local:') ? 'Saved on this device' : ''
  }

  function persist(next: LocalSong[], note: string) {
    songs = next
    saveNote = saveSongs(next) ? note : "Couldn't save in this browser."
  }

  function createSong() {
    const song = blankSong()
    persist([song, ...songs], 'Saved on this device')
    activeKey = `local:${song.id}`
    panel = 'song'
  }

  function patch(partial: Partial<LocalSong>) {
    if (!activeSong) return
    const id = activeSong.id
    persist(
      songs.map((song) =>
        song.id === id ? { ...song, ...partial, updated: new Date().toISOString() } : song,
      ),
      'Saved on this device',
    )
  }

  function removeSong() {
    if (!activeSong) return
    const id = activeSong.id
    const next = songs.filter((song) => song.id !== id)
    persist(next, '')
    activeKey = next[0] ? `local:${next[0].id}` : entries[0] ? `repo:${entries[0].slug}` : ''
  }

  function duplicateEntry() {
    if (!activeEntry) return
    const song = blankSong()
    song.title = activeEntry.title
    song.writers = activeEntry.writers.join(', ')
    song.lyrics = sectionsToLyrics(activeEntry.sections)
    persist([song, ...songs], 'Copied onto this device')
    activeKey = `local:${song.id}`
    panel = 'song'
  }

  function pickSuggestion(word: string) {
    lookup = word
    insertWord?.(word)
  }
</script>

<div class="shell" data-panel={panel}>
  <header>
    <div class="brand">
      <p class="mark">flow</p>
      <button type="button" class="new" onclick={createSong}>New song</button>
    </div>
    <div class="tabs" role="tablist" aria-label="Sections">
      <button type="button" role="tab" aria-selected={panel === 'songs'} onclick={() => (panel = 'songs')}>Songs</button>
      <button type="button" role="tab" aria-selected={panel === 'song'} onclick={() => (panel = 'song')}>Song</button>
      <button type="button" role="tab" aria-selected={panel === 'words'} onclick={() => (panel = 'words')}>Words</button>
    </div>
  </header>

  <SongList {entries} {songs} {activeKey} onselect={select} />

  <SongSheet
    kind={activeSong ? 'local' : activeEntry ? 'repo' : 'empty'}
    songKey={activeKey}
    title={activeSong ? activeSong.title : activeEntry?.title ?? ''}
    writersText={activeSong ? activeSong.writers : activeEntry?.writers.join(', ') ?? ''}
    dateLabel={activeSong ? activeSong.updated : activeEntry?.date ?? ''}
    lyrics={activeSong?.lyrics ?? ''}
    sections={activeEntry?.sections ?? []}
    status={activeSong ? saveNote : ''}
    onword={(word) => (lookup = word)}
    ontitle={(value) => patch({ title: value })}
    onwriters={(value) => patch({ writers: value })}
    onlyrics={(value) => patch({ lyrics: value })}
    ondownload={() => activeSong && downloadSong(activeSong)}
    ondelete={removeSong}
    onduplicate={duplicateEntry}
    oninsert={(insert) => (insertWord = insert)}
  />

  <WordDesk incoming={lookup} {editing} onpick={pickSuggestion} />
</div>

<style>
  .shell {
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-columns: 16.5rem minmax(0, 1fr) 22rem;
    grid-template-rows: auto minmax(0, 1fr);
  }

  header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--line);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mark {
    margin: 0;
    font-family: var(--font-mono);
    letter-spacing: 0.22em;
    font-size: 0.78rem;
  }

  .new,
  .tabs button {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ice);
  }

  .tabs {
    display: none;
    gap: 0.9rem;
  }

  .tabs button[aria-selected='false'] {
    color: var(--muted);
  }

  @media (max-width: 900px) {
    .shell {
      grid-template-columns: 1fr;
    }

    .tabs {
      display: flex;
    }

    .shell :global(.list),
    .shell :global(.sheet),
    .shell :global(.desk) {
      display: none;
    }

    .shell[data-panel='songs'] :global(.list),
    .shell[data-panel='song'] :global(.sheet),
    .shell[data-panel='words'] :global(.desk) {
      display: block;
    }
  }
</style>
