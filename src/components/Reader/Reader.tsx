import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import ePub from 'epubjs'
import type { Rendition, Book } from 'epubjs'
import { useTheme } from '../../context/ThemeContext'
import { useSidebar } from '../Layout/SidebarContext'
import { flattenToc, findChapterIndex } from '../../lib/tocUtils'
import type { EpubReadingMode } from '../../types'

interface ReaderProps {
  data: ArrayBuffer | Blob
  documentId: string
  loading: boolean
  initialLocation?: string | null
  initialPercentage?: number
  readingMode?: EpubReadingMode
  onNavigateChapter?: (href: string) => void
  onChapterChange?: (href: string, index: number) => void
  onPositionChange?: (cfi: string, percentage: number, href?: string) => void
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

function getThemeCss(themeName: string, lh: number, isContinuous: boolean) {
  const isOled = themeName === 'oled'
  const isLight = themeName === 'light'

  const bg = isOled ? '#000000' : isLight ? '#fdfbf7' : '#111111'
  const text = isOled ? '#a0a0a0' : isLight ? '#1a1a1a' : '#cccccc'
  const link = isOled ? '#ffffff' : isLight ? '#000000' : '#ffffff'

  return `
    html, body {
      background-color: ${bg} !important;
      color: ${text} !important;
      line-height: ${lh} !important;
      margin: 0 !important;
      padding: ${isContinuous ? '2rem 1.5rem 6rem' : '0 1rem'} !important;
      box-sizing: border-box !important;
    }
    body {
      max-width: ${isContinuous ? '1020px' : '100%'} !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    p, div, span, li, blockquote {
      color: ${text} !important;
    }
    a {
      color: ${link} !important;
      text-decoration: none !important;
    }
    a:hover {
      text-decoration: underline !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
    }
  `
}

function applyThemeToDoc(doc: Document, themeName: string, lh: number, isContinuous: boolean) {
  if (!doc) return
  let styleEl = doc.getElementById('bunkai-active-theme') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = 'bunkai-active-theme'
    doc.head.appendChild(styleEl)
  }
  styleEl.textContent = getThemeCss(themeName, lh, isContinuous)

  // Remove any conflicting epubjs theme styles that might linger
  ;['oled', 'dark', 'light'].forEach((t) => {
    const stale = doc.getElementById(`epubjs-inserted-css-${t}`)
    if (stale) stale.remove()
  })
}

