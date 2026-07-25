import { useState, useEffect, useRef } from 'react'
import { C, FONT, MATRIX_CHARS, HEX_CHARS, BINARY_CHARS } from '../constants'
import type { Screen } from '../types'



function CyberRadar({ isDashboard, reveal }: { isDashboard?: boolean; reveal?: number }) {
  const ro = reveal ?? 1
  return (
    <div style={{
      position: 'absolute', left: '50%', top: isDashboard ? '50%' : '45%',
      transform: `translate(-50%, -50%) scale(${0.3 + 0.7 * ro})`,
      width: isDashboard ? 700 : 500, height: isDashboard ? 700 : 500,
      pointerEvents: 'none', zIndex: 0,
      animation: 'cyber-pulse-radar 12s ease-in-out infinite',
      opacity: isDashboard ? 0.18 : 0.06 * ro,
      transition: 'opacity 700ms ease-out, transform 700ms ease-out',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, animation: 'rotate-hex 45s linear infinite' }}>
        <circle cx="100" cy="100" r="95" stroke={C.green} strokeWidth="0.5" strokeDasharray="3 8" fill="none" />
        <circle cx="100" cy="100" r="85" stroke={C.green} strokeWidth="0.3" strokeDasharray="15 5" fill="none" />
      </svg>
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, animation: 'rotate-hex 25s linear infinite reverse' }}>
        <circle cx="100" cy="100" r="75" stroke={C.cyan} strokeWidth="0.5" strokeDasharray="8 4 2 4" fill="none" />
        <path d="M 100 15 L 100 25 M 100 175 L 100 185 M 15 100 L 25 100 M 175 100 L 185 100" stroke={C.cyan} strokeWidth="0.8" fill="none" />
      </svg>
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="100" cy="100" r="45" stroke={C.green} strokeWidth="0.2" fill="none" />
        <circle cx="100" cy="100" r="2" fill={C.green} />
        <line x1="50" y1="100" x2="150" y2="100" stroke={C.green} strokeWidth="0.1" strokeDasharray="2 2" />
        <line x1="100" y1="50" x2="100" y2="150" stroke={C.green} strokeWidth="0.1" strokeDasharray="2 2" />
      </svg>
    </div>
  )
}

