import type { DocumentMetadata, ReadingProgress, StoredDocument } from '../types'
import { get as idbGet, del as idbDel } from 'idb-keyval'
import { computeDocumentFingerprint } from './fingerprint'

const DB_NAME = 'bunkai_storage'
const DB_VERSION = 1
const STORE_DOCS = 'documents'
const STORE_PROGRESS = 'progress'

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 1. Documents store
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        const docStore = db.createObjectStore(STORE_DOCS, { keyPath: 'metadata.id' })
        docStore.createIndex('format', 'metadata.format', { unique: false })
        docStore.createIndex('lastOpenedAt', 'metadata.lastOpenedAt', { unique: false })
      }

      // 2. Reading progress store
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        const progStore = db.createObjectStore(STORE_PROGRESS, { keyPath: 'documentId' })
        progStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      console.warn('BunKai IndexedDB upgrade blocked by open tabs.')
    }
  })

  return dbPromise
}

/**
 * Saves a document record to IndexedDB. Handles QuotaExceededError with friendly explanation.
 */
export async function saveDocumentRecord(doc: StoredDocument): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_DOCS], 'readwrite')
      const store = tx.objectStore(STORE_DOCS)
      const request = store.put(doc)

      request.onsuccess = () => resolve()
      request.onerror = (e) => {
        const error = (e.target as IDBRequest).error
        if (error?.name === 'QuotaExceededError') {
          reject(new Error('Browser storage quota exceeded. Please remove some existing documents to free up space.'))
        } else {
          reject(error || new Error('Failed to save document'))
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Retrieves a single stored document (metadata + fileBlob) by fingerprint ID.
 */
export async function getDocumentRecord(id: string): Promise<StoredDocument | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCS], 'readonly')
    const store = tx.objectStore(STORE_DOCS)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Returns a list of all saved document metadata sorted by lastOpenedAt descending.
 */
export async function getAllDocumentMetadata(): Promise<DocumentMetadata[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCS], 'readonly')
    const store = tx.objectStore(STORE_DOCS)
    const request = store.getAll()

    request.onsuccess = () => {
      const docs: StoredDocument[] = request.result || []
      const metadatas = docs.map((d) => d.metadata)
      metadatas.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      resolve(metadatas)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Updates metadata for a document (e.g. title, author, coverUrl, lastOpenedAt).
 */
export async function updateDocumentMetadata(id: string, updates: Partial<DocumentMetadata>): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCS], 'readwrite')
    const store = tx.objectStore(STORE_DOCS)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const doc: StoredDocument | undefined = getReq.result
      if (!doc) {
        resolve()
        return
      }
      doc.metadata = { ...doc.metadata, ...updates }
      const putReq = store.put(doc)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/**
 * Deletes a document and its associated reading progress.
 */
export async function deleteDocumentRecord(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCS, STORE_PROGRESS], 'readwrite')
    tx.objectStore(STORE_DOCS).delete(id)
    tx.objectStore(STORE_PROGRESS).delete(id)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Saves reading progress for a specific document.
 */
export async function saveReadingProgressRecord(progress: ReadingProgress): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROGRESS], 'readwrite')
    const store = tx.objectStore(STORE_PROGRESS)
    const request = store.put(progress)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Retrieves reading progress for a specific document.
 */
export async function getReadingProgressRecord(documentId: string): Promise<ReadingProgress | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROGRESS], 'readonly')
    const store = tx.objectStore(STORE_PROGRESS)
    const request = store.get(documentId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Migrates legacy `bunkai_book` from idb-keyval if it exists from earlier version.
 */
export async function checkAndMigrateLegacyBook(): Promise<DocumentMetadata | null> {
  try {
    const legacyBook = await idbGet<{ file: ArrayBuffer; metadata: { title: string; author: string } }>('bunkai_book')
    if (legacyBook && legacyBook.file) {
      const blob = new Blob([legacyBook.file], { type: 'application/epub+zip' })
      const fingerprint = await computeDocumentFingerprint(blob)

      const metadata: DocumentMetadata = {
        id: fingerprint,
        title: legacyBook.metadata?.title || 'Untitled',
        author: legacyBook.metadata?.author || 'Unknown Author',
        format: 'epub',
        fileSize: blob.size,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
      }

      await saveDocumentRecord({ metadata, fileBlob: blob })

      // Migrate legacy reading position if any
      const legacyCfi = localStorage.getItem('bunkai_reading_position')
      const legacyHref = localStorage.getItem('bunkai_last_chapter')
      if (legacyCfi || legacyHref) {
        await saveReadingProgressRecord({
          documentId: fingerprint,
          format: 'epub',
          percentage: 0,
          epubCfi: legacyCfi || undefined,
          epubHref: legacyHref || undefined,
          lastUpdated: Date.now(),
        })
      }

      // Remove legacy key after successful migration
      await idbDel('bunkai_book')
      return metadata
    }
  } catch (err) {
    console.warn('Legacy migration check encountered an error:', err)
  }
  return null
}

/**
 * Storage quota helper.
 */
export async function getStorageQuotaEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentUsed: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      const usedBytes = estimate.usage || 0
      const quotaBytes = estimate.quota || 0
      const percentUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0
      return { usedBytes, quotaBytes, percentUsed }
    } catch {
      return null
    }
  }
  return null
}

