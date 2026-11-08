export type ThemeMode = 'light' | 'dark' | 'oled'

export type EpubReadingMode = 'paginated' | 'continuous'

export type PdfAppearanceMode = 'original' | 'dark'

export type PdfImageTreatment = 'preserve' | 'transform'

export type DocumentFormat = 'epub' | 'pdf'

export interface ReaderSettings {
  theme: ThemeMode
  fontSize: number
  fontFamily: string
  lineHeight: number
  epubReadingMode: EpubReadingMode
  pdfAppearanceMode: PdfAppearanceMode
  pdfImageTreatment: PdfImageTreatment
  autoScrollSpeed: number
}

export interface DocumentMetadata {
  id: string
  title: string
  author: string
  format: DocumentFormat
  fileSize: number
  coverUrl?: string
  pageCount?: number
  createdAt: number
  lastOpenedAt: number
}

export interface ReadingProgress {
  documentId: string
  format: DocumentFormat
  percentage: number
  epubCfi?: string
  epubHref?: string
  pdfPage?: number
  pdfScrollOffsetRatio?: number
  pdfZoom?: number
  lastUpdated: number
}

export interface StoredDocument {
  metadata: DocumentMetadata
  fileBlob: Blob
}

// Backwards compatibility alias
export type BookMeta = DocumentMetadata
