import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTheme } from '../../context/ThemeContext'
import { useSidebar, type TocItem } from '../Layout/SidebarContext'
import { AnimatedCloseIcon, AnimatedSearchIcon } from './Icons'

interface SidebarProps {
  toc: TocItem[]
  isOpen: boolean
  onClose: () => void
  currentHref?: string | null
}

export function Sidebar({ toc, isOpen, onClose, currentHref }: SidebarProps) {
  const { currentTheme } = useTheme()
  const { navigate } = useSidebar()
  const [searchTerm, setSearchTerm] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isLight = currentTheme === 'light'

  const filterToc = (items: TocItem[], term: string): TocItem[] => {
    if (!term.trim()) return items
    const lower = term.toLowerCase()
    return items.reduce((acc: TocItem[], item) => {
      const selfMatch = item.label.toLowerCase().includes(lower)
      const subMatches = item.subitems ? filterToc(item.subitems, term) : []
      if (selfMatch || subMatches.length > 0) {
        acc.push({
          ...item,
          subitems: subMatches.length > 0 ? subMatches : item.subitems,
        })
      }
      return acc
    }, [])
  }

  const filteredToc = filterToc(toc, searchTerm)

  const handleItemClick = (href: string) => {
    navigate(href)
    onClose()
  }

  const renderTocItems = (items: TocItem[], level = 0) => {
    return items.map((item, index) => {
      const isCurrent = currentHref && (item.href === currentHref || currentHref.endsWith(item.href))

      return (
        <div key={item.id || `toc-${level}-${index}`} className="flex flex-col">
          <button
            onClick={() => handleItemClick(item.href)}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-transform active:scale-[0.98] transition-colors truncate block ${
              level > 0 ? 'ml-3 border-l pl-3' : ''
            } ${
              isCurrent
                ? isLight
                  ? 'bg-gray-900 text-white font-medium'
                  : 'bg-white/20 text-white font-medium'
                : isLight
                  ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
            style={{
              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            }}
          >
            {item.label}
          </button>

          {item.subitems && item.subitems.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-0.5">
              {renderTocItems(item.subitems, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 flex flex-col border-r backdrop-blur-xl shadow-2xl select-none ${
              isLight
                ? 'bg-white/95 border-gray-200/90 text-gray-900'
                : 'bg-zinc-950/95 border-white/10 text-white'
            }`}
          >
            <div className="p-4 border-b border-white/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Table of Contents</h2>
                <p className="text-[11px] opacity-60">Chapters & document sections</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <AnimatedCloseIcon size={16} />
              </button>
            </div>

            <div className="p-3 border-b border-white/5">
              <div className="relative flex items-center">
                <div className="absolute left-2.5 opacity-40">
                  <AnimatedSearchIcon size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Filter sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border transition-colors outline-none ${
                    isLight
                      ? 'bg-gray-100 border-gray-200 text-gray-900 focus:border-gray-400'
                      : 'bg-white/5 border-white/10 text-white focus:border-white/20'
                  }`}
                />
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {toc.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-50">
                  No table of contents available for this document.
                </div>
              ) : filteredToc.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-50">
                  No matching sections found.
                </div>
              ) : (
                renderTocItems(filteredToc)
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
