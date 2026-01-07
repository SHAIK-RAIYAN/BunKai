import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { usePersistence } from '../../hooks/usePersistence'
import type { TocItem } from '../Layout/SidebarContext'

interface SidebarProps {
  toc: TocItem[]
  isOpen: boolean
  onNavigate: (href: string) => void
  onClose: () => void
}

export function Sidebar({ toc, isOpen, onNavigate, onClose }: SidebarProps) {
  const { currentTheme } = useTheme()
  const { getSidebarScroll, saveSidebarScroll } = usePersistence()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Restore scroll position on mount
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const savedScroll = getSidebarScroll()
      if (savedScroll > 0) {
        scrollContainerRef.current.scrollTop = savedScroll
      }
    }
  }, [isOpen, getSidebarScroll])

  // Save scroll position on scroll
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        saveSidebarScroll(container.scrollTop)
      }, 150) // Debounce scroll saves
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [isOpen, saveSidebarScroll])

  const handleChapterClick = (href: string) => {
    onNavigate(href)
    onClose()
  }

  const renderTocItems = (items: TocItem[], level = 0) => {
    return items.map((item, index) => (
      <div key={item.id || index}>
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent bubbling
            handleChapterClick(item.href)
          }}
          className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 truncate block ${
             level > 0 ? 'pl-8' : ''
          }`}
          style={{
             color: 'var(--text-primary)',
             opacity: 0.8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.color = currentTheme === 'light' ? '#000000' : '#ffffff'
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.opacity = '0.8'
          }}
        >
          {item.label}
        </button>
        {item.subitems && item.subitems.length > 0 && (
          <div className="ml-4 border-l border-white/10">
              {renderTocItems(item.subitems, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:w-80 transform transition-transform duration-300 ease-out border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)',
          borderColor: currentTheme === 'light' ? 'rgba(229, 231, 235, 1)' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="px-6 py-4 border-b mt-16"
            style={{
              borderColor: currentTheme === 'light' ? 'rgba(229, 231, 235, 1)' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                Table of Contents
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors"
                style={{
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label="Close sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-2">
            {toc.length === 0 ? (
              <div
                className="px-6 py-4 text-sm opacity-60"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                No chapters available
              </div>
            ) : (
              renderTocItems(toc)
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

