import { useCallback } from 'react'
import { set, get, del } from 'idb-keyval'
import type { StoredBook } from '../types'

const BOOK_STORAGE_KEY = 'bunkai_book'
const READING_POSITION_KEY = 'bunkai_reading_position'
const LAST_CHAPTER_KEY = 'bunkai_last_chapter'
const SIDEBAR_SCROLL_KEY = 'bunkai_sidebar_scroll'
const TOC_SCROLL_KEY = 'bunkai_toc_scroll'

/**
 * Hook for managing persistence layer
 * Uses IndexedDB (via idb-keyval) for large files and localStorage for lightweight data
 */
export function usePersistence() {
  /**
   * Converts a File to ArrayBuffer and saves it to IndexedDB
   * @param file - The file to save
   */
  const saveBookToDevice = useCallback(async (file: File): Promise<void> => {
    const arrayBuffer = await file.arrayBuffer()
    const storedBook: StoredBook = {
      file: arrayBuffer,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, '') || 'Untitled',
        author: 'Unknown',
        coverUrl: undefined,
      },
    }
    await set(BOOK_STORAGE_KEY, storedBook)
  }, [])

  /**
   * Retrieves the book file from IndexedDB
   * @returns The book ArrayBuffer or null if not found
   */
  const loadBookFromDevice = useCallback(async (): Promise<ArrayBuffer | null> => {
    const storedBook = await get<StoredBook>(BOOK_STORAGE_KEY)
    return storedBook?.file ?? null
  }, [])

  /**
   * Saves the current reading position (CFI) to localStorage
   * @param cfi - The Epub CFI string representing the reading position
   */
  const saveReadingPosition = useCallback((cfi: string): void => {
    try {
      localStorage.setItem(READING_POSITION_KEY, cfi)
    } catch (error) {
      console.error('Failed to save reading position:', error)
    }
  }, [])

  /**
   * Retrieves the last saved reading position
   * @returns The CFI string or null if not found
   */
  const getReadingPosition = useCallback((): string | null => {
    try {
      return localStorage.getItem(READING_POSITION_KEY)
    } catch (error) {
      console.error('Failed to get reading position:', error)
      return null
    }
  }, [])

  /**
   * Saves the last visited chapter HREF to localStorage
   * @param href - The chapter HREF string
   */
  const saveLastChapter = useCallback((href: string): void => {
    try {
      localStorage.setItem(LAST_CHAPTER_KEY, href)
    } catch (error) {
      console.error('Failed to save last chapter:', error)
    }
  }, [])

  /**
   * Retrieves the last visited chapter HREF
   * @returns The chapter HREF string or null if not found
   */
  const getLastChapter = useCallback((): string | null => {
    try {
      return localStorage.getItem(LAST_CHAPTER_KEY)
    } catch (error) {
      console.error('Failed to get last chapter:', error)
      return null
    }
  }, [])

  /**
   * Saves the sidebar scroll position to localStorage
   * @param y - The scroll position (scrollTop value)
   */
  const saveSidebarScroll = useCallback((y: number): void => {
    try {
      localStorage.setItem(SIDEBAR_SCROLL_KEY, y.toString())
    } catch (error) {
      console.error('Failed to save sidebar scroll:', error)
    }
  }, [])

  /**
   * Retrieves the saved sidebar scroll position
   * @returns The scroll position as a number, or 0 if not found
   */
  const getSidebarScroll = useCallback((): number => {
    try {
      const value = localStorage.getItem(SIDEBAR_SCROLL_KEY)
      return value ? Number(value) : 0
    } catch (error) {
      console.error('Failed to get sidebar scroll:', error)
      return 0
    }
  }, [])

  /**
   * Saves the TOC scroll position to localStorage
   * @param y - The scroll position (scrollTop value)
   */
  const saveTocScroll = useCallback((y: number): void => {
    try {
      localStorage.setItem(TOC_SCROLL_KEY, y.toString())
    } catch (error) {
      console.error('Failed to save TOC scroll:', error)
    }
  }, [])

  /**
   * Retrieves the saved TOC scroll position
   * @returns The scroll position as a number, or 0 if not found
   */
  const getTocScroll = useCallback((): number => {
    try {
      const value = localStorage.getItem(TOC_SCROLL_KEY)
      return value ? Number(value) : 0
    } catch (error) {
      console.error('Failed to get TOC scroll:', error)
      return 0
    }
  }, [])

  /**
   * Clears the book from storage (for loading a new one)
   */
  const clearBook = useCallback(async (): Promise<void> => {
    await del(BOOK_STORAGE_KEY)
    localStorage.removeItem(READING_POSITION_KEY)
    localStorage.removeItem(LAST_CHAPTER_KEY)
    localStorage.removeItem(SIDEBAR_SCROLL_KEY)
    localStorage.removeItem(TOC_SCROLL_KEY)
  }, [])

  return {
    saveBookToDevice,
    loadBookFromDevice,
    saveReadingPosition,
    getReadingPosition,
    saveLastChapter,
    getLastChapter,
    saveSidebarScroll,
    getSidebarScroll,
    saveTocScroll,
    getTocScroll,
    clearBook,
  }
}

