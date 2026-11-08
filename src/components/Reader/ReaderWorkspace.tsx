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
  const { setToc } = useSidebar()
  const { autoScrollSpeed, setAutoScrollSpeed } = useTheme()

  const latestProgressRef = useRef<ReadingProgress>({
    documentId: documentMeta.id,
    format: documentMeta.format,
    percentage: initialProgress?.percentage || 0,
    epubCfi: initialProgress?.epubCfi,
    epubHref: initialProgress?.epubHref,
    pdfPage: initialProgress?.pdfPage || 1,
    pdfScrollOffsetRatio: initialProgress?.pdfScrollOffsetRatio || 0,
    activeReadingSeconds: initialProgress?.activeReadingSeconds || 0,
    completed: initialProgress?.completed || false,
    celebrationState: initialProgress?.celebrationState || 'not_completed',
    lastUpdated: 0,
  })

  // 1. Setup Auto-Scroll
  const { isPlaying, toggleAutoScroll, stopAutoScroll: _stopAutoScroll } = useAutoScroll({
    containerRef: scrollContainerRef,
    speedPxPerSec: autoScrollSpeed,
  })

  // Track active foreground reading time safely
  useEffect(() => {
    let lastTick = Date.now()
    const timer = setInterval(() => {
      const now = Date.now()
      const delta = Math.round((now - lastTick) / 1000)
      lastTick = now

      if (document.visibilityState === 'visible' && !document.hidden && delta > 0 && delta <= 3) {
        if (latestProgressRef.current) {
          latestProgressRef.current.activeReadingSeconds =
            (latestProgressRef.current.activeReadingSeconds || 0) + delta
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  // 3. Handle EPUB position changes
  const handleEpubPositionChange = useCallback(
    (cfi: string, percentage: number, href?: string) => {
      if (href) setCurrentChapterHref(href)

      const isCompleted = percentage >= 0.99
      const prevCelebration = latestProgressRef.current.celebrationState
      const celebrationState = isCompleted
        ? prevCelebration === 'consumed'
          ? 'consumed'
          : 'pending'
        : (prevCelebration || 'not_completed')

      const updated: ReadingProgress = {
        documentId: documentMeta.id,
        format: 'epub',
        percentage: isCompleted ? 1.0 : percentage,
        epubCfi: cfi,
        epubHref: href || currentChapterHref || undefined,
        activeReadingSeconds: latestProgressRef.current.activeReadingSeconds || 0,
        completed: isCompleted || latestProgressRef.current.completed || false,
        celebrationState,
        lastUpdated: Date.now(),
      }

      latestProgressRef.current = updated
      saveReadingProgressDebounced(updated, 300)
    },
    [documentMeta.id, currentChapterHref, saveReadingProgressDebounced],
  )

  // 4. Handle PDF position changes
  const handlePdfPageChange = useCallback(
    (page: number, totalPages: number, offsetRatio: number) => {
      const rawPct = totalPages > 0 ? page / totalPages : 0
      const isCompleted = page === totalPages && totalPages > 0
      const percentage = isCompleted ? 1.0 : rawPct
      const prevCelebration = latestProgressRef.current.celebrationState
      const celebrationState = isCompleted
        ? prevCelebration === 'consumed'
          ? 'consumed'
          : 'pending'
        : (prevCelebration || 'not_completed')

      const updated: ReadingProgress = {
        documentId: documentMeta.id,
        format: 'pdf',
        percentage,
        pdfPage: page,
        pdfScrollOffsetRatio: offsetRatio,
        activeReadingSeconds: latestProgressRef.current.activeReadingSeconds || 0,
        completed: isCompleted || latestProgressRef.current.completed || false,
        celebrationState,
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
