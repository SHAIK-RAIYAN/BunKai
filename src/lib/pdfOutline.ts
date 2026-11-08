import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TocItem } from '../components/Layout/SidebarContext'

interface ExplicitDestination {
  pageIndex: number
  destY?: number
}

/**
 * Resolves a PDF.js destination (named string or explicit array) into a 0-based page index and optional Y coordinate.
 */
export async function resolvePdfDestination(
  doc: PDFDocumentProxy,
  dest: string | unknown[] | null | undefined,
): Promise<ExplicitDestination | null> {
  if (!dest) return null

  try {
    let explicitDest: unknown[] | null = null

    if (typeof dest === 'string') {
      explicitDest = (await doc.getDestination(dest)) as unknown[] | null
    } else if (Array.isArray(dest)) {
      explicitDest = dest
    }

    if (!Array.isArray(explicitDest) || explicitDest.length === 0) {
      return null
    }

    const pageRef = explicitDest[0]
    let pageIndex: number

    if (typeof pageRef === 'number') {
      pageIndex = pageRef
    } else if (pageRef && typeof pageRef === 'object') {
      pageIndex = await doc.getPageIndex(pageRef as any)
    } else {
      return null
    }

    if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= doc.numPages) {
      return null
    }

    // Extract coordinate hints (e.g., XYZ, FitH, FitBH, FitR)
    let destY: number | undefined = undefined
    if (explicitDest.length >= 4 && typeof explicitDest[3] === 'number') {
      destY = explicitDest[3]
    } else if (explicitDest.length >= 3 && typeof explicitDest[2] === 'number') {
      destY = explicitDest[2]
    }

    return { pageIndex, destY }
  } catch (err) {
    console.warn('Failed to resolve PDF destination:', dest, err)
    return null
  }
}

/**
 * Recursively extracts and normalizes the PDF document outline into BunKai TocItem structure.
 */
export async function extractPdfToc(doc: PDFDocumentProxy): Promise<TocItem[]> {
  try {
    const rawOutline = await doc.getOutline()
    if (!rawOutline || !Array.isArray(rawOutline) || rawOutline.length === 0) {
      return []
    }

    const processItems = async (items: any[], pathPrefix = '0'): Promise<TocItem[]> => {
      const results: TocItem[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const currentPath = `${pathPrefix}-${i}`

        let href = `#section-${currentPath}`
        if (item.dest) {
          const resolved = await resolvePdfDestination(doc, item.dest)
          if (resolved) {
            const pageNum = resolved.pageIndex + 1
            href = `pdf:page=${pageNum}${resolved.destY !== undefined ? `&y=${resolved.destY}` : ''}`
          }
        }

        let subitems: TocItem[] | undefined = undefined
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
          subitems = await processItems(item.items, currentPath)
        }

        results.push({
          id: `pdf-outline-${currentPath}`,
          label: item.title?.trim() || `Section ${i + 1}`,
          href,
          subitems: subitems && subitems.length > 0 ? subitems : undefined,
        })
      }

      return results
    }

    return await processItems(rawOutline)
  } catch (err) {
    console.warn('Could not extract PDF outline:', err)
    return []
  }
}
