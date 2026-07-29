import { useState, useEffect } from 'react'
import { C, FONT } from '../constants'
import type { NavStatus, AIStatus, Screen } from '../types'
import finalLogo from '@/assets/final_logo.png'

export default function Navbar({
  status,
  aiStatus,
  activeScreen,
  onNavigate,
  onLogoClick
}: {
  status: NavStatus
  aiStatus: AIStatus
  activeScreen: Screen
  onNavigate: (screen: Screen) => void
  onLogoClick?: () => void
}) {
  const [cursorOn, setCursorOn] = useState(true)
  const [signalBars, setSignalBars] = useState([0.3, 0.5, 0.7, 1])

  useEffect(() => {
    const t = setInterval(() => setCursorOn(p => !p), 530)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (aiStatus === 'idle') {
      setSignalBars([0.2, 0.3, 0.4, 0.5])
      return
    }
    const iv = setInterval(() => {
      setSignalBars([1, 2, 3, 4].map(() => 0.3 + Math.random() * 0.7))
    }, 800)
    return () => clearInterval(iv)
  }, [aiStatus])

  const aiConfig = {
    active: { dot: C.green, label: 'AI ACTIVE', labelColor: C.green, pulse: true },
    thinking: { dot: C.cyan, label: 'AI THINKING', labelColor: C.cyan, pulse: true },
    idle: { dot: C.muted, label: 'AI STANDBY', labelColor: C.muted, pulse: false },
  }[aiStatus]

  return (
    <nav className="nav-glow" role="navigation" aria-label="Main navigation" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64, background: 'rgba(10,10,15,0.92)',
      borderBottom: `1px solid ${C.border}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <div 
        onClick={onLogoClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          cursor: onLogoClick ? 'pointer' : 'default',
          userSelect: 'none'
        }}
        role={onLogoClick ? 'button' : undefined}
        tabIndex={onLogoClick ? 0 : undefined}
        onKeyDown={e => { if (onLogoClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onLogoClick(); } }}
      >
        <img
          src={finalLogo}
          alt="0xVerdict logo"
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <span style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 22, color: C.green }}>0x</span>
            <span style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 22, color: C.textPrimary }}>Verdict</span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
            &gt; AI Security Analyst
            <span style={{ color: C.green, opacity: cursorOn ? 1 : 0, transition: 'opacity 50ms' }} aria-hidden="true">&#9608;</span>
          </div>
        </div>
      </div>

      {/* Center Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {[
          { label: 'DASHBOARD', screen: 'landing', color: C.green },
          { label: 'AUDIT HISTORY', screen: 'history', color: C.green },
          { label: 'AI SECURITY CHAT', screen: 'chat', color: C.green },
          { label: 'GLOBAL THREATS', screen: 'threats', color: C.cyan },
          { label: 'API PLAYGROUND', screen: 'apiDocs', color: C.cyan },
        ].map(link => {
          const isScanning = status === 'scanning'
          const isActive = 
            link.screen === activeScreen || 
            (link.screen === 'landing' && (activeScreen === 'scanning' || activeScreen === 'results'))
          
          return (
            <button
              key={link.screen}
              onClick={() => {
                if (!isScanning) onNavigate(link.screen as Screen)
              }}
              disabled={isScanning}
              style={{
                background: 'transparent',
                border: 'none',
                color: isScanning 
                  ? 'rgba(255,255,255,0.2)' 
                  : isActive 
                    ? link.color 
                    : C.textPrimary,
                fontFamily: FONT.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                padding: '6px 10px',
                borderRadius: 4,
                opacity: isScanning ? 0.35 : isActive ? 1 : 0.6,
                transition: 'all 200ms',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (!isScanning && !isActive) {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.color = link.color
                }
              }}
              onMouseLeave={e => {
                if (!isScanning && !isActive) {
                  e.currentTarget.style.opacity = '0.6'
                  e.currentTarget.style.color = C.textPrimary
                }
              }}
            >
              {isActive && (
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: link.color,
                  boxShadow: `0 0 6px ${link.color}`
                }} />
              )}
              {link.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          fontFamily: FONT.mono, fontSize: 11, color: C.muted,
          border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 20,
        }}>v1.0.0</span>

        <a href="https://github.com/kripashankarcs3/0xVerdict" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }} role="status" aria-label={`AI status: ${aiConfig.label}`}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }} aria-hidden="true">
            {signalBars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${4 + h * 10}px`,
                  borderRadius: '1px 1px 0 0',
                  background: aiConfig.dot,
                  transition: 'height 400ms ease, background 300ms',
                  opacity: aiStatus === 'idle' ? 0.4 : 0.8 + h * 0.2,
                  boxShadow: aiStatus !== 'idle' ? `0 0 4px ${aiConfig.dot}40` : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              className={aiConfig.pulse ? 'pulse-dot' : ''}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: aiConfig.dot,
                boxShadow: aiStatus !== 'idle' ? `0 0 6px ${aiConfig.dot}60` : 'none',
              }}
            />
            <span style={{
              fontFamily: FONT.mono, fontSize: 10,
              color: aiConfig.labelColor,
              letterSpacing: '0.04em',
            }}>
              {aiConfig.label}
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: C.border }} aria-hidden="true" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.mono, fontSize: 12 }}>
          {status === 'idle' && (
            <><div style={{ width: 7, height: 7, borderRadius: '50%', background: C.muted }} /><span style={{ color: C.muted }}>IDLE</span></>
          )}
          {status === 'scanning' && (
            <><div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} /><span style={{ color: C.green }}>SCANNING</span></>
          )}
          {status === 'complete' && (
            <><div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} /><span style={{ color: C.green }}>SCAN COMPLETE</span></>
          )}
        </div>
      </div>
    </nav>
  )
}
