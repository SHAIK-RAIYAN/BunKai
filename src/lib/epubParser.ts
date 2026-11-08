import ePub from 'epubjs'
import type { Book } from 'epubjs'
import type { TocItem } from '../components/Layout/SidebarContext'
import type { DocumentMetadata } from '../types'
import { normalizeToc } from './tocUtils'

export interface ParsedEpubData {
  metadata: Partial<DocumentMetadata>
  toc: TocItem[]
  coverUrl?: string
}

/**
 * Parses EPUB file data once to extract metadata, full recursive TOC, and cover image.
 * Safely cleans up the temporary Book instance.
 */
export async function parseEpubFile(data: ArrayBuffer | Blob): Promise<ParsedEpubData> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data
  const book: Book = ePub(buffer)

  try {
    await book.ready

    // 1. Extract metadata
    const pkg = (book as any).package
    const metadataObj = pkg?.metadata || {}
    const rawTitle = metadataObj.title || metadataObj['dc:title'] || 'Untitled'
    const rawCreator = metadataObj.creator || metadataObj['dc:creator'] || 'Unknown Author'

    const title = Array.isArray(rawTitle) ? rawTitle[0] : String(rawTitle).trim()
    const author = Array.isArray(rawCreator) ? rawCreator[0] : String(rawCreator).trim()

    // 2. Extract cover image URL if available
    let coverUrl: string | undefined = undefined
    try {
      const coverPath = await book.coverUrl()
      if (coverPath) {
        coverUrl = coverPath
      }
    } catch (coverErr) {
      console.warn('Could not extract EPUB cover image:', coverErr)
    }

    // 3. Extract and recursively normalize TOC
    let toc: TocItem[] = []
    const navigation = book.navigation
    if (navigation && navigation.toc && Array.isArray(navigation.toc)) {
      toc = normalizeToc(navigation.toc)
    }

    return {
      metadata: {
        title: title || 'Untitled',
        author: author || 'Unknown Author',
        coverUrl,
      },
      toc,
      coverUrl,
    }
  } finally {
    try {
      book.destroy()
    } catch {
      // Ignore destruction error
    }
  }
}