export function Reader({
  data,
  documentId,
  loading,
  initialLocation,
  readingMode: propReadingMode,
  onChapterChange,
  onPositionChange,
  scrollContainerRef: externalScrollRef,
}: ReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const internalContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = externalScrollRef || internalContainerRef

  const [rendition, setRendition] = useState<Rendition | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [pageLocationText, setPageLocationText] = useState<string>('')
  const [isRenderReady, setIsRenderReady] = useState(false)

  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const isNavigatingRef = useRef(false)
  const lastLocationRef = useRef<string | null>(initialLocation || null)

  const { toc, registerNavigation, setCurrentHref } = useSidebar()
  const { currentTheme, fontSize, fontFamily, lineHeight, epubReadingMode: contextReadingMode } = useTheme()
  const activeReadingMode = propReadingMode || contextReadingMode || 'paginated'

  const flattenedToc = toc.length > 0 ? flattenToc(toc) : []
  const currentIndex = lastLocationRef.current ? findChapterIndex(flattenedToc, lastLocationRef.current) : -1

  const currentThemeRef = useRef(currentTheme)
  const lineHeightRef = useRef(lineHeight)
  currentThemeRef.current = currentTheme
  lineHeightRef.current = lineHeight

  // Helper to push theme updates to all active rendition iframe documents
  const updateAllRenditionThemes = useCallback((themeName: string, lh: number) => {
    if (!renditionRef.current) return
    const isContinuous = activeReadingMode === 'continuous'
    const rawContents: any = renditionRef.current.getContents()
    const contentsList = Array.isArray(rawContents) ? rawContents : rawContents ? [rawContents] : []
    contentsList.forEach((content: any) => {
      if (content?.document) {
        applyThemeToDoc(content.document, themeName, lh, isContinuous)
      }
    })
  }, [activeReadingMode])

  // 1. Primary Engine Initialization
  useEffect(() => {
    if (!data || loading || !viewerRef.current) return

    let active = true
    setInitError(null)
    setIsRenderReady(false)

    if (renditionRef.current) {
      try {
        renditionRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying prior rendition:', e)
      }
      renditionRef.current = null
    }
    if (bookRef.current) {
      try {
        bookRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying prior book:', e)
      }
      bookRef.current = null
    }

    const initBook = async () => {
      try {
        const rawBuffer = data instanceof Blob ? await data.arrayBuffer() : data
        if (!active) return

        const book = ePub(rawBuffer)
        bookRef.current = book

        await book.ready
        if (!active || !viewerRef.current) return

        // Background location generation for byte-accurate percentage progress
        book.locations.generate(1024).then(() => {
          if (!active) return
          // Locations cached in book.locations
        }).catch((err) => {
          console.warn('Locations generation skipped or failed:', err)
        })

        const isContinuous = activeReadingMode === 'continuous'

        const renditionInstance = book.renderTo(viewerRef.current, {
          flow: isContinuous ? 'scrolled' : 'paginated',
          manager: isContinuous ? 'continuous' : 'default',
          width: '100%',
          height: '100%',
          spread: 'none',
          allowScriptedContent: false,
        })

        renditionRef.current = renditionInstance

        // Content Hook: Immediately inject styling and theme on each chapter/view
        renditionInstance.hooks.content.register((content: any) => {
          if (content?.document) {
            applyThemeToDoc(content.document, currentThemeRef.current, lineHeightRef.current, isContinuous)
          }
        })

        renditionInstance.themes.fontSize(`${fontSize}%`)
        renditionInstance.themes.font(fontFamily)

        // Relocated Listener: update location text, percentage and chapter
        renditionInstance.on('relocated', (location: any) => {
          if (!active) return
          if (location?.start) {
            const startCfi = location.start.cfi
            const href = location.start.href

            lastLocationRef.current = startCfi
            if (href) setCurrentHref(href)

            // Calculate progress accurately
            let percentage = location.start.percentage || 0
            if ((!percentage || percentage === 0) && book.locations?.length()) {
              percentage = book.locations.percentageFromCfi(startCfi) || 0
            }
            if ((!percentage || percentage === 0) && book.spine) {
              const spineItems = (book.spine as any).items || []
              const total = spineItems.length
              const currentSpineIndex = location.start.index ?? findChapterIndex(flattenedToc, href)
              if (total > 0 && currentSpineIndex >= 0) {
                percentage = (currentSpineIndex + 0.5) / total
              }
            }
            percentage = Math.max(0, Math.min(1, Number(percentage.toFixed(4))))

            if (location.start.displayed?.page && location.start.displayed?.total) {
              setPageLocationText(`${location.start.displayed.page} / ${location.start.displayed.total}`)
            } else if (percentage > 0) {
              setPageLocationText(`${Math.round(percentage * 100)}%`)
            }

            if (onPositionChange && startCfi) {
              onPositionChange(startCfi, percentage, href)
            }

            if (href && onChapterChange) {
              const chIdx = findChapterIndex(flattenedToc, href)
              if (chIdx !== -1) {
                onChapterChange(href, chIdx)
              }
            }
          }
        })

        const targetToDisplay = initialLocation || undefined
        if (targetToDisplay) {
          await renditionInstance.display(targetToDisplay)
        } else {
          await renditionInstance.display()
        }

        if (active) {
          setRendition(renditionInstance)
          setIsRenderReady(true)

          // Hook external scroll container to continuous manager container if available
          if (isContinuous && externalScrollRef) {
            const manager = (renditionInstance as any).manager
            const actualScroller = manager?.container || viewerRef.current
            if (actualScroller) {
              ;(externalScrollRef as any).current = actualScroller
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize EPUB engine:', err)
        if (active) {
          setInitError('Could not render this EPUB. The file may be corrupt or encrypted.')
        }
      }
    }

    initBook()

    return () => {
      active = false
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy()
        } catch {}
        renditionRef.current = null
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy()
        } catch {}
        bookRef.current = null
      }
    }
  }, [data, documentId, activeReadingMode])

  // 2. Register Sidebar Table of Contents Navigation
  useEffect(() => {
    if (!rendition) return

    const handleEpubNavigation = async (targetHref: string) => {
      if (!bookRef.current || !renditionRef.current || isNavigatingRef.current) return
      try {
        isNavigatingRef.current = true
        const book = bookRef.current

        // Normalize target HREF and extract fragment anchor if present
        const [cleanHref, anchor] = targetHref.split('#')
        let targetToDisplay = targetHref

        // Verify if target exists directly in spine
        const directSection = book.spine.get(cleanHref)
        if (!directSection) {
          const allItems = (book.spine as any).items || []
          const matchedItem = allItems.find(
            (item: any) =>
              item.href === cleanHref ||
              item.href.endsWith(cleanHref) ||
              cleanHref.endsWith(item.href) ||
              encodeURI(item.href) === encodeURI(cleanHref),
          )

          if (matchedItem) {
            targetToDisplay = anchor ? `${matchedItem.href}#${anchor}` : matchedItem.href
          }
        }

        lastLocationRef.current = targetToDisplay
        await renditionRef.current.display(targetToDisplay)
        setCurrentHref(targetHref)
        updateAllRenditionThemes(currentThemeRef.current, lineHeightRef.current)
      } catch (err) {
        console.warn('EPUB TOC navigation failed for target:', targetHref, err)
        try {
          await renditionRef.current?.display(targetHref)
          setCurrentHref(targetHref)
        } catch (fallbackErr) {
          console.error('EPUB fallback navigation failed:', fallbackErr)
        }
      } finally {
        isNavigatingRef.current = false
      }
    }

    registerNavigation(handleEpubNavigation)
    return () => registerNavigation(() => {})
  }, [rendition, registerNavigation, setCurrentHref, updateAllRenditionThemes])

  // 3. Dynamic Setting Updates: Theme changes in-place deterministically
  useEffect(() => {
    if (!rendition) return
    updateAllRenditionThemes(currentTheme, lineHeight)
  }, [rendition, currentTheme, lineHeight, updateAllRenditionThemes])

  // 4. Dynamic Setting Updates: Font Size
  useEffect(() => {
    if (!rendition) return
    rendition.themes.fontSize(`${fontSize}%`)
  }, [rendition, fontSize])

  // 5. Dynamic Setting Updates: Font Family
  useEffect(() => {
    if (!rendition) return
    rendition.themes.font(fontFamily)
  }, [rendition, fontFamily])

  // 6. Navigation Actions: Next & Prev Page/Spread
  const handleNextPage = useCallback(() => {
    if (!rendition) return
    if (activeReadingMode === 'paginated') {
      rendition.next()
    } else if (containerRef.current) {
      containerRef.current.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
    }
  }, [rendition, activeReadingMode, containerRef])

  const handlePrevPage = useCallback(() => {
    if (!rendition) return
    if (activeReadingMode === 'paginated') {
      rendition.prev()
    } else if (containerRef.current) {
      containerRef.current.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
    }
  }, [rendition, activeReadingMode, containerRef])

  // 7. Keyboard Navigation (Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (activeReadingMode === 'paginated') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Space') {
          e.preventDefault()
          handleNextPage()
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault()
          handlePrevPage()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeReadingMode, handleNextPage, handlePrevPage])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide">Opening document...</span>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
        <p className="text-sm font-medium text-red-400 mb-4">{initError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 transition-colors"
        >
          Reload Reader
        </button>
      </div>
    )
  }

  const isLight = currentTheme === 'light'
  const buttonBaseClass =
    'px-4 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors flex items-center gap-1.5'
  const buttonActiveClass = isLight
    ? 'bg-black/5 text-gray-900 hover:bg-black/10'
    : 'bg-white/10 text-white hover:bg-white/15'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full w-full relative flex flex-col select-text"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative"
        style={{ scrollBehavior: 'auto' }}
      >
        <div
          ref={viewerRef}
          className={`h-full mx-auto min-h-[70vh] transition-all duration-200 ${
            activeReadingMode === 'continuous'
              ? 'w-[92%] md:w-[88%] max-w-[1400px]'
              : 'w-full max-w-4xl'
          }`}
        />
      </div>

      {activeReadingMode === 'paginated' && isRenderReady && (
        <div
          className={`py-2 px-6 flex justify-between items-center max-w-4xl mx-auto w-full border-t z-20 backdrop-blur-md transition-colors ${
            isLight ? 'border-gray-200 bg-white/70' : 'border-white/10 bg-black/60'
          }`}
        >
          <button
            onClick={handlePrevPage}
            className={`${buttonBaseClass} ${buttonActiveClass}`}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            <span
              className="text-xs font-mono tabular-nums opacity-60"
              style={{ color: 'var(--text-primary)' }}
            >
              {pageLocationText || (currentIndex >= 0 ? `${currentIndex + 1} / ${flattenedToc.length}` : '')}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            className={`${buttonBaseClass} ${buttonActiveClass}`}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </motion.div>
  )
}