export default function Background({ isDashboard, screen }: { isDashboard: boolean; screen?: Screen }) {
  const [reveal, setReveal] = useState(screen !== 'landing' ? 1 : 0.0001)
  const rafRef = useRef(0)

  useEffect(() => {
    if (screen !== 'landing') {
      setReveal(1)
      return
    }
    const start = performance.now()
    const duration = 3000
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setReveal(p)
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [screen])

  const [matrixCols] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      ),
    }))
  )

  const [floating] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 10,
      text: i % 2 === 0
        ? `${HEX_CHARS[Math.floor(Math.random()*16)]}${HEX_CHARS[Math.floor(Math.random()*16)]}${HEX_CHARS[Math.floor(Math.random()*16)]}`
        : BINARY_CHARS.slice(0, 4 + Math.floor(Math.random() * 4)),
      fontSize: 9 + Math.floor(Math.random() * 4),
    }))
  )

  const [hackerNodes] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 15,
    }))
  )

  const dotGridOpacity = isDashboard ? 0.38 : 0.42 * reveal

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: C.bgPrimary }} />
      <div
        className={isDashboard ? "dot-grid-bg" : "dot-grid-bg-clean"}
        style={{
          position: 'absolute',
          top: -96, left: 0, right: 0, bottom: 0,
          height: 'calc(100% + 96px)',
          opacity: dotGridOpacity,
          transition: screen === 'landing' ? 'opacity 2000ms ease-out' : 'none',
        }}
      />

      {isDashboard ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(700px circle at top left, rgba(0,255,136,0.1), transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(500px circle at top right, rgba(0,212,255,0.08), transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(800px circle at bottom center, rgba(0,255,136,0.04), transparent)` }} />
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px circle at 50% 40%, rgba(0,255,136,${0.09 * reveal}), transparent)`, transition: 'opacity 1500ms ease-out' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(600px circle at 50% 50%, rgba(0,212,255,${0.07 * reveal}), transparent)`, transition: 'opacity 1500ms ease-out' }} />
        </>
      )}

      <CyberRadar isDashboard={isDashboard} reveal={reveal} />

      {hackerNodes.map(node => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: `${node.left}%`,
            width: node.size,
            height: node.size,
            borderRadius: '50%',
            background: node.id % 2 === 0 ? C.green : C.cyan,
            boxShadow: `0 0 10px ${node.id % 2 === 0 ? C.green : C.cyan}`,
            opacity: (isDashboard ? 0.32 : 0.2) * (0.2 + 0.8 * reveal),
            animation: `float-hex ${node.duration}s linear ${node.delay}s infinite`,
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'transform',
          }}
        />
      ))}



      <div style={{
        position: 'absolute', left: 0, top: 0, right: 0,
        background: isDashboard
          ? 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.05) 50%, transparent 100%)'
          : 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.03) 50%, transparent 100%)',
        height: 4,
        animation: 'scan-line 7s linear infinite',
        zIndex: 2,
        opacity: 0.3 + 0.7 * reveal,
        transition: 'opacity 1000ms ease-out',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: isDashboard
          ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)'
          : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        pointerEvents: 'none',
      }} />

      {matrixCols.map(col => (
        <div
          key={col.id}
          style={{
            position: 'absolute', left: `${col.left}%`, top: 0,
            animation: `matrix-fall ${col.duration}s linear ${col.delay}s infinite`,
            fontFamily: FONT.mono, fontSize: isDashboard ? 9 : 8, lineHeight: '14px',
            textAlign: 'center',
            writingMode: 'vertical-lr',
            color: isDashboard ? 'rgba(0,255,136,0.12)' : 'rgba(0,255,136,0.04)',
            opacity: 0.15 + 0.85 * reveal,
            textShadow: isDashboard ? '0 0 4px rgba(0,255,136,0.08)' : 'none',
            transition: 'opacity 1500ms ease-out',
            willChange: 'transform',
          }}
        >
          {col.chars.join('')}
        </div>
      ))}

      {floating.map(f => (
        <div
          key={f.id}
          style={{
            position: 'absolute', left: `${f.left}%`,
            animation: `float-hex ${f.duration}s linear ${f.delay}s infinite`,
            fontFamily: FONT.mono, fontSize: f.fontSize,
            color: isDashboard
              ? (f.id % 3 === 0 ? 'rgba(0,255,136,0.08)' : 'rgba(0,212,255,0.08)')
              : (f.id % 3 === 0 ? 'rgba(0,255,136,0.03)' : 'rgba(0,212,255,0.03)'),
            opacity: 0.1 + 0.9 * reveal,
            whiteSpace: 'nowrap',
            transition: 'opacity 1500ms ease-out',
            willChange: 'transform',
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Left HUD Panel */}
      <div className="hud-left" style={{
        position: 'fixed', left: 40, top: 140, bottom: 140, width: 140,
        flexDirection: 'column', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 1, opacity: 0.5 * reveal,
        transition: 'opacity 1000ms ease-out',
        borderRight: `1px dashed rgba(0, 255, 136, 0.12)`,
        paddingRight: 16,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.green, letterSpacing: '0.08em' }}>//_GRID_STATUS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.textPrimary, fontWeight: 700 }}>SEC_ACTIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>//_RECON_STATE</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.textPrimary }}>PORT_OK : 8443</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>SYS_ONLINE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>//_ORCHESTRATOR</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.cyan }}>AI_READY</span>
        </div>
      </div>

      {/* Right HUD Panel */}
      <div className="hud-right" style={{
        position: 'fixed', right: 40, top: 140, bottom: 140, width: 140,
        flexDirection: 'column', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 1, opacity: 0.5 * reveal,
        transition: 'opacity 1000ms ease-out',
        borderLeft: `1px dashed rgba(0, 212, 255, 0.12)`,
        paddingLeft: 16,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.cyan, letterSpacing: '0.08em' }}>//_INTEGRITY</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 8px)', gap: 4, marginTop: 4 }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '1px',
                  background: i % 5 === 0 ? C.red : i % 3 === 0 ? C.cyan : C.green,
                  opacity: i % 2 === 0 ? 0.35 : 0.85,
                  animation: i % 3 === 0 ? 'pulse-dot 1.5s infinite alternate' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>//_TELEMETRY</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.textPrimary }}>LAT_0.02ms</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>SYS_60FPS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>//_SYS_REGION</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>HUD: LOCAL_POOL</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>LOC: 0X_SEC</span>
        </div>
      </div>
    </div>
  )
}
