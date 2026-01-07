import { useEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProps {
  children: ReactNode
  className?: string
  options?: {
    duration?: number
    easing?: (t: number) => number
    orientation?: 'vertical' | 'horizontal'
    gestureOrientation?: 'vertical' | 'horizontal'
    smoothWheel?: boolean
    wheelMultiplier?: number
    touchMultiplier?: number
    infinite?: boolean
  }
}

export function SmoothScroll({ children, className, options }: SmoothScrollProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: options?.duration ?? 1.2,
      easing: options?.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      orientation: options?.orientation ?? 'vertical',
      gestureOrientation: options?.gestureOrientation ?? 'vertical',
      smoothWheel: options?.smoothWheel ?? true,
      wheelMultiplier: options?.wheelMultiplier ?? 1,
      touchMultiplier: options?.touchMultiplier ?? 2,
      infinite: options?.infinite ?? false,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [options])

  return (
    <div ref={wrapperRef} className={className} style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <div ref={contentRef} style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

