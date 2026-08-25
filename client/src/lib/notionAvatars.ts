/** Notion-style avatars from https://github.com/alohe/avatars (png/notion_1…15). */

export const NOTION_AVATAR_COUNT = 15

const CDN = 'https://raw.githubusercontent.com/alohe/avatars/main/png'

/** Default showcase avatar (notion_13 — the envelope / pointing figure). */
export const DEFAULT_NOTION_AVATAR = 13

export function notionAvatarUrl(index: number): string {
  const n = ((Math.floor(index) - 1) % NOTION_AVATAR_COUNT + NOTION_AVATAR_COUNT) % NOTION_AVATAR_COUNT + 1
  return `${CDN}/notion_${n}.png`
}

/** Stable 1–15 pick from a name or id so the same person keeps the same face. */
export function notionAvatarIndexFor(seed: string): number {
  const s = seed.trim().toLowerCase()
  if (!s) return DEFAULT_NOTION_AVATAR
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return (h % NOTION_AVATAR_COUNT) + 1
}

export function notionAvatarFor(seed: string): string {
  return notionAvatarUrl(notionAvatarIndexFor(seed))
}

/** All 15 URLs — useful for loaders / pickers. */
export const NOTION_AVATAR_URLS: string[] = Array.from({ length: NOTION_AVATAR_COUNT }, (_, i) =>
  notionAvatarUrl(i + 1),
)

/** True if this looks like a legacy local placeholder we should replace. */
export function isLegacyPlaceholderAvatar(url?: string | null): boolean {
  if (!url) return true
  return (
    url.includes('/avatars/demo-patient') ||
    url.includes('/avatars/demo-') ||
    url.endsWith('demo-patient.svg')
  )
}

export function resolveAvatarUrl(seed: string, existing?: string | null): string {
  if (existing && !isLegacyPlaceholderAvatar(existing)) return existing
  return notionAvatarFor(seed)
}
