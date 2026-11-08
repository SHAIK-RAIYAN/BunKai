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

  const { toc } = useSidebar()
  const { currentTheme, fontSize, fontFamily, lineHeight, epubReadingMode: contextReadingMode } = useTheme()
  const activeReadingMode = propReadingMode || contextReadingMode || 'paginated'

  const flattenedToc = toc.length > 0 ? flattenToc(toc) : []
  const currentIndex = lastLocationRef.current ? findChapterIndex(flattenedToc, lastLocationRef.current) : -1

  const applyThemesToRendition = useCallback((r: Rendition, themeName: string, lh: number) => {
    const themes = {
      oled: {
        body: {
          background: '#000000 !important',
          color: '#a0a0a0 !important',
          'line-height': `${lh} !important`,
          padding: '0 1rem !important',
        },
        p: { color: '#a0a0a0 !important' },
        a: { color: '#ffffff !important', 'text-decoration': 'none !important' },
      },
      dark: {
        body: {
          background: '#111111 !important',
          color: '#cccccc !important',
          'line-height': `${lh} !important`,
          padding: '0 1rem !important',
        },
        p: { color: '#cccccc !important' },
        a: { color: '#ffffff !important', 'text-decoration': 'none !important' },
      },
      light: {
        body: {
          background: '#fdfbf7 !important',
          color: '#1a1a1a !important',
          'line-height': `${lh} !important`,
          padding: '0 1rem !important',
        },
        p: { color: '#1a1a1a !important' },
        a: { color: '#000000 !important', 'text-decoration': 'none !important' },
      },
    }

    r.themes.register('oled', themes.oled)
    r.themes.register('dark', themes.dark)
    r.themes.register('light', themes.light)
    r.themes.select(themeName)
  }, [])

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

        renditionInstance.hooks.content.register((content: any) => {
          const style = content.document.createElement('style')
          style.textContent = `
            a:hover { text-decoration: underline !important; }
            img { max-width: 100% !important; height: auto !important; }
          `
          content.document.head.appendChild(style)
        })

        applyThemesToRendition(renditionInstance, currentTheme, lineHeight)
        renditionInstance.themes.fontSize(`${fontSize}%`)
        renditionInstance.themes.font(fontFamily)

        renditionInstance.on('relocated', (location: any) => {
          if (!active) return
          if (location?.start) {
            const startCfi = location.start.cfi
            const percentage = location.start.percentage || 0
            const href = location.start.href

            lastLocationRef.current = startCfi

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

  // 2. Navigate to chapter/location when initialLocation changes externally without reinitializing
  useEffect(() => {
    if (!rendition || !initialLocation) return
    if (initialLocation === lastLocationRef.current) return

    const navigate = async () => {
      if (isNavigatingRef.current) return
      isNavigatingRef.current = true
      try {
        lastLocationRef.current = initialLocation
        await rendition.display(initialLocation)
        applyThemesToRendition(rendition, currentTheme, lineHeight)
      } catch (err) {
        console.warn('Navigation to location failed:', err)
      } finally {
        isNavigatingRef.current = false
      }
    }

    navigate()
  }, [initialLocation, rendition, currentTheme, lineHeight, applyThemesToRendition])

  // 3. Dynamic Setting Updates: Theme changes in-place without destroying engine
  useEffect(() => {
    if (!rendition) return
    applyThemesToRendition(rendition, currentTheme, lineHeight)
  }, [rendition, currentTheme, lineHeight, applyThemesToRendition])

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
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          ref={viewerRef}
          className="w-full h-full max-w-4xl mx-auto min-h-[70vh]"
          style={{
            maxWidth: activeReadingMode === 'continuous' ? '780px' : '100%',
            padding: activeReadingMode === 'continuous' ? '2rem 1.5rem 6rem' : '0',
          }}
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
