import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import type { DocumentMetadata, ReadingProgress } from '../../types'
import { AutoScrollHud } from './AutoScrollHud'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import { usePersistence } from '../../hooks/usePersistence'
import { useSidebar } from '../Layout/SidebarContext'
import { useTheme } from '../../context/ThemeContext'
import { parseEpubFile } from '../../lib/epubParser'

// Lazy-load document engines so EPUB readers pay 0 PDF bundle cost and vice versa
const EpubReader = lazy(() => import('./Reader').then((m) => ({ default: m.Reader })))
const PdfReader = lazy(() => import('./PdfReader').then((m) => ({ default: m.PdfReader })))

interface ReaderWorkspaceProps {
  documentMeta: DocumentMetadata
  fileBlob: Blob
  initialProgress?: ReadingProgress | null
  onUpdateMetadata?: (updates: Partial<DocumentMetadata>) => void
}

export function ReaderWorkspace({
  documentMeta,
  fileBlob,
  initialProgress,
  onUpdateMetadata,
}: ReaderWorkspaceProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(initialProgress?.epubHref || null)

  const { saveReadingProgressDebounced, saveReadingProgressImmediate } = usePersistence()
  const { setToc, registerNavigation } = useSidebar()
  const { autoScrollSpeed, setAutoScrollSpeed } = useTheme()

  const latestProgressRef = useRef<ReadingProgress>({
    documentId: documentMeta.id,
    format: documentMeta.format,
    percentage: initialProgress?.percentage || 0,
    epubCfi: initialProgress?.epubCfi,
    epubHref: initialProgress?.epubHref,
    pdfPage: initialProgress?.pdfPage || 1,
    pdfScrollOffsetRatio: initialProgress?.pdfScrollOffsetRatio || 0,
    lastUpdated: 0,
  })

  // 1. Setup Auto-Scroll
  const { isPlaying, toggleAutoScroll, stopAutoScroll } = useAutoScroll({
    containerRef: scrollContainerRef,
    speedPxPerSec: autoScrollSpeed,
  })

  // 2. Parse EPUB metadata & TOC if format is epub
  useEffect(() => {
    if (documentMeta.format !== 'epub') return
    let active = true

    parseEpubFile(fileBlob).then(({ metadata, toc }) => {
      if (!active) return
      if (toc && toc.length > 0) {
        setToc(toc)
      }
      if (metadata.title && metadata.title !== documentMeta.title && onUpdateMetadata) {
        onUpdateMetadata({
          title: metadata.title,
          author: metadata.author || documentMeta.author,
          coverUrl: metadata.coverUrl,
        })
      }
    }).catch((err) => {
      console.warn('EPUB metadata parsing error:', err)
    })

    return () => {
      active = false
    }
  }, [documentMeta.id, documentMeta.format, fileBlob, setToc, onUpdateMetadata, documentMeta.title, documentMeta.author])

  // 3. Register navigation callback for sidebar
  useEffect(() => {
    const handleSidebarNavigation = (href: string) => {
      stopAutoScroll()
      if (documentMeta.format === 'epub') {
        setCurrentChapterHref(href)
      }
    }

    registerNavigation(handleSidebarNavigation)
    return () => registerNavigation(() => {})
  }, [documentMeta.format, registerNavigation, stopAutoScroll])

  // 4. Handle EPUB position changes
  const handleEpubPositionChange = useCallback(
    (cfi: string, percentage: number, href?: string) => {
      if (href) setCurrentChapterHref(href)

      const updated: ReadingProgress = {
        documentId: documentMeta.id,
        format: 'epub',
        percentage,
        epubCfi: cfi,
        epubHref: href || currentChapterHref || undefined,
        lastUpdated: Date.now(),
      }

      latestProgressRef.current = updated
      saveReadingProgressDebounced(updated, 300)
    },
    [documentMeta.id, currentChapterHref, saveReadingProgressDebounced],
  )

  // 5. Handle PDF position changes
  const handlePdfPageChange = useCallback(
    (page: number, totalPages: number, offsetRatio: number) => {
      const percentage = totalPages > 0 ? page / totalPages : 0

      const updated: ReadingProgress = {
        documentId: documentMeta.id,
        format: 'pdf',
        percentage,
        pdfPage: page,
        pdfScrollOffsetRatio: offsetRatio,
        lastUpdated: Date.now(),
      }

      latestProgressRef.current = updated
      saveReadingProgressDebounced(updated, 300)
    },
    [documentMeta.id, saveReadingProgressDebounced],
  )

  // 6. Guarantee immediate persistence on tab suspension, visibilitychange, or pagehide
  useEffect(() => {
    const flushSave = () => {
      if (latestProgressRef.current) {
        saveReadingProgressImmediate(latestProgressRef.current)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) flushSave()
    }

    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      flushSave()
      window.removeEventListener('pagehide', flushSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [saveReadingProgressImmediate])

  return (
    <div className="h-full w-full relative flex flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium tracking-wide">Loading engine...</span>
          </div>
        }
      >
        {/* EPUB Document View */}
        {documentMeta.format === 'epub' && (
          <EpubReader
            data={fileBlob}
            documentId={documentMeta.id}
            loading={false}
            initialLocation={initialProgress?.epubCfi || initialProgress?.epubHref}
            initialPercentage={initialProgress?.percentage}
            onPositionChange={handleEpubPositionChange}
            scrollContainerRef={scrollContainerRef}
          />
        )}

        {/* PDF Document View */}
        {documentMeta.format === 'pdf' && (
          <PdfReader
            data={fileBlob}
            documentId={documentMeta.id}
            loading={false}
            initialPage={initialProgress?.pdfPage || 1}
            initialOffsetRatio={initialProgress?.pdfScrollOffsetRatio || 0}
            initialZoom={initialProgress?.pdfZoom || 1.0}
            onPageChange={handlePdfPageChange}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </Suspense>

      {/* Shared Auto-Scroll HUD Controller */}
      <AutoScrollHud
        isPlaying={isPlaying}
        speed={autoScrollSpeed}
        onToggle={toggleAutoScroll}
        onSpeedChange={setAutoScrollSpeed}
      />
    </div>
  )
}
