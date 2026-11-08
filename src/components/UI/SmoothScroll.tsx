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
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return

    let rafId: number | null = null
    const currentOptions = optionsRef.current

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: currentOptions?.duration ?? 1.2,
      easing: currentOptions?.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      orientation: currentOptions?.orientation ?? 'vertical',
      gestureOrientation: currentOptions?.gestureOrientation ?? 'vertical',
      smoothWheel: currentOptions?.smoothWheel ?? true,
      wheelMultiplier: currentOptions?.wheelMultiplier ?? 1,
      touchMultiplier: currentOptions?.touchMultiplier ?? 2,
      infinite: currentOptions?.infinite ?? false,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return (
    <div ref={wrapperRef} className={className} style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <div ref={contentRef} style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
