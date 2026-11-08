import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoScrollOptions {
  containerRef: React.RefObject<HTMLElement | null>
  speedPxPerSec: number
  onPause?: () => void
  onReachBottom?: () => void
}

export function useAutoScroll({
  containerRef,
  speedPxPerSec,
  onPause,
  onReachBottom,
}: UseAutoScrollOptions) {
  const [isPlaying, setIsPlaying] = useState(false)

  const isPlayingRef = useRef(false)
  const speedRef = useRef(speedPxPerSec)
  const lastTimeRef = useRef<number | null>(null)
  const currentVelocityRef = useRef(0) // For smooth acceleration
  const rafIdRef = useRef<number | null>(null)
  const subPixelAccumulatorRef = useRef(0)

  useEffect(() => {
    speedRef.current = speedPxPerSec
  }, [speedPxPerSec])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const stopAutoScroll = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastTimeRef.current = null
    currentVelocityRef.current = 0
    subPixelAccumulatorRef.current = 0
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])

  const startAutoScroll = useCallback(() => {
    if (!containerRef.current) return

    // Stop any existing loop
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    lastTimeRef.current = null
    currentVelocityRef.current = 0
    subPixelAccumulatorRef.current = 0
    isPlayingRef.current = true
    setIsPlaying(true)

    const step = (time: number) => {
      if (!isPlayingRef.current) return

      const container = containerRef.current
      if (!container) {
        stopAutoScroll()
        return
      }

      // Check tab visibility: if page is hidden, pause delta to prevent leap
      if (document.hidden) {
        lastTimeRef.current = null
        rafIdRef.current = requestAnimationFrame(step)
        return
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = time
        rafIdRef.current = requestAnimationFrame(step)
        return
      }

      // Clamp deltaTime to max 100ms to avoid huge jumps on sudden frame drop
      const deltaMs = Math.min(time - lastTimeRef.current, 100)
      lastTimeRef.current = time

      // Short controlled linear acceleration over ~200ms
      const targetSpeed = speedRef.current
      const accelStep = (targetSpeed / 200) * deltaMs
      if (currentVelocityRef.current < targetSpeed) {
        currentVelocityRef.current = Math.min(targetSpeed, currentVelocityRef.current + accelStep)
      } else {
        currentVelocityRef.current = targetSpeed
      }

      // Distance moved in this frame
      const distance = (currentVelocityRef.current * deltaMs) / 1000
      subPixelAccumulatorRef.current += distance

      // Apply integer/float scroll
      if (subPixelAccumulatorRef.current >= 0.5) {
        const toScroll = subPixelAccumulatorRef.current
        container.scrollTop += toScroll
        subPixelAccumulatorRef.current = 0
      }

      // Check if reached bottom of document
      const maxScroll = container.scrollHeight - container.clientHeight
      if (container.scrollTop >= maxScroll - 2) {
        stopAutoScroll()
        if (onReachBottom) onReachBottom()
        return
      }

      rafIdRef.current = requestAnimationFrame(step)
    }

    rafIdRef.current = requestAnimationFrame(step)
  }, [containerRef, stopAutoScroll, onReachBottom])

  const toggleAutoScroll = useCallback(() => {
    if (isPlayingRef.current) {
      stopAutoScroll()
      if (onPause) onPause()
    } else {
      startAutoScroll()
    }
  }, [startAutoScroll, stopAutoScroll, onPause])

  // Listen for manual user interactions to immediately pause
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleUserInteraction = () => {
      if (isPlayingRef.current) {
        stopAutoScroll()
        if (onPause) onPause()
      }
    }

    // Scroll wheel, touch gesture, or pointer down
    container.addEventListener('wheel', handleUserInteraction, { passive: true })
    container.addEventListener('touchstart', handleUserInteraction, { passive: true })
    container.addEventListener('pointerdown', handleUserInteraction, { passive: true })

    // Text selection starts
    const handleSelection = () => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed && isPlayingRef.current) {
        handleUserInteraction()
      }
    }
    document.addEventListener('selectionchange', handleSelection)

    return () => {
      container.removeEventListener('wheel', handleUserInteraction)
      container.removeEventListener('touchstart', handleUserInteraction)
      container.removeEventListener('pointerdown', handleUserInteraction)
      document.removeEventListener('selectionchange', handleSelection)
    }
  }, [containerRef, stopAutoScroll, onPause])

  // Clean unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    isPlaying,
    startAutoScroll,
    stopAutoScroll,
    toggleAutoScroll,
  }
}

