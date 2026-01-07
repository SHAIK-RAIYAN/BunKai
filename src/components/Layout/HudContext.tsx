import { createContext, useContext, type ReactNode } from 'react'

interface HudContextType {
  keepHudOpen: (keep: boolean) => void
}

const HudContext = createContext<HudContextType | null>(null)

export function useHud() {
  const context = useContext(HudContext)
  if (!context) {
    throw new Error('useHud must be used within HudProvider')
  }
  return context
}

interface HudProviderProps {
  children: ReactNode
  onKeepHudOpen: (keep: boolean) => void
}

export function HudProvider({ children, onKeepHudOpen }: HudProviderProps) {
  const keepHudOpen = (keep: boolean) => {
    onKeepHudOpen(keep)
  }

  return <HudContext.Provider value={{ keepHudOpen }}>{children}</HudContext.Provider>
}

