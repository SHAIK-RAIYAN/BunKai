import { useEffect } from 'react'
import ePub from 'epubjs'
import type { Book } from 'epubjs'
import type { TocItem } from './Layout/SidebarContext'
import type { BookMeta } from '../types'

interface BookParserProps {
  data: ArrayBuffer
  onMetadataLoaded: (meta: BookMeta) => void
  onTocLoaded: (toc: TocItem[]) => void
}

export function BookParser({ data, onMetadataLoaded, onTocLoaded }: BookParserProps) {
  useEffect(() => {
    if (!data) return

    const book: Book = ePub(data)

    book.ready.then(() => {
      // Extract metadata
      const packageData = (book as any).package
      const metadataObj = packageData?.metadata || {}
      const title = metadataObj.title || metadataObj['dc:title'] || 'Untitled'
      const creator = metadataObj.creator || metadataObj['dc:creator'] || 'Unknown Author'
      
      const metadata: BookMeta = {
        title: Array.isArray(title) ? title[0] : title,
        author: Array.isArray(creator) ? creator[0] : creator,
      }
      onMetadataLoaded(metadata)

      // Extract TOC
      const navigation = book.navigation
      if (navigation && navigation.toc) {
        const tocItems: TocItem[] = navigation.toc.map((item: any) => ({
          id: item.id,
          href: item.href,
          label: item.label,
          subitems: item.subitems
            ? item.subitems.map((subitem: any) => ({
                id: subitem.id,
                href: subitem.href,
                label: subitem.label,
              }))
            : undefined,
        }))
        onTocLoaded(tocItems)
      } else {
        onTocLoaded([])
      }
    })

    return () => {
      book.destroy()
    }
  }, [data, onMetadataLoaded, onTocLoaded])

  return null
}

