import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DynamicNumber } from '../UI/DynamicNumber'
import { useTheme } from '../../context/ThemeContext'

interface AutoScrollHudProps {
  isPlaying: boolean
  speed: number
  onToggle: () => void
  onSpeedChange: (speed: number) => void
}

const SPEED_PRESETS = [
  { label: 'Slow', speed: 25 },
  { label: 'Normal', speed: 50 },
  { label: 'Brisk', speed: 85 },
  { label: 'Fast', speed: 130 },
]

export function AutoScrollHud({
  isPlaying,
  speed,
  onToggle,
  onSpeedChange,
}: AutoScrollHudProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hudRef = useRef<HTMLDivElement>(null)
  const { currentTheme } = useTheme()
  const isLight = currentTheme === 'light'

  // Collapse popover when clicking anywhere outside of it or pressing Escape
  useEffect(() => {
    if (!isExpanded) return

    const handlePointerDown = (e: MouseEvent | PointerEvent | TouchEvent) => {
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  return (
    <div ref={hudRef} className="fixed bottom-14 right-6 z-40 select-none">
      <div className="flex flex-col items-end gap-2">
        {/* Expanded Speed Configuration Popover */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className={`p-4 rounded-xl border backdrop-blur-xl mb-2 w-64 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] ${
                isLight
                  ? 'bg-white/95 border-gray-200/80 text-gray-900'
                  : 'bg-zinc-900/90 border-white/10 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium tracking-wide opacity-70">Auto-Scroll Speed</span>
                <span className="text-xs font-mono tabular-nums font-semibold">
                  <DynamicNumber value={speed} suffix=" px/s" />
                </span>
              </div>

              {/* Slider */}
              <div className="mb-4">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={speed}
                  onChange={(e) => onSpeedChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-zinc-700 accent-gray-900 dark:accent-white"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {SPEED_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onSpeedChange(preset.speed)}
                    className={`py-1 rounded text-[11px] font-medium transition-transform active:scale-[0.97] transition-colors ${
                      speed === preset.speed
                        ? isLight
                          ? 'bg-gray-900 text-white'
                          : 'bg-white/20 text-white'
                        : isLight
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Floating HUD Pill */}
        <div
          className={`flex items-center gap-1.5 p-1.5 rounded-full border backdrop-blur-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] ${
            isLight
              ? 'bg-white/90 border-gray-200/80 text-gray-900'
              : 'bg-zinc-950/85 border-white/10 text-white'
          }`}
        >
          {/* Main Play / Pause Button */}
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-transform active:scale-[0.96] transition-colors ${
              isPlaying
                ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                : isLight
                  ? 'hover:bg-gray-100 text-gray-800'
                  : 'hover:bg-white/10 text-gray-200'
            }`}
            aria-label={isPlaying ? 'Pause automatic scrolling' : 'Start automatic scrolling'}
          >
            {/* Play/Pause Pulse indicator */}
            <span className="relative flex h-2 w-2">
              {isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isPlaying ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-zinc-500'
                }`}
              />
            </span>

            <span>{isPlaying ? 'Scrolling' : 'Auto-Scroll'}</span>
          </button>

          {/* Speed Indicator / Settings Pill Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-mono tabular-nums opacity-70 hover:opacity-100 transition-colors ${
              isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            }`}
            title="Adjust speed"
          >
            <DynamicNumber value={speed} suffix=" px/s" />
          </button>
        </div>
      </div>
    </div>
  )
}
