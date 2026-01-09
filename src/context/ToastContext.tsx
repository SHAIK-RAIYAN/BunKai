import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi'
import { useTheme } from './ThemeContext'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void
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

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.4 } }}
              layout
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-xl border backdrop-blur-md ${
                currentTheme === 'light'
                  ? 'bg-white/90 border-gray-200 text-gray-800'
                  : 'bg-zinc-900/95 border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <HiCheckCircle className="w-5 h-5 text-green-500" />}
                {toast.type === 'error' && <HiExclamationCircle className="w-5 h-5 text-red-500" />}
                {toast.type === 'info' && <HiInformationCircle className="w-5 h-5 text-blue-500" />}
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`p-1 rounded transition-colors ${
                  currentTheme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                }`}
              >
                <HiX className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

