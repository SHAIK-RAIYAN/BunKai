import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { SidebarProvider, useSidebar } from './components/Layout/SidebarContext'
import { AppShell } from './components/Layout/AppShell'
import { LibraryView } from './components/Views/LibraryView'
import { ReaderWorkspace } from './components/Reader/ReaderWorkspace'
import { usePersistence } from './hooks/usePersistence'
import type { DocumentMetadata, ReadingProgress, StoredDocument } from './types'

type ViewMode = 'library' | 'reader'

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewMode>('library')
  const [activeDocument, setActiveDocument] = useState<StoredDocument | null>(null)
  const [initialProgress, setInitialProgress] = useState<ReadingProgress | null>(null)

  const { loadDocument, getReadingProgress, loadAllDocuments } = usePersistence()
  const { setToc } = useSidebar()
  const { addToast } = useToast()

  // On mount, initialize storage & legacy migrations
  useEffect(() => {
    loadAllDocuments().catch((err) => {
      console.warn('Failed to load initial library state:', err)
    })
  }, [loadAllDocuments])

  // Open document by ID
  const handleOpenDocument = useCallback(
    async (documentId: string) => {
      try {
        const doc = await loadDocument(documentId)
        if (!doc) {
          addToast('Could not load document from local storage.', 'error')
          return
        }

        const progress = await getReadingProgress(documentId)
        setActiveDocument(doc)
        setInitialProgress(progress)
        setToc([])
        setCurrentView('reader')
      } catch (err: any) {
        console.error('Error opening document:', err)
        addToast(err?.message || 'Failed to open document', 'error')
      }
    },
    [loadDocument, getReadingProgress, addToast, setToc],
  )

  // Document imported from Library drag & drop
  const handleDocumentImported = useCallback(
    (metadata: DocumentMetadata) => {
      handleOpenDocument(metadata.id)
    },
    [handleOpenDocument],
  )

  // Back to Library
  const handleBackToLibrary = useCallback(() => {
    setActiveDocument(null)
    setInitialProgress(null)
    setToc([])
    setCurrentView('library')
  }, [setToc])

  const handleUpdateMetadata = useCallback((updates: Partial<DocumentMetadata>) => {
    setActiveDocument((prev) => {
      if (!prev) return null
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...updates,
        },
      }
    })
  }, [])

  return (
    <AppShell
      title={activeDocument?.metadata.title}
      format={activeDocument?.metadata.format}
      showBackButton={currentView === 'reader'}
      onBackToLibrary={handleBackToLibrary}
      currentLocationHref={initialProgress?.epubCfi || initialProgress?.epubHref}
    >
      <AnimatePresence mode="wait">
        {currentView === 'library' ? (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="h-full w-full"
          >
            <LibraryView
              onOpenDocument={handleOpenDocument}
              onDocumentImported={handleDocumentImported}
            />
          </motion.div>
        ) : currentView === 'reader' && activeDocument ? (
          <motion.div
            key={`reader-${activeDocument.metadata.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full w-full"
          >
            <ReaderWorkspace
              documentMeta={activeDocument.metadata}
              fileBlob={activeDocument.fileBlob}
              initialProgress={initialProgress}
              onUpdateMetadata={handleUpdateMetadata}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
