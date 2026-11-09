import { normalizeWord } from './lyrics'

export type Definition = {
  partOfSpeech: string
  definition: string
  example: string
}

export type LookupResult = {
  word: string
  phonetic: string
  audio: string
  definitions: Definition[]
  synonyms: string[]
  antonyms: string[]
  related: string[]
  rhymes: string[]
  nearRhymes: string[]
  dictionaryNote: string
}

type DatamuseWord = { word?: string }
type DictionaryEntry = {
  phonetic?: string
  phonetics?: { text?: string; audio?: string }[]
  meanings?: {
    partOfSpeech?: string
    synonyms?: string[]
    antonyms?: string[]
    definitions?: {
      definition?: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }[]
  }[]
}

function unique(words: string[], skip: string): string[] {
  const seen = new Set<string>([skip])
  const list: string[] = []
  for (const word of words) {
    const clean = word.trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key)) continue
    seen.add(key)
    list.push(clean)
  }
  return list
}

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as Error & { status: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

function wordsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' ? (item as DatamuseWord).word ?? '' : ''))
    .filter(Boolean)
}

function fromDictionary(value: unknown, word: string): Pick<
  LookupResult,
  'phonetic' | 'audio' | 'definitions' | 'synonyms' | 'antonyms' | 'dictionaryNote'
> {
  const empty = {
    phonetic: '',
    audio: '',
    definitions: [] as Definition[],
    synonyms: [] as string[],
    antonyms: [] as string[],
    dictionaryNote: 'No dictionary entry.',
  }
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== 'object') return empty
  const entry = value[0] as DictionaryEntry
  const phonetics = entry.phonetics ?? []
  const phonetic = entry.phonetic || phonetics.find((item) => item.text)?.text || ''
  const audio = phonetics.find((item) => item.audio)?.audio || ''
  const definitions: Definition[] = []
  const synonyms: string[] = []
  const antonyms: string[] = []

  for (const meaning of entry.meanings ?? []) {
    synonyms.push(...(meaning.synonyms ?? []))
    antonyms.push(...(meaning.antonyms ?? []))
    for (const item of meaning.definitions ?? []) {
      synonyms.push(...(item.synonyms ?? []))
      antonyms.push(...(item.antonyms ?? []))
      if (!item.definition || definitions.length >= 5) continue
      definitions.push({
        partOfSpeech: meaning.partOfSpeech ?? '',
        definition: item.definition,
        example: item.example ?? '',
      })
    }
  }

  return {
    phonetic,
    audio,
    definitions,
    synonyms: unique(synonyms, word).slice(0, 24),
    antonyms: unique(antonyms, word).slice(0, 16),
    dictionaryNote: definitions.length === 0 ? 'No dictionary entry.' : '',
  }
}

export async function lookupWord(raw: string, signal: AbortSignal): Promise<LookupResult> {
  const word = normalizeWord(raw)
  if (!word) throw new Error('empty')
  const encoded = encodeURIComponent(word)
  const [dictionary, synonyms, antonyms, related, rhymes, near] = await Promise.allSettled([
    readJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`, signal),
    readJson(`https://api.datamuse.com/words?rel_syn=${encoded}&max=24`, signal),
    readJson(`https://api.datamuse.com/words?rel_ant=${encoded}&max=16`, signal),
    readJson(`https://api.datamuse.com/words?ml=${encoded}&max=12`, signal),
    readJson(`https://api.datamuse.com/words?rel_rhy=${encoded}&max=30`, signal),
    readJson(`https://api.datamuse.com/words?rel_nry=${encoded}&max=20`, signal),
  ])

  if (dictionary.status === 'rejected' && dictionary.reason?.name === 'AbortError') {
    throw dictionary.reason
  }

  const networkFailed = [dictionary, synonyms, rhymes].every((item) => item.status === 'rejected')
  if (networkFailed) {
    const reason = dictionary.status === 'rejected' ? dictionary.reason : null
    if (reason && typeof reason === 'object' && 'status' in reason && reason.status === 404) {
      // A missing word is not a dead connection when the other calls also failed.
    } else {
      throw new Error('lookup failed')
    }
  }

  const dict =
    dictionary.status === 'fulfilled'
      ? fromDictionary(dictionary.value, word)
      : fromDictionary(null, word)
  const dictStatus =
    dictionary.status === 'rejected' &&
    typeof dictionary.reason === 'object' &&
    dictionary.reason &&
    'status' in dictionary.reason &&
    dictionary.reason.status === 404
  if (dictStatus) dict.dictionaryNote = 'No dictionary entry.'

  const synonymWords =
    dict.synonyms.length > 0
      ? dict.synonyms
      : synonyms.status === 'fulfilled'
        ? unique(wordsFrom(synonyms.value), word).slice(0, 24)
        : []
  const extraSynonyms =
    dict.synonyms.length > 0 && synonyms.status === 'fulfilled'
      ? unique([...dict.synonyms, ...wordsFrom(synonyms.value)], word).slice(0, 24)
      : synonymWords

  return {
    word,
    phonetic: dict.phonetic,
    audio: dict.audio,
    definitions: dict.definitions,
    synonyms: extraSynonyms,
    antonyms:
      dict.antonyms.length > 0
        ? dict.antonyms
        : antonyms.status === 'fulfilled'
          ? unique(wordsFrom(antonyms.value), word).slice(0, 16)
          : [],
    related: related.status === 'fulfilled' ? unique(wordsFrom(related.value), word).slice(0, 12) : [],
    rhymes: rhymes.status === 'fulfilled' ? unique(wordsFrom(rhymes.value), word).slice(0, 30) : [],
    nearRhymes: near.status === 'fulfilled' ? unique(wordsFrom(near.value), word).slice(0, 20) : [],
    dictionaryNote: dict.dictionaryNote,
  }
}
