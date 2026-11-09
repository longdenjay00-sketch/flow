import { splitWriters } from './lyrics'

export type LocalSong = {
  id: string
  title: string
  writers: string
  lyrics: string
  updated: string
}

const KEY = 'flow.songs.v1'

function isSong(value: unknown): value is LocalSong {
  if (!value || typeof value !== 'object') return false
  const song = value as Partial<LocalSong>
  return (
    typeof song.id === 'string' &&
    typeof song.title === 'string' &&
    typeof song.writers === 'string' &&
    typeof song.lyrics === 'string' &&
    typeof song.updated === 'string'
  )
}

export function loadSongs(): LocalSong[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSong)
  } catch {
    return []
  }
}

export function saveSongs(songs: LocalSong[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(songs))
    return true
  } catch {
    return false
  }
}

export function blankSong(): LocalSong {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    title: '',
    writers: '',
    lyrics: '[Hook]\n\n[Verse]\n',
    updated: now.toISOString(),
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

export function songFilename(song: LocalSong): string {
  const date = song.updated.slice(0, 10) || 'song'
  const slug = (song.title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${date}-${slug || 'untitled'}.md`
}

export function songMarkdown(song: LocalSong): string {
  const title = song.title.trim() || 'Untitled'
  const date = song.updated.slice(0, 10)
  const writers = splitWriters(song.writers)
  const writerBlock =
    writers.length === 0
      ? 'writers: []'
      : `writers:\n${writers.map((writer) => `  - ${yamlString(writer)}`).join('\n')}`
  return `---\ntitle: ${yamlString(title)}\ndate: ${date}\n${writerBlock}\n---\n\n# ${title}\n\n${song.lyrics.trim()}\n`
}

export function downloadSong(song: LocalSong) {
  const blob = new Blob([songMarkdown(song)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = songFilename(song)
  link.click()
  URL.revokeObjectURL(url)
}
