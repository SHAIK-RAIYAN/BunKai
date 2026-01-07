export type ThemeMode = 'light' | 'dark' | 'oled'

export interface ReaderSettings {
  fontScale: number
  fontFamily: string
  lineHeight: number
  theme: ThemeMode
}

export interface BookMeta {
  title: string
  author: string
  coverUrl?: string
}

export interface StoredBook {
  file: ArrayBuffer
  metadata: BookMeta
}

