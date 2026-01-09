import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const FONT_FAMILIES = ['Helvetica', 'Georgia', 'Merriweather']

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    currentTheme,
    setCurrentTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
  } = useTheme()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-16 right-4 z-50 w-80 rounded-lg shadow-2xl border"
            style={{
              backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
              borderColor: currentTheme === 'light' ? 'rgba(229, 231, 235, 1)' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded transition-colors"
              style={{
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label="Close settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-3"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Theme
            </label>
            <div className="flex gap-2">
              {(['oled', 'dark', 'light'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setCurrentTheme(theme)}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                    currentTheme === theme
                      ? currentTheme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white/20 text-white'
                      : currentTheme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {theme === 'oled' ? 'Black' : theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label
                className="block text-sm font-medium"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                Font Size
              </label>
              <span
                className="text-sm opacity-70"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                {fontSize}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(Math.max(80, fontSize - 5))}
                className={`px-3 py-1 rounded transition-colors ${
                  currentTheme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
                disabled={fontSize <= 80}
              >
                −
              </button>
              <input
                type="range"
                min="80"
                max="150"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: currentTheme === 'light' ? '#e5e7eb' : '#374151',
                }}
              />
              <button
                onClick={() => setFontSize(Math.min(150, fontSize + 5))}
                className={`px-3 py-1 rounded transition-colors ${
                  currentTheme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
                disabled={fontSize >= 150}
              >
                +
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Font Family
            </label>
            <div className="flex flex-col gap-2">
              {FONT_FAMILIES.map((family) => (
                <button
                  key={family}
                  onClick={() => setFontFamily(family)}
                  className={`px-4 py-2 rounded text-sm text-left transition-all ${
                    fontFamily === family
                      ? currentTheme === 'light'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white/20 text-white'
                      : currentTheme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {family}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

