import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { DocumentMetadata, ReadingProgress } from '../../types'
import { usePersistence } from '../../hooks/usePersistence'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import { DynamicNumber } from '../UI/DynamicNumber'
import { AnimatedUploadIcon, AnimatedSearchIcon, AnimatedBookIcon } from '../UI/Icons'
import { Confetti } from '../UI/Confetti'
import { generatePdfThumbnail } from '../../lib/pdfThumbnail'
import { updateDocumentMetadata } from '../../lib/db'

interface LibraryViewProps {
  onOpenDocument: (documentId: string) => void
  onDocumentImported: (metadata: DocumentMetadata) => void
}

export function LibraryView({ onOpenDocument, onDocumentImported }: LibraryViewProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({})
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [filterFormat, setFilterFormat] = useState<'all' | 'epub' | 'pdf'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [celebratingDocId, setCelebratingDocId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    loadAllDocuments,
    loadDocument,
    importDocument,
    deleteDocument,
    getReadingProgress,
    saveReadingProgressImmediate,
  } = usePersistence()
  const { addToast } = useToast()
  const { currentTheme } = useTheme()
  const isLight = currentTheme === 'light'

  // Fetch all documents and progress on mount
  const refreshLibrary = useCallback(async () => {
    try {
      const docs = await loadAllDocuments()
      setDocuments(docs)

      const pMap: Record<string, ReadingProgress> = {}
      const tMap: Record<string, string> = {}
      let pendingCelebrationId: string | null = null

      for (const d of docs) {
        if (d.coverUrl) {
          tMap[d.id] = d.coverUrl
        }
        const prog = await getReadingProgress(d.id)
        if (prog) {
          pMap[d.id] = prog
          if (prog.celebrationState === 'pending' && !pendingCelebrationId) {
            pendingCelebrationId = d.id
          }
        }
      }
      setProgressMap(pMap)
      setThumbnails((prev) => ({ ...prev, ...tMap }))

      // If a book was recently completed, trigger celebration confetti once and mark consumed
      if (pendingCelebrationId) {
        setCelebratingDocId(pendingCelebrationId)
        const progToConsume = pMap[pendingCelebrationId]
        if (progToConsume) {
          const updated: ReadingProgress = { ...progToConsume, celebrationState: 'consumed' }
          saveReadingProgressImmediate(updated)
          pMap[pendingCelebrationId] = updated
        }
      }

      // Generate PDF thumbnails lazily in the background for docs without covers
      for (const d of docs) {
        if (d.format === 'pdf' && !d.coverUrl) {
          loadDocument(d.id).then((stored) => {
            if (stored?.fileBlob) {
              generatePdfThumbnail(stored.fileBlob).then((thumbUrl) => {
                if (thumbUrl) {
                  setThumbnails((prev) => ({ ...prev, [d.id]: thumbUrl }))
                  updateDocumentMetadata(d.id, { coverUrl: thumbUrl })
                }
              })
            }
          })
        }
      }
    } catch (err) {
      console.error('Error loading library documents:', err)
    }
  }, [loadAllDocuments, getReadingProgress, loadDocument, saveReadingProgressImmediate])

  useEffect(() => {
    refreshLibrary()
  }, [refreshLibrary])

  // Process file import
  const handleFile = async (file: File) => {
    setIsImporting(true)
    try {
      const { metadata, isDuplicate } = await importDocument(file)

      if (isDuplicate) {
        addToast(`"${metadata.title}" is already in your library. Resuming...`, 'info')
      } else {
        addToast(`Imported "${metadata.title}" successfully.`, 'success')
      }

      await refreshLibrary()
      onDocumentImported(metadata)
    } catch (err: unknown) {
      console.error('Import error:', err)
      const message = err instanceof Error ? err.message : 'Failed to import document'
      addToast(message, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    addToast(`Delete "${title}" from your library?`, 'info', {
      actionLabel: 'Delete',
      onAction: async () => {
        try {
          await deleteDocument(id)
          await refreshLibrary()
          addToast(`"${title}" deleted.`, 'success')
        } catch {
          addToast('Could not delete document', 'error')
        }
      },
    })
  }

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesFormat = filterFormat === 'all' || doc.format === filterFormat
      const matchesQuery =
        searchQuery.trim() === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.author.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFormat && matchesQuery
    })
  }, [documents, filterFormat, searchQuery])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const formatTimeAgo = (ts: number) => {
    const diffMs = Date.now() - ts
    const mins = Math.floor(diffMs / 60000)
    if (mins < 2) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  const formatReadingTime = (seconds: number | undefined): string => {
    if (!seconds || seconds < 60) return '< 1m read'
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m read`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    if (remainingMins === 0) return `${hours}h read`
    return `${hours}h ${remainingMins}m read`
  }

  return (
    <div
      className="h-full w-full overflow-y-auto px-6 py-8 relative select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 dark:border-white/10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Library
            </h1>
            <p className="text-xs opacity-60 mt-0.5">
              <DynamicNumber value={documents.length} /> {documents.length === 1 ? 'document' : 'documents'} saved locally
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 opacity-40">
                <AnimatedSearchIcon size={16} />
              </div>
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-3 py-1.5 rounded-lg text-xs border transition-colors outline-none w-44 md:w-56 ${
                  isLight
                    ? 'bg-gray-100 border-gray-200 text-gray-900 focus:border-gray-400'
                    : 'bg-white/5 border-white/10 text-white focus:border-white/20'
                }`}
              />
            </div>

            {/* Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors shadow-sm ${
                isLight
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <AnimatedUploadIcon size={16} />
              <span>{isImporting ? 'Importing...' : 'Import EPUB or PDF'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub,.pdf,application/pdf,application/epub+zip"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'epub', 'pdf'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                filterFormat === fmt
                  ? isLight
                    ? 'bg-gray-900 text-white'
                    : 'bg-white/20 text-white'
                  : isLight
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {fmt === 'all' ? 'All Files' : fmt.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Documents Grid / Empty State */}
        {filteredDocuments.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[360px] ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : isLight
                  ? 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
          >
            <AnimatedUploadIcon size={32} className="opacity-40 mb-3" />
            <h3 className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? 'No matching documents found' : 'No documents in your library yet'}
            </h3>
            <p className="text-xs opacity-60 max-w-sm mb-4">
              Drag and drop any .epub or .pdf file here, or click to browse files from your device.
            </p>
            <span className="text-xs font-medium underline opacity-80 hover:opacity-100">
              Browse Document
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map((doc) => {
              const prog = progressMap[doc.id]
              const isCompleted = Boolean(prog?.completed || (prog?.percentage || 0) >= 0.99)
              const progressPct = isCompleted ? 100 : Math.round((prog?.percentage || 0) * 100)
              const readingTime = formatReadingTime(prog?.activeReadingSeconds)
              const cover = thumbnails[doc.id]
              const isCelebrating = celebratingDocId === doc.id

              return (
                <motion.div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  className={`p-5 rounded-2xl border cursor-pointer relative group flex flex-col justify-between transition-colors overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.06),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.04)] ${
                    isLight
                      ? 'bg-white border-gray-200/90 hover:border-gray-300'
                      : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Subtle Confetti Overlay for newly completed book */}
                  {isCelebrating && (
                    <Confetti onComplete={() => setCelebratingDocId(null)} />
                  )}

                  <div>
                    {/* Top row: Format & Completion Badges + Delete button */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                            doc.format === 'pdf'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}
                        >
                          {doc.format}
                        </span>

                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Completed
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, doc.id, doc.title)}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-all text-xs"
                        title="Remove from library"
                        aria-label="Delete document"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Middle: Optional Cover thumbnail or Book Icon + Title */}
                    <div className="flex gap-4 items-start mb-4">
                      {cover ? (
                        <div className="w-16 h-22 flex-shrink-0 rounded-lg overflow-hidden relative shadow-sm border border-black/10 dark:border-white/10">
                          <img
                            src={cover}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-18 flex-shrink-0 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-40 border border-black/5 dark:border-white/5">
                          <AnimatedBookIcon size={24} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-semibold line-clamp-2 leading-snug mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {doc.title}
                        </h3>

                        <p className="text-xs opacity-60 truncate">
                          {doc.author || 'Unknown Author'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress & File Metadata Footer */}
                  <div className="mt-2 pt-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] opacity-60 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{formatTimeAgo(doc.lastOpenedAt)}</span>
                        <span>•</span>
                        <span>{readingTime}</span>
                      </div>
                      <span>
                        <DynamicNumber value={progressPct} suffix="%" />
                      </span>
                    </div>

                    {/* Progress Bar (Green when completed) */}
                    <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : doc.format === 'pdf'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(3, progressPct)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 pointer-events-none"
          >
            <div className="max-w-md w-full p-12 border-2 border-dashed border-white/40 rounded-3xl text-center bg-black/40">
              <AnimatedUploadIcon size={48} className="mx-auto mb-4 text-white" />
              <p className="text-lg font-medium text-white mb-1">Release to Import</p>
              <p className="text-xs text-white/70">Accepts .epub and .pdf documents</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
