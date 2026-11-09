import { parseSections, type Section } from './lyrics'

export type { Section }

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
