import { useState, type ReactNode } from 'react'
import { SettingsPanel } from '../UI/SettingsPanel'
import { Header } from '../UI/Header'
import { Sidebar } from '../UI/Sidebar'
import { useSidebar } from './SidebarContext'

interface AppShellProps {
  children: ReactNode
  title?: string
  format?: 'epub' | 'pdf'
  showBackButton?: boolean
  onBackToLibrary?: () => void
  currentLocationHref?: string | null
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
  const { isOpen, toc, closeSidebar, toggleSidebar } = useSidebar()

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <Header
        title={title}
        format={format}
        onToggleSidebar={toggleSidebar}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        showBackButton={showBackButton}
        onBackToLibrary={onBackToLibrary}
        sidebarOpen={isOpen}
      />

      {/* Sidebar (Table of Contents Drawer) */}
      <Sidebar
        toc={toc}
        isOpen={isOpen}
        onClose={closeSidebar}
        currentHref={currentLocationHref}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] mt-14 overflow-hidden relative">
        {children}
      </main>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReturnToLibrary={onBackToLibrary}
        format={format}
      />
    </div>
  )
}
