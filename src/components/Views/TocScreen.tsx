import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { usePersistence } from '../../hooks/usePersistence'
import type { TocItem } from '../Layout/SidebarContext'

interface TocScreenProps {
  toc: TocItem[]
  onSelectChapter: (href: string) => void
  bookTitle: string
}

export function TocScreen({ toc, onSelectChapter, bookTitle }: TocScreenProps) {
  const { currentTheme } = useTheme()
  const { getTocScroll, saveTocScroll } = usePersistence()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const savedScroll = getTocScroll()
      if (savedScroll > 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedScroll
          }
        }, 100)
      }
    }
  }, [getTocScroll])

  // Save scroll position on scroll
  useEffect(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        saveTocScroll(container.scrollTop)
      }, 150) // Debounce scroll saves
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [saveTocScroll])

  const renderTocItems = (items: TocItem[], level = 0) => {
    return items.map((item, index) => (
      <div key={item.id || index} className={level > 0 ? 'ml-6' : ''}>
        <button
          onClick={() => onSelectChapter(item.href)}
          className={`w-full text-left px-6 py-3 text-base transition-colors duration-150 rounded-lg mb-2 ${
            currentTheme === 'light'
              ? 'hover:bg-gray-100 text-gray-700 hover:text-black'
              : 'hover:bg-white/10 text-gray-300 hover:text-white'
          }`}
        >
          {item.label}
        </button>
        {item.subitems && item.subitems.length > 0 && (
          <div className="mt-1">{renderTocItems(item.subitems, level + 1)}</div>
        )}
      </div>
    ))
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col items-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Title Section */}
      <div className="w-full max-w-4xl px-8 py-12 text-center">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {bookTitle}
        </h1>
        <div
          className="text-lg opacity-60"
          style={{ color: 'var(--text-primary)' }}
        >
          Table of Contents
        </div>
      </div>

      {/* TOC List */}
      <div className="w-full max-w-4xl px-8 pb-12">
        {toc.length === 0 ? (
          <div
            className="text-center py-12 opacity-60"
            style={{ color: 'var(--text-primary)' }}
          >
            No chapters available
          </div>
        ) : (
          <div className="space-y-1">{renderTocItems(toc)}</div>
        )}
      </div>
    </div>
  )
}

