import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { usePersistence } from './hooks/usePersistence'
import { AppShell } from './components/Layout/AppShell'
import { Landing } from './components/Views/Landing'
import { TocScreen } from './components/Views/TocScreen'
import { Reader } from './components/Reader/Reader'
import { BookParser } from './components/BookParser'
import { SidebarProvider, useSidebar } from './components/Layout/SidebarContext'
import type { BookMeta } from './types'
import type { TocItem } from './components/Layout/SidebarContext'

type ViewState = 'landing' | 'toc' | 'reader'

// Inner component that has access to SidebarContext
function AppContent() {
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null)
  const [metadata, setMetadata] = useState<BookMeta | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [currentView, setCurrentView] = useState<ViewState>('landing')
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { loadBookFromDevice, getLastChapter } = usePersistence()
  const { setToc: setSidebarToc } = useSidebar()

  // Sync TOC to SidebarContext whenever it changes
  useEffect(() => {
    setSidebarToc(toc)
  }, [toc, setSidebarToc])

  // Check for existing book on mount
  useEffect(() => {
    const checkForBook = async () => {
      setLoading(true)
      const book = await loadBookFromDevice()
      if (book) {
        setBookData(book)
        
        // Check for last visited chapter
        const lastChapter = getLastChapter()
        if (lastChapter) {
          // Restore to the last chapter
          setCurrentChapterHref(lastChapter)
          setCurrentView('reader')
        } else {
          // No last chapter, show TOC
          setCurrentView('toc')
        }
      }
      setLoading(false)
    }

    checkForBook()
  }, [loadBookFromDevice, getLastChapter])

  const handleBookLoaded = async () => {
    setLoading(true)
    const data = await loadBookFromDevice()
    if (data) {
      setBookData(data)
      setCurrentView('toc')
    }
    setLoading(false)
  }

  const handleChapterSelect = (href: string) => {
    setCurrentChapterHref(href)
    setCurrentView('reader')
  }

  const handleBackToToc = () => {
    setCurrentView('toc')
  }

  const handleNavigateChapter = (href: string) => {
    setCurrentChapterHref(href)
  }

  const handleChapterChange = (href: string, _index: number) => {
    // Update current chapter when Reader reports a change
    setCurrentChapterHref(href)
  }

  return (
    <AppShell
      title={metadata?.title}
      showBackButton={currentView === 'reader'}
      onBackToToc={handleBackToToc}
    >
      {bookData && (
        <BookParser
          data={bookData}
          onMetadataLoaded={setMetadata}
          onTocLoaded={setToc}
        />
      )}
      {currentView === 'landing' ? (
        <Landing onBookLoaded={handleBookLoaded} />
      ) : currentView === 'toc' ? (
        <TocScreen
          toc={toc}
          onSelectChapter={handleChapterSelect}
          bookTitle={metadata?.title || 'Untitled'}
        />
      ) : currentView === 'reader' && bookData && currentChapterHref ? (
        <Reader
          data={bookData}
          loading={loading}
          initialLocation={currentChapterHref}
          onNavigateChapter={handleNavigateChapter}
          onChapterChange={handleChapterChange}
        />
      ) : null}
    </AppShell>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
