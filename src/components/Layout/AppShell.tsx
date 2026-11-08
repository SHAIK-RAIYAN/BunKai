import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { SettingsPanel } from '../UI/SettingsPanel'
import { Header } from '../UI/Header'
import { Sidebar } from '../UI/Sidebar'
import { useSidebar } from './SidebarContext'
import { useTheme } from '../../context/ThemeContext'
import { AnimatedSettingsIcon } from '../UI/Icons'

interface AppShellProps {
  children: ReactNode
  title?: string
  format?: 'epub' | 'pdf'
  showBackButton?: boolean
  onBackToLibrary?: () => void
  currentLocationHref?: string | null
}

interface VendorFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

interface VendorFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
  mozFullScreenElement?: Element | null
  msFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

export function AppShell({
  children,
  title,
  format,
  showBackButton,
  onBackToLibrary,
  currentLocationHref,
}: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const { isOpen, toc, closeSidebar, toggleSidebar } = useSidebar()
  const { currentTheme } = useTheme()
  const isLight = currentTheme === 'light'

  const requestBrowserFullscreen = useCallback(() => {
    try {
      const elem = document.documentElement as VendorFullscreenElement
      const doc = document as VendorFullscreenDocument
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      if (!isFs) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {})
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen()
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen()
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen()
        }
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed:', err)
    }
  }, [])

  const exitBrowserFullscreen = useCallback(() => {
    try {
      const doc = document as VendorFullscreenDocument
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      if (isFs) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {})
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen()
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen()
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen()
        }
      }
    } catch (err) {
      console.warn('Fullscreen exit error:', err)
    }
  }, [])

  const enterReadingMode = useCallback(() => {
    closeSidebar()
    setSettingsOpen(false)
    requestBrowserFullscreen()
    setIsImmersive(true)
  }, [closeSidebar, requestBrowserFullscreen])

  const exitReadingMode = useCallback(() => {
    exitBrowserFullscreen()
    setIsImmersive(false)
  }, [exitBrowserFullscreen])

  const toggleReadingMode = useCallback(() => {
    if (isImmersive) {
      exitReadingMode()
    } else {
      enterReadingMode()
    }
  }, [isImmersive, exitReadingMode, enterReadingMode])

  // Predictable Escape key handling:
  // 1. If settings is open, close settings
  // 2. If sidebar is open, close sidebar
  // 3. If in reading mode, exit reading mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) {
          e.preventDefault()
          setSettingsOpen(false)
        } else if (isOpen) {
          e.preventDefault()
          closeSidebar()
        } else if (isImmersive) {
          e.preventDefault()
          exitReadingMode()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen, isOpen, isImmersive, closeSidebar, exitReadingMode])

  // Sync with browser native fullscreen exit (e.g. user pressed browser Esc or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as VendorFullscreenDocument
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      if (!isFs && isImmersive) {
        setIsImmersive(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isImmersive])

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Normal Header: Hidden in Immersive Mode */}
      {!isImmersive && (
        <Header
          title={title}
          format={format}
          onToggleSidebar={toggleSidebar}
          onToggleSettings={() => setSettingsOpen(!settingsOpen)}
          onToggleImmersive={showBackButton ? toggleReadingMode : undefined}
          showBackButton={showBackButton}
          onBackToLibrary={onBackToLibrary}
          sidebarOpen={isOpen}
        />
      )}

      {/* Floating Immersive Controls Pill */}
      {isImmersive && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity select-none group">
          <button
            onClick={() => setSettingsOpen(true)}
            className={`p-2 rounded-full border backdrop-blur-xl shadow-lg transition-transform active:scale-[0.95] ${
              isLight
                ? 'bg-white/90 border-gray-200 text-gray-800 hover:bg-white'
                : 'bg-zinc-950/80 border-white/10 text-white hover:bg-zinc-900'
            }`}
            title="Reading Preferences"
            aria-label="Reading settings"
          >
            <AnimatedSettingsIcon size={16} />
          </button>

          <button
            onClick={exitReadingMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-xl shadow-lg transition-transform active:scale-[0.95] ${
              isLight
                ? 'bg-white/90 border-gray-200 text-gray-800 hover:bg-white'
                : 'bg-zinc-950/80 border-white/10 text-white hover:bg-zinc-900'
            }`}
            title="Exit Reading Mode (Esc)"
            aria-label="Exit reading mode"
          >
            {/* Minimize / Exit Icon */}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      )}

      {/* Sidebar (Table of Contents Drawer) */}
      <Sidebar
        toc={toc}
        isOpen={isOpen}
        onClose={closeSidebar}
        currentHref={currentLocationHref}
      />

      {/* Main Content Area: Expands seamlessly to 100% of viewport in Immersive mode */}
      <main
        className={`flex-1 w-full overflow-hidden relative transition-all duration-200 ${
          isImmersive ? 'h-full mt-0' : 'h-[calc(100vh-3.5rem)] mt-14'
        }`}
      >
        {children}
      </main>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReturnToLibrary={onBackToLibrary}
        format={format}
        isImmersive={isImmersive}
        onToggleImmersive={toggleReadingMode}
      />
    </div>
  )
}
