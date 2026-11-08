import type { TocItem } from '../components/Layout/SidebarContext'

/**
 * Recursively maps and normalizes epub navigation items to clean TocItem hierarchy.
 * Handles arbitrary nesting depth, whitespace trimming, and href normalization.
 */
export function normalizeToc(rawItems: any[] = []): TocItem[] {
  if (!Array.isArray(rawItems)) return []

  return rawItems.map((item, index) => {
    const label = (item.label || item.title || `Chapter ${index + 1}`).trim().replace(/\s+/g, ' ')
    const href = (item.href || '').trim()
    const id = item.id || `toc-${index}-${href}`

    const subitems = item.subitems && Array.isArray(item.subitems) && item.subitems.length > 0
      ? normalizeToc(item.subitems)
      : undefined

    return {
      id,
      href,
      label,
      subitems,
    }
  })
}

/**
 * Flattens a nested TOC structure into a single array
 * Useful for finding next/previous chapters and linear navigation
 */
export function flattenToc(toc: TocItem[]): TocItem[] {
  const result: TocItem[] = []

  function traverse(items: TocItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.subitems && item.subitems.length > 0) {
        traverse(item.subitems)
      }
    }
  }

  traverse(toc)
  return result
}

/**
 * Finds the index of a chapter in the flattened TOC by href.
 * Supports exact match and stripped fragment/relative path matching.
 */
export function findChapterIndex(flattenedToc: TocItem[], href: string): number {
  if (!href) return -1

  // 1. Exact match
  const exactIndex = flattenedToc.findIndex((item) => item.href === href)
  if (exactIndex !== -1) return exactIndex

  // 2. Normalized match (without query or hash fragment)
  const cleanHref = href.split('#')[0].split('?')[0]
  const normalizedIndex = flattenedToc.findIndex((item) => {
    const itemClean = item.href.split('#')[0].split('?')[0]
    return itemClean === cleanHref || item.href.endsWith(cleanHref) || cleanHref.endsWith(itemClean)
  })

  return normalizedIndex
}
