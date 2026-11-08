import { motion, AnimatePresence } from 'motion/react'
import { useTheme } from '../../context/ThemeContext'
import { DynamicNumber } from './DynamicNumber'
import { AnimatedCloseIcon } from './Icons'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onReturnToLibrary?: () => void
  format?: 'epub' | 'pdf'
}

const FONT_FAMILIES = ['Helvetica', 'Georgia', 'Merriweather', 'Charter', 'Inter']

export function SettingsPanel({
  isOpen,
  onClose,
  onReturnToLibrary,
  format = 'epub',
}: SettingsPanelProps) {
  const {
    currentTheme,
    setCurrentTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    epubReadingMode,
    setEpubReadingMode,
    pdfAppearanceMode,
    setPdfAppearanceMode,
    pdfImageTreatment,
    setPdfImageTreatment,
    autoScrollSpeed,
    setAutoScrollSpeed,
  } = useTheme()

  const isLight = currentTheme === 'light'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`fixed top-16 right-4 z-50 w-88 max-h-[85vh] overflow-y-auto rounded-2xl border backdrop-blur-xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] ${
              isLight
                ? 'bg-white/95 border-gray-200 text-gray-900'
                : 'bg-zinc-900/95 border-white/10 text-white'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Reading Preferences</h2>
                  <p className="text-[11px] opacity-60">Personalized reading & document settings</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="Close settings"
                >
                  <AnimatedCloseIcon size={16} />
                </button>
              </div>

              {/* Theme Selection */}
              <div className="mb-6">
                <label className="block text-xs font-medium mb-2.5 opacity-80">Application Theme</label>
                <div className="flex gap-2">
                  {(['oled', 'dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCurrentTheme(t)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                        currentTheme === t
                          ? isLight
                            ? 'bg-gray-900 text-white'
                            : 'bg-white/25 text-white shadow-sm'
                          : isLight
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {t === 'oled' ? 'OLED' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* EPUB Specific Settings */}
              {format === 'epub' && (
                <>
                  {/* EPUB Reading Mode: Paginated vs Continuous */}
                  <div className="mb-6">
                    <label className="block text-xs font-medium mb-2.5 opacity-80">EPUB Reading Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEpubReadingMode('paginated')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                          epubReadingMode === 'paginated'
                            ? isLight
                              ? 'bg-gray-900 text-white'
                              : 'bg-white/25 text-white'
                            : isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Paginated
                      </button>
                      <button
                        onClick={() => setEpubReadingMode('continuous')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                          epubReadingMode === 'continuous'
                            ? isLight
                              ? 'bg-gray-900 text-white'
                              : 'bg-white/25 text-white'
                            : isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Continuous
                      </button>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium opacity-80">Font Size</label>
                      <span className="text-xs font-mono tabular-nums opacity-60">
                        <DynamicNumber value={fontSize} suffix="%" />
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFontSize(Math.max(80, fontSize - 5))}
                        className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/10 text-xs font-medium"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min="80"
                        max="160"
                        step="5"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-zinc-700"
                      />
                      <button
                        onClick={() => setFontSize(Math.min(160, fontSize + 5))}
                        className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/10 text-xs font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="mb-6">
                    <label className="block text-xs font-medium mb-2 opacity-80">Font Family</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_FAMILIES.map((fam) => (
                        <button
                          key={fam}
                          onClick={() => setFontFamily(fam)}
                          className={`px-3 py-2 rounded-lg text-xs text-left font-medium transition-transform active:scale-[0.97] transition-colors truncate ${
                            fontFamily === fam
                              ? isLight
                                ? 'bg-gray-900 text-white'
                                : 'bg-white/20 text-white'
                              : isLight
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          style={{ fontFamily: fam }}
                        >
                          {fam}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* PDF Specific Settings */}
              {format === 'pdf' && (
                <>
                  {/* PDF Appearance Mode */}
                  <div className="mb-6">
                    <label className="block text-xs font-medium mb-2.5 opacity-80">PDF Appearance</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPdfAppearanceMode('original')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                          pdfAppearanceMode === 'original'
                            ? isLight
                              ? 'bg-gray-900 text-white'
                              : 'bg-white/25 text-white'
                            : isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setPdfAppearanceMode('dark')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                          pdfAppearanceMode === 'dark'
                            ? isLight
                              ? 'bg-gray-900 text-white'
                              : 'bg-white/25 text-white'
                            : isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  {/* Embedded Image Treatment (active when dark mode enabled) */}
                  {pdfAppearanceMode === 'dark' && (
                    <div className="mb-6 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <label className="block text-xs font-medium mb-1.5 opacity-80">
                        Embedded Image Treatment
                      </label>
                      <p className="text-[11px] opacity-60 mb-3">
                        Preserve photos & diagrams in original colors while text remains darkened.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPdfImageTreatment('preserve')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                            pdfImageTreatment === 'preserve'
                              ? isLight
                                ? 'bg-gray-900 text-white'
                                : 'bg-white/20 text-white'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          Preserve Original
                        </button>
                        <button
                          onClick={() => setPdfImageTreatment('transform')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-transform active:scale-[0.97] transition-colors ${
                            pdfImageTreatment === 'transform'
                              ? isLight
                                ? 'bg-gray-900 text-white'
                                : 'bg-white/20 text-white'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          Transform
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Auto Scroll Default Speed */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium opacity-80">Default Auto-Scroll Speed</label>
                  <span className="text-xs font-mono tabular-nums opacity-60">
                    <DynamicNumber value={autoScrollSpeed} suffix=" px/s" />
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="150"
                  step="5"
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-zinc-700"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                {onReturnToLibrary && (
                  <button
                    onClick={() => {
                      onReturnToLibrary()
                      onClose()
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-medium text-center border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Close Document & Return to Library
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
