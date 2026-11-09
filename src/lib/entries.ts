export type Section = {
  label: string
  lines: string[]
}

export type Entry = {
  slug: string
  title: string
  date: string
  writers: string[]
  sections: Section[]
}

type Frontmatter = Record<string, string | string[]>

const entryFiles = import.meta.glob('../../entries/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: raw }

  const data: Frontmatter = {}
  let listKey: string | null = null

  for (const line of match[1].split('\n')) {
    const item = line.match(/^\s*-\s+(.*)$/)
    if (item && listKey) {
      const current = data[listKey]
      const list = Array.isArray(current) ? current : []
      list.push(item[1].trim())
      data[listKey] = list
      continue
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!field) continue

    listKey = null
    const value = field[2].trim()
    if (value === '') {
      data[field[1]] = []
      listKey = field[1]
    } else {
      data[field[1]] = value
    }
  }

  return { data, body: raw.slice(match[0].length) }
}

function asText(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value
  return ''
}

function asList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value) return [value]
  return []
}

function parseSections(body: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null

  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    const label = trimmed.match(/^\[(.+)]$/)
    if (label) {
      current = { label: label[1], lines: [] }
      sections.push(current)
      continue
    }
    if (!trimmed || trimmed.startsWith('#') || /written by /i.test(trimmed)) continue
    if (!current) {
      current = { label: '', lines: [] }
      sections.push(current)
    }
    current.lines.push(trimmed)
  }

  return sections.filter((section) => section.lines.length > 0)
}

function slugFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

export const entries: Entry[] = Object.entries(entryFiles)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw)
    const slug = slugFromPath(path)
    return {
      slug,
      title: asText(data.title) || slug,
      date: asText(data.date) || slug,
      writers: asList(data.writers),
      sections: parseSections(body),
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug))

export function formatDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return iso
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatWriters(writers: string[]): string {
  if (writers.length === 0) return ''
  if (writers.length === 1) return writers[0]
  if (writers.length === 2) return `${writers[0]} and ${writers[1]}`
  return `${writers.slice(0, -1).join(', ')}, and ${writers[writers.length - 1]}`
}
