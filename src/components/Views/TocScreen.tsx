import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [searchTerm, setSearchTerm] = useState('')

  // Helper to filter nested TOC
  const filterToc = (items: TocItem[], term: string): TocItem[] => {
    if (!term) return items
    const lowerTerm = term.toLowerCase()
    return items.reduce((acc: TocItem[], item) => {
      const matchesSelf = item.label.toLowerCase().includes(lowerTerm)
      const matchedSubitems = item.subitems ? filterToc(item.subitems, term) : []
      
      if (matchesSelf || matchedSubitems.length > 0) {
        acc.push({
          ...item,
          subitems: matchedSubitems.length > 0 ? matchedSubitems : item.subitems 
        })
      }
      return acc
    }, [])
  }

  const filteredToc = filterToc(toc, searchTerm)

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
    <motion.div
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col items-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Title Section */}
      <motion.div 
        className="w-full max-w-4xl px-8 py-12 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
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
      </motion.div>

      {/* Search Box - Sticky */}
      <motion.div 
        className="sticky top-0 z-10 w-full max-w-4xl px-8 py-4 mb-6 backdrop-blur-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        style={{
          backgroundColor: currentTheme === 'light' ? 'rgba(253, 251, 247, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <input
          type="text"
          placeholder="Search chapters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base border transition-colors"
          style={{
            backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: currentTheme === 'light' ? 'rgba(229, 231, 235, 1)' : 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
          }}
        />
      </motion.div>

      {/* TOC List */}
      <div className="w-full max-w-4xl px-8 pb-12">
        {toc.length === 0 ? (
          <div
            className="text-center py-12 opacity-60"
            style={{ color: 'var(--text-primary)' }}
          >
            No chapters available
          </div>
        ) : filteredToc.length === 0 ? (
          <div
            className="text-center py-12 opacity-60"
            style={{ color: 'var(--text-primary)' }}
          >
            No chapters found
          </div>
        ) : (
          <div className="space-y-1">{renderTocItems(filteredToc)}</div>
        )}
      </div>
    </motion.div>
  )
}

