import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ThemeMode } from '../types'

interface Settings {
  theme: ThemeMode
  fontSize: number
  fontFamily: string
  lineHeight: number
}

interface ThemeContextType {
  currentTheme: ThemeMode
  setCurrentTheme: (theme: ThemeMode) => void
  fontSize: number
  setFontSize: (size: number) => void
  fontFamily: string
  setFontFamily: (font: string) => void
  lineHeight: number
  setLineHeight: (height: number) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const SETTINGS_KEY = 'bunkai_settings'

const DEFAULT_SETTINGS: Settings = {
  theme: 'oled',
  fontSize: 100,
  fontFamily: 'Helvetica',
  lineHeight: 1.5,
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Persist to localStorage
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
        textColor = '#a0a0a0' // Adjusted for high contrast
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

    // Set CSS variables
    root.style.setProperty('--bg-primary', bgColor)
    root.style.setProperty('--text-primary', textColor)

    // Set scrollbar colors based on theme
    if (settings.theme === 'light') {
      root.style.setProperty('--scrollbar-thumb', '#cbd5e1')
      root.style.setProperty('--scrollbar-thumb-hover', '#94a3b8')
    } else {
      root.style.setProperty('--scrollbar-thumb', '#333')
      root.style.setProperty('--scrollbar-thumb-hover', '#555')
    }

    // Apply background to body and root element to prevent white gaps
    body.style.backgroundColor = bgColor
    if (rootElement) {
      rootElement.style.backgroundColor = bgColor
    }

    root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const updateSettings = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: settings.theme,
        setCurrentTheme: (t) => updateSettings('theme', t),
        fontSize: settings.fontSize,
        setFontSize: (s) => updateSettings('fontSize', s),
        fontFamily: settings.fontFamily,
        setFontFamily: (f) => updateSettings('fontFamily', f),
        lineHeight: settings.lineHeight,
        setLineHeight: (l) => updateSettings('lineHeight', l),
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

