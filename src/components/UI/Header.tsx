import { motion } from 'motion/react'
import { useTheme } from '../../context/ThemeContext'
import { AnimatedSettingsIcon, AnimatedSidebarIcon } from './Icons'

interface HeaderProps {
  title?: string
  format?: 'epub' | 'pdf'
  onToggleSidebar: () => void
  onToggleSettings: () => void
  showBackButton?: boolean
  onBackToLibrary?: () => void
  sidebarOpen?: boolean
}

export function Header({
  title,
  format,
  onToggleSidebar,
  onToggleSettings,
  showBackButton,
  onBackToLibrary,
  sidebarOpen = false,
}: HeaderProps) {
  const { currentTheme } = useTheme()
  const isLight = currentTheme === 'light'

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-40 backdrop-blur-md border-b transition-colors select-none ${
        isLight
          ? 'bg-white/80 border-gray-200/80 text-gray-900'
          : 'bg-black/60 border-white/10 text-white'
      }`}
    >
      {/* Left: Sidebar Toggle & Back Action */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-[0.96] transition-colors"
            aria-label="Toggle contents sidebar"
            title="Table of Contents"
          >
            <AnimatedSidebarIcon size={18} isOpen={sidebarOpen} />
          </button>
        )}

        {showBackButton && onBackToLibrary && (
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-[0.96] transition-colors"
            title="Back to library"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Library</span>
          </button>
        )}
      </div>

      {/* Center: Title / Logo */}
      <div className="flex items-center justify-center max-w-md mx-auto truncate px-2">
        {title ? (
          <div className="flex items-center gap-2 truncate">
            {format && (
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-70">
                {format}
              </span>
            )}
            <h1 className="text-xs font-medium truncate opacity-90">{title}</h1>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <img src="/Bunkai-Chi-logo.png" alt="BunKai Logo" className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">BunKai</span>
          </div>
        )}
      </div>

      {/* Right: Settings Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-[0.96] transition-colors"
          aria-label="Open reading settings"
          title="Settings"
        >
          <AnimatedSettingsIcon size={18} />
        </button>
      </div>
    </motion.header>
  )
}
