import { useEffect, useRef } from 'react'

interface ConfettiProps {
  onComplete?: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vRot: number
  opacity: number
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']

export function Confetti({ onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onComplete) onComplete()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.parentElement?.clientWidth || 300)
    const height = (canvas.height = canvas.parentElement?.clientHeight || 200)

    const particles: Particle[] = []
    const count = 40

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 60,
        y: height * 0.45 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 6 - 2,
        size: Math.random() * 5 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
      })
    }

    let animId: number
    const startTime = Date.now()

    const render = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.22 // gravity
        p.vx *= 0.98 // air drag
        p.rotation += p.vRot

        if (elapsed > 1600) {
          p.opacity = Math.max(0, 1 - (elapsed - 1600) / 900)
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
        ctx.restore()
      }

      if (elapsed < 2500) {
        animId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, width, height)
        if (onComplete) onComplete()
      }
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30 w-full h-full rounded-2xl"
      aria-hidden="true"
    />
  )
}

