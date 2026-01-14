import { useState, type ReactNode } from 'react'
import { HudProvider } from './HudContext'
import { SettingsPanel } from '../UI/SettingsPanel'
import { Header } from '../UI/Header'
import { Sidebar } from '../UI/Sidebar'
import { useSidebar } from './SidebarContext'

interface AppShellProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBackToToc?: () => void
  onResetBook?: () => void
}

export function AppShell({ children, title, showBackButton, onBackToToc, onResetBook }: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { isOpen, toc, closeSidebar, toggleSidebar } = useSidebar()

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header (Fixed Height: h-16 = 4rem) */}
      <Header
        title={title}
        onToggleSidebar={toggleSidebar}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
        showBackButton={showBackButton}
        onBackToToc={onBackToToc}
      />

      <Sidebar toc={toc} isOpen={isOpen} onClose={closeSidebar} />

      {/* Main Content: Anchored absolutely to ensure exact fit */}
      <main className="absolute top-16 bottom-0 left-0 right-0">
        <HudProvider onKeepHudOpen={() => {}}>{children}</HudProvider>
      </main>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetBook={onResetBook}
      />
    </div>
  )
}
