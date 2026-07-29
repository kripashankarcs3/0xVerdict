import { useState, useEffect, useRef } from 'react'

export function useReveal(duration = 3000, startDelay = 100): number {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const start = performance.now()
      const animate = (now: number) => {
        const elapsed = now - start
        const p = Math.min(elapsed / duration, 1)
        setProgress(p)
        if (p < 1) rafRef.current = requestAnimationFrame(animate)
      }
      rafRef.current = requestAnimationFrame(animate)
    }, startDelay)

    return () => {
      clearTimeout(startTimeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [duration, startDelay])

  return progress
}
