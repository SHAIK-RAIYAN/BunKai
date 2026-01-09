import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ePub from 'epubjs'
import type { Rendition, Book } from 'epubjs'
import { usePersistence } from '../../hooks/usePersistence'
import { useTheme } from '../../context/ThemeContext'
import { useSidebar } from '../Layout/SidebarContext'
import { SmoothScroll } from '../UI/SmoothScroll'
import { flattenToc, findChapterIndex } from '../../lib/tocUtils'

interface ReaderProps {
  data: ArrayBuffer
  loading: boolean
  initialLocation: string
  onNavigateChapter?: (href: string) => void
  onChapterChange?: (href: string, index: number) => void
}

export function Reader({ data, loading, initialLocation, onNavigateChapter, onChapterChange }: ReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendition, setRendition] = useState<Rendition | null>(null)
  const bookInstanceRef = useRef<Book | null>(null)
  
  const { saveReadingPosition, saveLastChapter } = usePersistence()
  const { toc } = useSidebar()
  const { currentTheme, fontSize, fontFamily, lineHeight } = useTheme()

  // Flatten TOC Logic
  const flattenedToc = toc.length > 0 ? flattenToc(toc) : []
  const currentIndex = initialLocation ? findChapterIndex(flattenedToc, initialLocation) : -1
  const prevChapter = currentIndex > 0 ? flattenedToc[currentIndex - 1] : null
  const nextChapter = currentIndex >= 0 && currentIndex < flattenedToc.length - 1 ? flattenedToc[currentIndex + 1] : null

  // Note: Navigation is handled at App level to support both TOC and Reader views
  // The Reader's onNavigateChapter is passed to App's handleNavigateChapter

  // Report chapter change and save last chapter
  useEffect(() => {
    if (initialLocation && currentIndex >= 0) {
      if (onChapterChange) {
        onChapterChange(initialLocation, currentIndex)
      }
      // Save the last visited chapter
      saveLastChapter(initialLocation)
    }
  }, [initialLocation, currentIndex, onChapterChange, saveLastChapter])

  // 1. Initialize Book Engine (runs once when data is loaded)
  useEffect(() => {
    if (!data || loading || !viewerRef.current) return

    let active = true
    let currentRendition: Rendition | null = null
    
    const book = ePub(data)
    bookInstanceRef.current = book

    const init = async () => {
      try {
        await book.ready
        if (!active) return

        const viewer = viewerRef.current
        if (!viewer) return

        // Create Rendition
        currentRendition = book.renderTo(viewer, {
          flow: 'scrolled',
          manager: 'default',
          width: '100%',
          height: '100%',
          allowScriptedContent: false,
        })

        // Theme Definitions
        const themes = {
            oled: { 
                body: { background: '#000000 !important', color: '#a0a0a0 !important', 'line-height': `${lineHeight} !important` },
                p: { color: '#a0a0a0 !important' },
                a: { color: '#fdfbf7 !important', 'text-decoration': 'none !important' }
            },
            dark: { 
                body: { background: '#111111 !important', color: '#cccccc !important', 'line-height': `${lineHeight} !important` },
                a: { color: '#fdfbf7 !important', 'text-decoration': 'none !important' }
            },
            light: { 
                body: { background: '#fdfbf7 !important', color: '#000000 !important', 'line-height': `${lineHeight} !important` },
                a: { color: '#1a1a1a !important', 'text-decoration': 'none !important' }
            }
        }

        currentRendition.themes.register('oled', themes.oled)
        currentRendition.themes.register('dark', themes.dark)
        currentRendition.themes.register('light', themes.light)
        
        // Inject CSS for anchor hover underline
        currentRendition.hooks.content.register((content: any) => {
          const style = content.document.createElement('style')
          style.textContent = `
            a:hover {
              text-decoration: underline !important;
            }
          `
          content.document.head.appendChild(style)
        })
        
        // Initial Apply
        currentRendition.themes.fontSize(`${fontSize}%`)
        currentRendition.themes.font(fontFamily)
        currentRendition.themes.select(currentTheme)

        // Display initial location
        if (initialLocation) {
          await currentRendition.display(initialLocation)
          // Force re-apply theme after render to prevent white flash
          currentRendition.themes.select(currentTheme)
        }
        
        if (active) {
            setRendition(currentRendition)
            if (containerRef.current) containerRef.current.scrollTop = 0
        }

        currentRendition.on('relocated', (location: any) => {
           if (location?.start?.cfi) saveReadingPosition(location.start.cfi)
        })

      } catch (err) {
        console.error('Error initializing book:', err)
      }
    }

    init()

    return () => {
      active = false
      if (currentRendition) try { currentRendition.destroy() } catch (e) {}
      if (book) try { book.destroy() } catch (e) {}
    }
  }, [data, loading, lineHeight, fontSize, fontFamily, currentTheme]) // Removed initialLocation dependency

  // 2. Navigate to chapter when initialLocation changes (optimized - no book reload)
  useEffect(() => {
    if (!rendition || !initialLocation) return

    const navigate = async () => {
      try {
        await rendition.display(initialLocation)
        // Force re-apply theme after render to prevent white flash
        rendition.themes.select(currentTheme)
        if (containerRef.current) containerRef.current.scrollTop = 0
      } catch (err) {
        console.error('Error navigating to chapter:', err)
      }
    }

    navigate()
  }, [rendition, initialLocation, currentTheme])

  // 2. Settings Updates
  useEffect(() => {
    if (!rendition) return
    rendition.themes.fontSize(`${fontSize}%`)
  }, [fontSize, rendition])

  useEffect(() => {
    if (!rendition) return
    rendition.themes.font(fontFamily)
  }, [fontFamily, rendition])

  useEffect(() => {
    if (!rendition) return
    
    // Re-register all themes with updated line-height to prevent glitches
    rendition.themes.register('oled', { 
        body: { background: '#000000 !important', color: '#a0a0a0 !important', 'line-height': `${lineHeight} !important` },
        p: { color: '#a0a0a0 !important' },
        a: { color: '#ffffff !important', 'text-decoration': 'none !important' }
    })
    rendition.themes.register('dark', { 
        body: { background: '#111111 !important', color: '#cccccc !important', 'line-height': `${lineHeight} !important` },
        a: { color: '#ffffff !important', 'text-decoration': 'none !important' }
    })
    rendition.themes.register('light', { 
        body: { background: '#fdfbf7 !important', color: '#000000 !important', 'line-height': `${lineHeight} !important` },
        a: { color: '#1a1a1a !important', 'text-decoration': 'none !important' }
    })
    
    rendition.themes.select(currentTheme)
  }, [currentTheme, lineHeight, rendition])

  // 3. Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        if (e.key === 'ArrowRight' && nextChapter) onNavigateChapter?.(nextChapter.href)
        if (e.key === 'ArrowLeft' && prevChapter) onNavigateChapter?.(prevChapter.href)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextChapter, prevChapter, onNavigateChapter])

  if (loading) {
    return <div className="flex items-center justify-center h-full opacity-50">Loading...</div>
  }

  // Helper for conditional styles
  const isLight = currentTheme === 'light'
  const buttonBaseClass = "px-6 py-3 rounded-lg text-sm font-medium transition-colors"
  const buttonActiveClass = isLight 
    ? "bg-gray-100 text-gray-900 hover:bg-gray-200" 
    : "bg-white/10 text-white hover:bg-white/20"
  const buttonDisabledClass = "opacity-0 cursor-default"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full w-full"
    >
      <SmoothScroll
        className="flex flex-col h-full w-full max-w-[100vw] overflow-x-hidden"
        options={{
          duration: 2.0, // Slow/Cinematic scroll
          wheelMultiplier: 0.8, // Reduced wheel sensitivity
          smoothWheel: true,
        }}
      >
      <div 
          ref={containerRef}
          className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Viewer */}
        <div ref={viewerRef} className="w-full flex-grow min-h-[60vh] overflow-hidden" />

      {/* Navigation Footer */}
      <div 
        className={`py-2 px-6 flex justify-between items-center max-w-4xl mx-auto w-full border-t mt-auto transition-colors duration-300 ${
            isLight ? 'border-gray-200' : 'border-white/10'
        }`}
      >
        <button
            onClick={() => prevChapter && onNavigateChapter?.(prevChapter.href)}
            disabled={!prevChapter}
            className={`${buttonBaseClass} ${prevChapter ? buttonActiveClass : buttonDisabledClass}`}
        >
            ← Previous
        </button>

        <span className="text-xs opacity-50 font-mono" style={{ color: 'var(--text-primary)' }}>
            {currentIndex + 1} / {flattenedToc.length}
        </span>

        <button
            onClick={() => nextChapter && onNavigateChapter?.(nextChapter.href)}
            disabled={!nextChapter}
            className={`${buttonBaseClass} ${nextChapter ? buttonActiveClass : buttonDisabledClass}`}
        >
            Next →
        </button>
      </div>
      </div>
    </SmoothScroll>
    </motion.div>
  )
}
