import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type {
  ThemeMode,
  EpubReadingMode,
  PdfAppearanceMode,
  PdfImageTreatment,
  ReaderSettings,
} from '../types'

interface ThemeContextType extends ReaderSettings {
  setCurrentTheme: (theme: ThemeMode) => void
  setFontSize: (size: number) => void
  setFontFamily: (font: string) => void
  setLineHeight: (height: number) => void
  setEpubReadingMode: (mode: EpubReadingMode) => void
  setPdfAppearanceMode: (mode: PdfAppearanceMode) => void
  setPdfImageTreatment: (treatment: PdfImageTreatment) => void
  setAutoScrollSpeed: (speed: number) => void
  currentTheme: ThemeMode // Backwards compatibility alias
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const SETTINGS_KEY = 'bunkai_settings'

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'oled',
  fontSize: 100,
  fontFamily: 'Helvetica',
  lineHeight: 1.5,
  epubReadingMode: 'paginated',
  pdfAppearanceMode: 'dark',
  pdfImageTreatment: 'preserve',
  autoScrollSpeed: 45,
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Persist settings changes
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }, [settings])

  // Apply CSS Variables globally
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const rootElement = document.getElementById('root')

    let bgColor: string
    let textColor: string

    switch (settings.theme) {
      case 'oled':
        bgColor = '#000000'
        textColor = '#a0a0a0'
        break
      case 'dark':
        bgColor = '#111111'
        textColor = '#e5e5e5'
        break
      case 'light':
        bgColor = '#fdfbf7'
        textColor = '#1a1a1a'
        break
    }

    root.style.setProperty('--bg-primary', bgColor)
    root.style.setProperty('--text-primary', textColor)

    if (settings.theme === 'light') {
      root.style.setProperty('--scrollbar-thumb', '#cbd5e1')
      root.style.setProperty('--scrollbar-thumb-hover', '#94a3b8')
    } else {
      root.style.setProperty('--scrollbar-thumb', '#333333')
      root.style.setProperty('--scrollbar-thumb-hover', '#555555')
    }

    body.style.backgroundColor = bgColor
    if (rootElement) {
      rootElement.style.backgroundColor = bgColor
    }

    root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <ThemeContext.Provider
      value={{
        ...settings,
        currentTheme: settings.theme,
        setCurrentTheme: (t) => updateSetting('theme', t),
        setFontSize: (s) => updateSetting('fontSize', s),
        setFontFamily: (f) => updateSetting('fontFamily', f),
        setLineHeight: (l) => updateSetting('lineHeight', l),
        setEpubReadingMode: (m) => updateSetting('epubReadingMode', m),
        setPdfAppearanceMode: (m) => updateSetting('pdfAppearanceMode', m),
        setPdfImageTreatment: (t) => updateSetting('pdfImageTreatment', t),
        setAutoScrollSpeed: (s) => updateSetting('autoScrollSpeed', s),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
