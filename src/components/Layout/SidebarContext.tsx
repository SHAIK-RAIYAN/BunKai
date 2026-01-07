import { createContext, useContext, useState, useRef, type ReactNode } from 'react'

export interface TocItem {
  id?: string
  href: string
  label: string
  subitems?: TocItem[]
}

interface SidebarContextType {
  isOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  toc: TocItem[]
  setToc: (toc: TocItem[]) => void
  registerNavigation: (fn: (href: string) => void) => void
  navigate: (href: string) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [toc, setToc] = useState<TocItem[]>([])
  const navigationFnRef = useRef<((href: string) => void) | null>(null)

  const toggleSidebar = () => setIsOpen((prev) => !prev)
  const closeSidebar = () => setIsOpen(false)

  const registerNavigation = (fn: (href: string) => void) => {
    navigationFnRef.current = fn
  }

  const navigate = (href: string) => {
    if (navigationFnRef.current) {
      navigationFnRef.current(href)
      closeSidebar() // Auto-close on nav
    } else {
      console.warn('Navigation function not registered')
    }
  }

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggleSidebar,
        closeSidebar,
        toc,
        setToc,
        registerNavigation,
        navigate,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
