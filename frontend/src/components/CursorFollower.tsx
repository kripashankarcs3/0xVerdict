import { useEffect, useRef, useState } from 'react'
import { C } from '../constants'

export default function CursorFollower() {
  const posRef = useRef({ x: -100, y: -100 })
  const targetRef = useRef({ x: -100, y: -100 })
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [hovered, setHovered] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)
      if (t.closest('button, a, input, [data-hover]')) setHovered(true)
    }
    const handleOut = () => setHovered(false)

    const animate = () => {
      const prev = posRef.current
      const tgt = targetRef.current
      posRef.current = {
        x: prev.x + (tgt.x - prev.x) * 0.8,
        y: prev.y + (tgt.y - prev.y) * 0.8,
      }
      setPos(posRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut)
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div className="cursor-follower" role="presentation" aria-hidden="true" style={{
        position: 'fixed', left: pos.x - 12, top: pos.y - 12,
        width: 24, height: 24, borderRadius: '50%',
        border: `1.5px solid ${hovered ? C.green : 'rgba(0,255,136,0.5)'}`,
        transform: hovered ? 'scale(1.6)' : 'scale(1)',
        transition: 'border-color 80ms, transform 80ms',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
        boxShadow: hovered
          ? '0 0 12px rgba(0,255,136,0.3), inset 0 0 12px rgba(0,255,136,0.05)'
          : '0 0 6px rgba(0,255,136,0.15)',
      }} />
      <div aria-hidden="true" style={{
        position: 'fixed', left: pos.x - 2, top: pos.y - 2,
        width: 4, height: 4, borderRadius: '50%',
        background: C.green,
        transform: hovered ? 'scale(1.8)' : 'scale(1)',
        transition: 'transform 80ms',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
        boxShadow: `0 0 6px ${C.green}`,
      }} />
    </>
  )
}
