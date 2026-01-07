import { HiMenu, HiCog } from 'react-icons/hi'
import { CiViewTable } from "react-icons/ci";
import { useTheme } from '../../context/ThemeContext'

interface HeaderProps {
  title?: string
  onToggleSidebar: () => void
  onToggleSettings: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  showBackButton?: boolean
  onBackToToc?: () => void
}

export function Header({
  title,
  onToggleSidebar,
  onToggleSettings,
  onMouseEnter,
  onMouseLeave,
  showBackButton,
  onBackToToc,
}: HeaderProps) {
  const { currentTheme } = useTheme()

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-40 backdrop-blur-md border-b"
      style={{
        backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
        borderColor: currentTheme === 'light' ? 'rgba(229, 231, 235, 0.5)' : 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      
      {/* Left: Sidebar Toggle (always available) */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded transition-colors"
        style={{
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        aria-label="Toggle table of contents sidebar"
      >
        <HiMenu className="w-6 h-6" />
      </button>

      

      {/* Center: Title */}
      <div className="flex flex-col items-center justify-center transition-opacity duration-300">
        <h1
          className="text-sm font-medium tracking-wide max-w-md truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {'BunKai'}
        </h1>
        {title}
      </div>

<div>

        {/* Back to TOC button (only in reader mode) */}
      {showBackButton && onBackToToc && (
        <button
          onClick={onBackToToc}
          className="p-2 rounded transition-colors ml-2"
          style={{
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Back to table of contents"
        >
          <CiViewTable className="w-6 h-6" />
        </button>
      )}
      {/* Right: Settings Toggle */}
      <button
        onClick={onToggleSettings}
        className="p-2 rounded transition-colors"
        style={{
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        aria-label="Open settings"
      >
        <HiCog className="w-6 h-6" />
      </button>
          </div>
    </header>
  )
}

