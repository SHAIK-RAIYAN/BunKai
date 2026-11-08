import { useCallback, useRef } from 'react'
import type { DocumentMetadata, ReadingProgress, StoredDocument } from '../types'
import {
  saveDocumentRecord,
  getDocumentRecord,
  getAllDocumentMetadata,
  deleteDocumentRecord,
  saveReadingProgressRecord,
  getReadingProgressRecord,
  checkAndMigrateLegacyBook,
  getStorageQuotaEstimate,
} from '../lib/db'
import { computeDocumentFingerprint, detectDocumentFormat } from '../lib/fingerprint'

export function usePersistence() {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const importDocument = useCallback(
    async (
      file: File,
      customMetadata?: Partial<DocumentMetadata>,
    ): Promise<{ metadata: DocumentMetadata; isDuplicate: boolean; fileBlob: Blob }> => {
      const format = await detectDocumentFormat(file, file.name)
      if (!format) {
        throw new Error('Unsupported document format. Please provide an .epub or .pdf file.')
      }

      const fingerprint = await computeDocumentFingerprint(file)
      const existing = await getDocumentRecord(fingerprint)

      if (existing) {
        const updatedMeta: DocumentMetadata = {
          ...existing.metadata,
          lastOpenedAt: Date.now(),
        }
        await saveDocumentRecord({ metadata: updatedMeta, fileBlob: existing.fileBlob })
        return { metadata: updatedMeta, isDuplicate: true, fileBlob: existing.fileBlob }
      }

      const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Untitled'

      const metadata: DocumentMetadata = {
        id: fingerprint,
        title: customMetadata?.title || defaultTitle,
        author: customMetadata?.author || 'Unknown Author',
        format,
        fileSize: file.size,
        coverUrl: customMetadata?.coverUrl,
        pageCount: customMetadata?.pageCount,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
      }

      const storedDoc: StoredDocument = {
        metadata,
        fileBlob: file,
      }

      await saveDocumentRecord(storedDoc)
      return { metadata, isDuplicate: false, fileBlob: file }
    },
    [],
  )

  const loadDocument = useCallback(async (id: string): Promise<StoredDocument | null> => {
    return getDocumentRecord(id)
  }, [])

  const loadAllDocuments = useCallback(async (): Promise<DocumentMetadata[]> => {
    await checkAndMigrateLegacyBook()
    return getAllDocumentMetadata()
  }, [])

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    return deleteDocumentRecord(id)
  }, [])

  const saveReadingProgressImmediate = useCallback(async (progress: ReadingProgress): Promise<void> => {
    try {
      await saveReadingProgressRecord(progress)
    } catch (err) {
      console.error('Failed to save reading progress:', err)
    }
  }, [])

  const saveReadingProgressDebounced = useCallback(
    (progress: ReadingProgress, delayMs = 300): void => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveReadingProgressRecord(progress).catch((err) =>
          console.error('Debounced save error:', err),
        )
      }, delayMs)
    },
    [],
  )

  const getReadingProgress = useCallback(
    async (documentId: string): Promise<ReadingProgress | null> => {
      return getReadingProgressRecord(documentId)
    },
    [],
  )

  const loadBookFromDevice = useCallback(async (): Promise<ArrayBuffer | null> => {
    const all = await loadAllDocuments()
    if (all.length > 0) {
      const first = await loadDocument(all[0].id)
      if (first) {
        return first.fileBlob.arrayBuffer()
      }
    }
    return null
  }, [loadAllDocuments, loadDocument])

  const saveLastChapter = useCallback((href: string) => {
    try {
      localStorage.setItem('bunkai_last_chapter', href)
    } catch (err) {
      console.warn('saveLastChapter failed:', err)
    }
  }, [])

  const getLastChapter = useCallback((): string | null => {
    try {
      return localStorage.getItem('bunkai_last_chapter')
    } catch {
      return null
    }
  }, [])

  return {
    importDocument,
    loadDocument,
    loadAllDocuments,
    deleteDocument,
    saveReadingProgressImmediate,
    saveReadingProgressDebounced,
    getReadingProgress,
    getStorageQuotaEstimate,
    loadBookFromDevice,
    saveLastChapter,
    getLastChapter,
  }
}
