import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { pdfjsLib } from '../../lib/pdfWorker'
import { PdfPage } from './PdfPage'
import { useTheme } from '../../context/ThemeContext'
import { useSidebar, type TocItem } from '../Layout/SidebarContext'
import type { PdfAppearanceMode, PdfImageTreatment } from '../../types'

interface PdfReaderProps {
  data: ArrayBuffer | Blob
  documentId?: string
  loading: boolean
  initialPage?: number
  initialOffsetRatio?: number
  initialZoom?: number
  onPageChange?: (page: number, totalPages: number, offsetRatio: number) => void
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

export function PdfReader({
  data,
  loading: parentLoading,
  initialPage = 1,
  initialOffsetRatio = 0,
  initialZoom = 1.0,
  onPageChange,
  scrollContainerRef: externalScrollRef,
}: PdfReaderProps) {
  const internalContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = externalScrollRef || internalContainerRef

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(initialZoom || 1.0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [loadingDoc, setLoadingDoc] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Cache of measured page heights: pageIndex -> height in px
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({})
  const [basePageDims, setBasePageDims] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  })

  const isRestoredRef = useRef(false)
  const { setToc: setSidebarToc } = useSidebar()
  const {
    currentTheme,
    pdfAppearanceMode: contextAppearance,
    pdfImageTreatment: contextImageTreatment,
  } = useTheme()

  const appearanceMode: PdfAppearanceMode = contextAppearance || 'dark'
  const imageTreatment: PdfImageTreatment = contextImageTreatment || 'preserve'

  // Estimate height for unmeasured pages: base height scaled + 32px vertical margins
  const estimatePageSize = useCallback(
    (index: number) => {
      const measured = pageHeights[index]
      if (measured) return measured + 32
      return Math.round(basePageDims.height * scale) + 32
    },
    [pageHeights, basePageDims.height, scale],
  )

