import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi'
import { useTheme } from './ThemeContext'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  actionLabel?: string
  onAction?: () => void
}

interface ToastContextType {
  addToast: (
    message: string,
    type?: ToastType,
    options?: {
      actionLabel?: string
      onAction?: () => void
    },
  ) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { currentTheme } = useTheme()

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: { actionLabel?: string; onAction?: () => void },
    ) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, message, type, ...options }])
      setTimeout(() => removeToast(id), 5000)
    },
    [removeToast],
  )

  const isLight = currentTheme === 'light'

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.2 } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              layout
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-xl shadow-lg ${
                isLight
                  ? 'bg-white/95 border-gray-200 text-gray-900 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]'
                  : 'bg-zinc-900/95 border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <HiCheckCircle className="w-4 h-4 text-emerald-500" />}
                {toast.type === 'error' && <HiExclamationCircle className="w-4 h-4 text-rose-500" />}
                {toast.type === 'info' && <HiInformationCircle className="w-4 h-4 text-sky-500" />}
                <p className="text-xs font-medium">{toast.message}</p>
              </div>

              <div className="flex items-center gap-2">
                {toast.onAction && toast.actionLabel && (
                  <button
                    onClick={() => {
                      toast.onAction?.()
                      removeToast(toast.id)
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-transform active:scale-[0.96] transition-colors ${
                      isLight
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {toast.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded opacity-50 hover:opacity-100 transition-colors"
                >
                  <HiX className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
