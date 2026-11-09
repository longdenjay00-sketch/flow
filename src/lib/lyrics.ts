export type Section = {
  label: string
  lines: string[]
}

const WORD = /[A-Za-z0-9']/

export function parseSections(body: string): Section[] {
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

export function sectionsToLyrics(sections: Section[]): string {
  return sections
    .map((section) => {
      const head = section.label ? `[${section.label}]\n` : ''
      return `${head}${section.lines.join('\n')}`
    })
    .join('\n\n')
}

export function lineTokens(line: string): string[] {
  return line.split(/(\s+)/).filter((token) => token.length > 0)
}

export function normalizeWord(raw: string): string {
  const match = raw.toLowerCase().match(/[a-z][a-z']*/g)
  if (!match) return ''
  return match[match.length - 1].replace(/^'+|'+$/g, '')
}

export function wordAt(text: string, start: number, end: number): string {
  if (start !== end) return normalizeWord(text.slice(start, end))
  let from = start
  let to = start
  while (from > 0 && WORD.test(text[from - 1] ?? '')) from -= 1
  while (to < text.length && WORD.test(text[to] ?? '')) to += 1
  return normalizeWord(text.slice(from, to))
}

export function replaceAt(
  text: string,
  start: number,
  end: number,
  word: string,
): { text: string; start: number; end: number } {
  let from = start
  let to = end
  if (from === to) {
    while (from > 0 && WORD.test(text[from - 1] ?? '')) from -= 1
    while (to < text.length && WORD.test(text[to] ?? '')) to += 1
  }
  const next = text.slice(0, from) + word + text.slice(to)
  const caret = from + word.length
  return { text: next, start: caret, end: caret }
}

export function formatDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
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

export function splitWriters(value: string): string[] {
  return value
    .split(',')
    .map((writer) => writer.trim())
    .filter(Boolean)
}
