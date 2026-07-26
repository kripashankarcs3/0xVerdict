import { useState, useEffect, useRef } from 'react'
import { C, FONT, TERMINAL_LINES } from '../constants'
import { getScanStatus } from '../utils/api'

export default function Scanning({ target, scanId, onComplete }: { target: string; scanId: string; onComplete: () => void }) {
  const [lines, setLines] = useState<typeof TERMINAL_LINES>([])
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, total: 0 })
  const [pipelineStep, setPipelineStep] = useState(0)
  const [failed, setFailed] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let idx = 0
    let active = true
    const addLine = () => {
      if (!active) return
      if (idx < TERMINAL_LINES.length) {
        setLines(prev => [...prev, TERMINAL_LINES[idx]])
        idx++
        setTimeout(addLine, idx < 13 ? 180 : idx < 22 ? 220 : 260)
      } else {
        setTimeout(onComplete, 1200)
      }
    }
    const t = setTimeout(addLine, 300)

    const elapsedIv = setInterval(() => setElapsed(p => p + 1), 1000)
    const progressIv = setInterval(() => {
      setProgress(p => {
        if (p >= 92) { clearInterval(progressIv); return p }
        return p + Math.random() * 3
      })
    }, 400)

    setTimeout(() => setPipelineStep(1), 2500)
    setTimeout(() => setPipelineStep(2), 5000)

    setTimeout(() => setCounts(p => ({ ...p, medium: 1, total: 1 })), 3500)
    setTimeout(() => setCounts(p => ({ ...p, high: 1, total: 2 })), 4500)
    setTimeout(() => setCounts(p => ({ ...p, critical: 1, high: 2, medium: 3, total: 5 })), 6000)

    return () => {
      active = false
      clearTimeout(t)
      clearInterval(elapsedIv)
      clearInterval(progressIv)
    }
  }, [onComplete])

  useEffect(() => {
    if (!scanId) return
    let prevMessage = ''
    const iv = setInterval(async () => {
      try {
        const status = await getScanStatus(scanId)
        if (status.scan_status === 'Reconnoitering') setPipelineStep(0)
        else if (status.scan_status === 'Scanning') setPipelineStep(1)
        else if (status.scan_status === 'AI Analyzing') setPipelineStep(2)
        if (status.pipeline_message && status.pipeline_message !== prevMessage) {
          prevMessage = status.pipeline_message
          setLines(prev => [...prev, { text: status.pipeline_message, color: '#00D4FF', bold: false }])
        }
        if (status.scan_status === 'Completed') {
          clearInterval(iv)
          onComplete()
        } else if (status.scan_status === 'Failed') {
          clearInterval(iv)
          setFailed(true)
          setLines(prev => [...prev, { text: '> [ERROR] Scan failed', color: '#FF3366', bold: false }])
        }
      } catch (err) {
        console.error('Polling scan status failed:', err)
      }
    }, 2000)
    return () => clearInterval(iv)
  }, [scanId, onComplete])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines, failed])

  const pad = (n: number) => String(n).padStart(2, '0')
  const mm = pad(Math.floor(elapsed / 60))
  const ss = pad(elapsed % 60)

  const metricCards = [
    { label: 'CRITICAL', value: counts.critical, color: C.red },
    { label: 'HIGH', value: counts.high, color: C.orange },
    { label: 'MEDIUM', value: counts.medium, color: C.purple },
    { label: 'TOTAL FINDINGS', value: counts.total, color: C.green, textColor: C.textPrimary },
  ]

  const pipelineSteps = [
    { label: 'RECON', state: pipelineStep > 0 ? 'complete' : 'waiting' },
    { label: 'SCANNING', state: pipelineStep >= 1 && pipelineStep < 2 ? 'active' : pipelineStep >= 2 ? 'complete' : 'waiting' },
    { label: 'AI ANALYSIS', state: pipelineStep >= 2 ? 'active' : 'waiting' },
  ]

  const recentLines = lines.slice(-3)

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{
        background: C.bgSecondary, borderBottom: `1px solid ${C.border}`,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.textPrimary }}>
            SCANNING: <span style={{ color: C.cyan }}>{target}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.mono, fontSize: 13, color: C.green }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {mm}:{ss}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '62% 38%', gap: 16,
        padding: '24px 32px', height: 'calc(100vh - 64px - 52px)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RECON & DETECTION LOG
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${C.green}`, borderRadius: 20, padding: '3px 10px',
            }}>
              <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.green }}>LIVE</span>
            </div>
          </div>

          <div
            ref={terminalRef}
            className="cyber-scroll"
            role="log"
            aria-label="Scan terminal output"
            style={{
              flex: 1, background: C.bgInput, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 20, overflowY: 'auto',
              fontFamily: FONT.mono, fontSize: 12, lineHeight: '22px',
            }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                className="terminal-line"
                style={{
                  color: line.color || 'transparent',
                  fontWeight: line.bold ? 700 : 400,
                  animationDelay: '0ms',
                  minHeight: 22,
                }}
              >
                {line.text || '\u00a0'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {metricCards.map(card => (
              <div
                key={card.label}
                style={{
                  background: C.bgSecondary, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${card.color}`,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 10, color: card.color, letterSpacing: '0.08em', marginBottom: 4 }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 36, color: card.textColor || card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontFamily: FONT.inter, fontSize: 11, color: C.muted, marginTop: 4 }}>vulnerabilities</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>SCAN PROGRESS</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.green }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div
                className="shimmer-bar"
                style={{
                  height: '100%', width: `${progress}%`, background: C.green,
                  borderRadius: 4, transition: 'width 400ms ease-out',
                  position: 'relative', overflow: 'hidden',
                }}
              />
            </div>
          </div>

          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
              PIPELINE STATUS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {pipelineSteps.map((step, i) => (
                <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.state === 'complete' ? 'rgba(0,255,136,0.1)' : step.state === 'active' ? 'rgba(255,184,0,0.1)' : C.bgTertiary,
                      border: `1px solid ${step.state === 'complete' ? C.green : step.state === 'active' ? C.orange : C.border}`,
                    }}>
                      {step.state === 'complete' && <span style={{ color: C.green, fontSize: 12 }}>&#x2713;</span>}
                      {step.state === 'active' && <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
                      {step.state === 'waiting' && <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${C.border}` }} />}
                    </div>
                    <span style={{ fontFamily: FONT.inter, fontSize: 10, color: step.state === 'waiting' ? C.muted : C.textPrimary, whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div style={{ flex: 1, height: 1, borderTop: `1px dashed ${C.border}`, marginBottom: 22 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', height: 84, overflow: 'hidden' }}>
            <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>CURRENT ACTION</div>
            {recentLines.filter(l => l.text).slice(-3).map((line, i) => (
              <div key={i} style={{ fontFamily: FONT.mono, fontSize: 11, color: i === recentLines.filter(l => l.text).slice(-3).length - 1 ? line.color : C.muted, lineHeight: '18px' }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
