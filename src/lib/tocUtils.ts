import type { TocItem } from '../components/Layout/SidebarContext'

/**
 * Flattens a nested TOC structure into a single array
 * Useful for finding next/previous chapters
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
 * Finds the index of a chapter in the flattened TOC by href
 */
export function findChapterIndex(flattenedToc: TocItem[], href: string): number {
  return flattenedToc.findIndex((item) => item.href === href)
}