  // 1. Initialize TanStack Virtualizer
  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => containerRef.current,
    estimateSize: estimatePageSize,
    overscan: 1,
  })

  // 2. Load PDF Document and extract outline/TOC
  useEffect(() => {
    if (!data || parentLoading) return

    let active = true
    setLoadingDoc(true)
    setErrorMessage(null)
    isRestoredRef.current = false

    let loadingTask: any = null

    const loadPdf = async () => {
      try {
        const rawBuffer = data instanceof Blob ? await data.arrayBuffer() : data
        if (!active) return

        loadingTask = pdfjsLib.getDocument({
          data: rawBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/standard_fonts/',
        })

        const doc = await loadingTask.promise
        if (!active) return

        setPdfDoc(doc)
        setNumPages(doc.numPages)

        try {
          const firstPage = await doc.getPage(1)
          const viewport = firstPage.getViewport({ scale: 1.0 })
          setBasePageDims({ width: viewport.width, height: viewport.height })
        } catch (firstPageErr) {
          console.warn('Could not read first page dimensions:', firstPageErr)
        }

        try {
          const outline = await doc.getOutline()
          if (outline && Array.isArray(outline) && outline.length > 0) {
            const mapOutlineItems = (items: any[]): TocItem[] => {
              return items.map((item, idx) => ({
                id: `pdf-toc-${idx}-${item.title}`,
                label: item.title || `Section ${idx + 1}`,
                href: typeof item.dest === 'string' ? item.dest : `#page=${idx + 1}`,
                subitems: item.items && item.items.length > 0 ? mapOutlineItems(item.items) : undefined,
              }))
            }
            setSidebarToc(mapOutlineItems(outline))
          }
        } catch (outlineErr) {
          console.warn('PDF outline not present or error extracting:', outlineErr)
        }

        setLoadingDoc(false)
      } catch (err: any) {
        console.error('Failed to load PDF document:', err)
        if (active) {
          setErrorMessage(
            err?.name === 'PasswordException'
              ? 'This PDF is password-protected.'
              : 'Could not load PDF document. The file may be corrupt.',
          )
          setLoadingDoc(false)
        }
      }
    }

    loadPdf()

    return () => {
      active = false
      if (loadingTask) {
        try {
          loadingTask.destroy()
        } catch {}
      }
    }
  }, [data, parentLoading, setSidebarToc])

  // 3. Callback when a page's dimensions are measured
  const handleDimensionsMeasured = useCallback(
    (pageNumber: number, _measuredWidth: number, measuredHeight: number) => {
      const pageIndex = pageNumber - 1
      setPageHeights((prev) => {
        if (prev[pageIndex] === measuredHeight) return prev
        return { ...prev, [pageIndex]: measuredHeight }
      })
    },
    [],
  )

  // 4. Restore initial page and scroll offset on first document load
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || isRestoredRef.current || !containerRef.current) return

    const targetIndex = Math.max(0, Math.min(numPages - 1, initialPage - 1))
    isRestoredRef.current = true

    setTimeout(() => {
      if (virtualizer && containerRef.current) {
        virtualizer.scrollToIndex(targetIndex, { align: 'start' })
        if (initialOffsetRatio > 0) {
          const estimatedPageHeight = estimatePageSize(targetIndex)
          containerRef.current.scrollTop += estimatedPageHeight * initialOffsetRatio
        }
      }
    }, 50)
  }, [pdfDoc, numPages, initialPage, initialOffsetRatio, virtualizer, estimatePageSize, containerRef])

  // 5. Track current page & scroll offset on scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || numPages === 0) return

    const scrollTop = container.scrollTop
    const viewportHeight = container.clientHeight
    const probeY = scrollTop + viewportHeight * 0.3

    const virtualItems = virtualizer.getVirtualItems()
    let activeItem = virtualItems[0]

    for (const item of virtualItems) {
      if (item.start <= probeY && item.end >= probeY) {
        activeItem = item
        break
      }
    }

    if (activeItem) {
      const pageNum = activeItem.index + 1
      const itemHeight = Math.max(1, activeItem.size - 32)
      const offsetWithinPage = Math.max(0, scrollTop - activeItem.start)
      const offsetRatio = Math.min(1, offsetWithinPage / itemHeight)

      if (pageNum !== currentPage) {
        setCurrentPage(pageNum)
      }

      if (onPageChange) {
        onPageChange(pageNum, numPages, offsetRatio)
      }
    }
  }, [virtualizer, numPages, currentPage, onPageChange, containerRef])

  // 6. Direct Page Jump Action
  const jumpToPage = useCallback(
    (targetPage: number) => {
      if (!virtualizer || numPages === 0) return
      const clampedPage = Math.max(1, Math.min(numPages, targetPage))
      virtualizer.scrollToIndex(clampedPage - 1, { align: 'start' })
      setCurrentPage(clampedPage)
    },
    [virtualizer, numPages],
  )

  // 7. Zoom Controls
  const handleZoomIn = () => setScale((s) => Math.min(3.0, Number((s + 0.15).toFixed(2))))
  const handleZoomOut = () => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))

  const handleFitToWidth = () => {
    if (!containerRef.current || !basePageDims.width) return
    const containerWidth = containerRef.current.clientWidth - 48
    const newScale = Math.max(0.5, Math.min(3.0, containerWidth / basePageDims.width))
    setScale(Number(newScale.toFixed(2)))
  }

  // Keyboard navigation for PDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'PageDown' || (e.key === 'ArrowDown' && e.altKey)) {
        e.preventDefault()
        jumpToPage(currentPage + 1)
      } else if (e.key === 'PageUp' || (e.key === 'ArrowUp' && e.altKey)) {
        e.preventDefault()
        jumpToPage(currentPage - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        jumpToPage(1)
      } else if (e.key === 'End') {
        e.preventDefault()
        jumpToPage(numPages)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, numPages, jumpToPage])

  if (parentLoading || loadingDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide">Loading PDF pages...</span>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
        <p className="text-sm font-medium text-red-400 mb-4">{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 transition-colors"
        >
          Reload Document
        </button>
      </div>
    )
  }

  const isLight = currentTheme === 'light'
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full w-full relative flex flex-col select-text"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Scrollable Virtualized Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative"
        style={{ scrollBehavior: 'auto' }}
      >
        <div
          className="relative w-full mx-auto"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const pageIndex = virtualRow.index
            const pageNumber = pageIndex + 1

            return (
              <div
                key={`pdf-page-${pageNumber}`}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full flex justify-center px-4"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {pdfDoc && (
                  <PdfPage
                    pageNumber={pageNumber}
                    pdfDoc={pdfDoc}
                    scale={scale}
                    appearanceMode={appearanceMode}
                    imageTreatment={imageTreatment}
                    onDimensionsMeasured={handleDimensionsMeasured}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Bottom PDF Navigation HUD */}
      <div
        className={`py-2 px-6 flex justify-between items-center max-w-2xl mx-auto w-full border-t z-20 backdrop-blur-md rounded-t-xl transition-colors ${
          isLight ? 'border-gray-200 bg-white/80' : 'border-white/10 bg-black/70'
        }`}
      >
        {/* Left: Direct Page Jump Form */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => jumpToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded text-xs font-medium border border-transparent hover:border-current/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous PDF page"
          >
            ←
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val)) jumpToPage(val)
              }}
              className="w-12 px-1.5 py-0.5 text-center text-xs font-mono rounded border bg-transparent"
              style={{
                borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
              }}
              aria-label="Current page number"
            />
            <span className="opacity-50">/ {numPages}</span>
          </div>

          <button
            onClick={() => jumpToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="px-2.5 py-1 rounded text-xs font-medium border border-transparent hover:border-current/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next PDF page"
          >
            →
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Zoom out"
          >
            −
          </button>

          <button
            onClick={handleFitToWidth}
            className="px-2.5 py-1 rounded text-xs font-mono tabular-nums opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Fit to width"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  )
}
