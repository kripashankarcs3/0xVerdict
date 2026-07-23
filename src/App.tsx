import React, { useState, useEffect, useRef, useCallback } from 'react'
import finalLogo from '@/imports/final_logo.png'
import type { BackendFinding } from './types'
import type { ScanResult } from './types/api'
import { startScan, getScanStatus, getScanResult } from './utils/api'
import { getMarkdownReportUrl, getPdfReportUrl } from './utils/api'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bgPrimary: '#08090D',
  bgSecondary: '#0E1017',
  bgTertiary: '#12141D',
  bgInput: '#07080C',
  green: '#00FF88',
  greenSecondary: '#38E07A',
  cyan: '#00D4FF',
  red: '#FF3366',
  orange: '#FFB800',
  purple: '#7B61FF',
  muted: '#A7B0BE',
  textPrimary: '#F5F7FA',
  border: '#1A1D2E',
  borderStrong: '#252840',
}

const mono = "'JetBrains Mono', monospace"
const grotesk = "'Space Grotesk', sans-serif"
const inter = "'Inter', sans-serif"

// ─── Terminal line type ────────────────────────────────────────────────────────
interface TerminalLine {
  text: string
  color: string
  bold: boolean
}

// ─── Mapper: BackendFinding → Finding ──────────────────────────────────────────
function mapFinding(b: BackendFinding): Finding {
  const ai = b.ai_analysis
  let verdict: Finding['verdict'] = 'verify'
  if (ai?.verdict === 'Confirmed') verdict = 'confirmed'
  else if (ai?.verdict === 'Likely False Positive') verdict = 'fp'

  let severity: Finding['severity'] = 'medium'
  const sev = (ai?.severity_classified || b.scanner_severity).toLowerCase()
  if (sev.startsWith('crit')) severity = 'critical'
  else if (sev.startsWith('high')) severity = 'high'
  else if (sev.startsWith('medium')) severity = 'medium'
  else severity = 'low'

  let priority: Finding['priority'] = 'normal'
  const pri = (ai?.priority_recommendation || '').toLowerCase()
  if (pri.startsWith('immediate')) priority = 'immediate'
  else if (pri.startsWith('high')) priority = 'high'
  else if (pri.startsWith('normal')) priority = 'normal'
  else priority = 'low'

  let confidence: Finding['confidence'] = 'MEDIUM'
  if (verdict === 'confirmed') confidence = 'HIGH'
  else if (verdict === 'fp') confidence = 'LOW'

  const manualSteps = ai?.manual_verification_guide
    ? ai.manual_verification_guide.split('\n').filter(s => s.trim()).map(s => s.replace(/^\d+[\.\)]\s*/, ''))
    : ['Verify this finding manually in a browser.']

  const priorityNote = ai?.priority_reason
    ? ai.priority_reason
    : `${ai?.verdict || b.scanner_severity} — review recommended.`

  return {
    id: b.id,
    type: b.type,
    endpoint: b.endpoint,
    verdict,
    severity,
    scannerSeverity: b.scanner_severity,
    aiSeverity: ai?.severity_classified || b.scanner_severity,
    priority,
    confidence,
    priorityReason: ai?.priority_reason || '',
    confidenceReason: ai?.confidence_reason || '',
    rootCause: ai?.root_cause || '',
    devExplanation: ai?.developer_explanation || '',
    fixRecommendation: ai?.fix_recommendation || '',
    remediationCode: ai?.remediation_code?.secure_code_example || '',
    manualSteps,
    priorityNote,
  }
}

function mapFindings(backend: BackendFinding[] | null | undefined): Finding[] {
  if (!backend || !Array.isArray(backend)) return []
  return backend.map(mapFinding)
}

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Finding {
  id: string
  type: string
  endpoint: string
  verdict: 'confirmed' | 'verify' | 'fp'
  severity: 'critical' | 'high' | 'medium' | 'low'
  scannerSeverity: string
  aiSeverity: string
  priority: 'immediate' | 'high' | 'normal' | 'low'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  priorityReason: string
  confidenceReason: string
  rootCause: string
  devExplanation: string
  fixRecommendation: string
  remediationCode: string
  manualSteps: string[]
  priorityNote: string
}



// ─── Background ───────────────────────────────────────────────────────────────
const MATRIX_CHARS = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30ca\u30cb\u30cc\u30cd\u30ce\u30cf\u30d2\u30d5\u30d8\u30db\u30de\u30df\u30e0\u30e1\u30e2\u30e4\u30e6\u30e8\u30e9\u30ea\u30eb\u30ec\u30ed\u30ef\u30f2\u30f30123456789ABCDEF<>{}[]()&%$#@!'
const HEX_CHARS = '0123456789ABCDEF'
const BINARY_CHARS = '0101010101010110'

const HACKER_COMMANDS = [
  'SYS_INIT: LAUNCHING PORT RECON...',
  'PORT_SCANNING: 80, 443, 8080, 8443',
  'VULN_CHECK: RUNNING CORE CVE DIAG...',
  'SQLi: TESTING ENDPOINT /LOGIN...',
  'XSS: DOM TEST ON /SEARCH?Q=PAYLOAD',
  'CSP: CONTENT-SECURITY-POLICY ABSENT',
  'HSTS: HOST HARDENING CHECK INCOMPLETE',
  'AI_ANALYSIS: PIPELINE STATE ACTIVE',
  'AI_VERDICT: CONFIRMED SQLi DISCOVERED',
  'REMEDIATION: EXPORTING SAFE WRAPPERS',
  'SYS_STATUS: COMPLETED AI RUN v1.0.0',
]

function HackerStreams({ isDashboard }: { isDashboard?: boolean }) {
  const doubleList = [...HACKER_COMMANDS, ...HACKER_COMMANDS]
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, width: '100%',
      overflow: 'hidden', pointerEvents: 'none',
      maskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.8) 85%, transparent)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.8) 85%, transparent)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        animation: 'cyber-scroll-up 18s linear infinite',
      }}>
        {doubleList.map((cmd, i) => (
          <div key={i} style={{
            fontFamily: mono, fontSize: 9, 
            color: isDashboard ? 'rgba(0, 255, 136, 0.35)' : 'rgba(0, 255, 136, 0.22)',
            whiteSpace: 'nowrap', textShadow: isDashboard ? 'none' : '0 0 2px rgba(0,255,136,0.1)',
          }}>
            &gt; {cmd}
          </div>
        ))}
      </div>
    </div>
  )
}

function CyberRadar({ isDashboard }: { isDashboard?: boolean }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: isDashboard ? '50%' : '45%',
      transform: 'translate(-50%, -50%)',
      width: isDashboard ? 700 : 500, height: isDashboard ? 700 : 500,
      pointerEvents: 'none', zIndex: 0,
      animation: 'cyber-pulse-radar 12s ease-in-out infinite',
      opacity: isDashboard ? 0.18 : 1,
    }}>
      {/* Outer rotating ring */}
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, animation: 'rotate-hex 45s linear infinite' }}>
        <circle cx="100" cy="100" r="95" stroke={C.green} strokeWidth="0.5" strokeDasharray="3 8" fill="none" />
        <circle cx="100" cy="100" r="85" stroke={C.green} strokeWidth="0.3" strokeDasharray="15 5" fill="none" />
      </svg>
      {/* Inner counter-rotating ring */}
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, animation: 'rotate-hex 25s linear infinite reverse' }}>
        <circle cx="100" cy="100" r="75" stroke={C.cyan} strokeWidth="0.5" strokeDasharray="8 4 2 4" fill="none" />
        <path d="M 100 15 L 100 25 M 100 175 L 100 185 M 15 100 L 25 100 M 175 100 L 185 100" stroke={C.cyan} strokeWidth="0.8" fill="none" />
      </svg>
      {/* Solid grid accents */}
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="100" cy="100" r="45" stroke={C.green} strokeWidth="0.2" fill="none" />
        <circle cx="100" cy="100" r="2" fill={C.green} />
        {/* Crosshair */}
        <line x1="50" y1="100" x2="150" y2="100" stroke={C.green} strokeWidth="0.1" strokeDasharray="2 2" />
        <line x1="100" y1="50" x2="100" y2="150" stroke={C.green} strokeWidth="0.1" strokeDasharray="2 2" />
      </svg>
    </div>
  )
}

function Background({ isDashboard }: { isDashboard?: boolean }) {
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: C.bgPrimary }} />
      <div className={isDashboard ? "dot-grid-bg" : "dot-grid-bg-clean"} style={{ position: 'absolute', inset: 0 }} />
      
      {isDashboard ? (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(700px circle at top left, rgba(0,255,136,0.1), transparent)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(500px circle at top right, rgba(0,212,255,0.08), transparent)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(800px circle at bottom center, rgba(0,255,136,0.04), transparent)`,
          }} />
        </>
      ) : (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(900px circle at 50% 40%, rgba(0,255,136,0.09), transparent)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(600px circle at 50% 50%, rgba(0,212,255,0.07), transparent)`,
          }} />
        </>
      )}

      {/* Cyber radar HUD behind center content */}
      <CyberRadar isDashboard={isDashboard} />

      {/* Cyber text scroll overlays at sides */}
      {isDashboard && (
        <>
          <div style={{ position: 'absolute', left: 24, top: 80, bottom: 80, width: 220 }}>
            <HackerStreams isDashboard={isDashboard} />
          </div>
          <div style={{ position: 'absolute', right: 24, top: 80, bottom: 80, width: 220 }}>
            <HackerStreams isDashboard={isDashboard} />
          </div>
        </>
      )}

      {/* CRT scan line overlay */}
      <div style={{
        position: 'absolute', left: 0, top: 0, right: 0,
        background: isDashboard 
          ? 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.05) 50%, transparent 100%)'
          : 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.03) 50%, transparent 100%)',
        height: 4,
        animation: 'scan-line 7s linear infinite',
        zIndex: 2,
      }} />

      {/* Subtle CRT scan lines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDashboard
          ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)'
          : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Matrix rain columns */}
      {matrixCols.map(col => (
        <div
          key={col.id}
          style={{
            position: 'absolute', left: `${col.left}%`, top: 0,
            animation: `matrix-fall ${col.duration}s linear ${col.delay}s infinite`,
            fontFamily: mono, fontSize: isDashboard ? 9 : 8, lineHeight: '14px',
            textAlign: 'center',
            writingMode: 'vertical-lr',
            color: isDashboard ? 'rgba(0,255,136,0.12)' : 'rgba(0,255,136,0.04)',
            textShadow: isDashboard ? '0 0 4px rgba(0,255,136,0.08)' : 'none',
          }}
        >
          {col.chars.join('')}
        </div>
      ))}

      {/* Floating hex/binary */}
      {floating.map(f => (
        <div
          key={f.id}
          style={{
            position: 'absolute', left: `${f.left}%`,
            animation: `float-hex ${f.duration}s linear ${f.delay}s infinite`,
            fontFamily: mono, fontSize: f.fontSize,
            color: isDashboard
              ? (f.id % 3 === 0 ? 'rgba(0,255,136,0.08)' : 'rgba(0,212,255,0.08)')
              : (f.id % 3 === 0 ? 'rgba(0,255,136,0.03)' : 'rgba(0,212,255,0.03)'),
            whiteSpace: 'nowrap',
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
type NavStatus = 'idle' | 'scanning' | 'complete'

function Navbar({ status }: { status: NavStatus }) {
  const [cursorOn, setCursorOn] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setCursorOn(p => !p), 530)
    return () => clearInterval(t)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64, background: 'rgba(8,9,13,0.92)',
      borderBottom: `1px solid ${C.border}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={finalLogo}
          alt="0xVerdict logo"
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 20, letterSpacing: '0.04em' }}>
            <span style={{ color: C.green }}>Ox</span>
            <span style={{ color: C.textPrimary }}>Verdict</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
            &gt; AI Security Analyst
            <span style={{ color: C.green, opacity: cursorOn ? 1 : 0, transition: 'opacity 50ms' }}>▋</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          fontFamily: mono, fontSize: 11, color: C.muted,
          border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 20,
        }}>v1.0.0</span>

        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>

        <div style={{ width: 1, height: 20, background: C.border }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 12 }}>
          {status === 'idle' && (
            <>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.muted }} />
              <span style={{ color: C.muted }}>IDLE</span>
            </>
          )}
          {status === 'scanning' && (
            <>
              <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ color: C.green }}>SCANNING</span>
            </>
          )}
          {status === 'complete' && (
            <>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ color: C.green }}>SCAN COMPLETE</span>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ─── Usecase: Typewriter hook ─────────────────────────────────────────────────
function useTypewriter(text: string, delay = 40, startAfter = 0) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    setDisplayed('')
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(iv)
      }, delay)
      return () => clearInterval(iv)
    }, startAfter)
    return () => clearTimeout(t)
  }, [text, delay, startAfter])
  return displayed
}

// ─── Screen 1: Landing ────────────────────────────────────────────────────────

function Wordmark({ visible }: { visible: boolean }) {
  return (
    <div style={{
      marginBottom: 24,
      animation: visible ? 'wordmark-up 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both' : 'none',
    }}>
      <span style={{
        fontFamily: grotesk, fontWeight: 700,
        fontSize: 'clamp(28px, 3.5vw, 36px)',
        letterSpacing: '0.06em',
        color: '#F5F7FA',
        textShadow: '0 0 40px rgba(0,255,136,0.08)',
      }}>
        <span style={{ color: '#00FF88' }}>Ox</span>Verdict
      </span>
    </div>
  )
}

function Landing({ onScan }: { onScan: (url: string, scanId: string) => void }) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [cursorOn, setCursorOn] = useState(true)
  const [scanError, setScanError] = useState<string | null>(null)
  const preTitleText = '> Initializing AI Security Engine...'
  const displayed = useTypewriter(preTitleText, 38, 500)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setCursorOn(p => !p), 530)
    return () => clearInterval(t)
  }, [])

  const handleScan = async () => {
    const target = url.trim() || 'http://localhost:3000'
    setScanError(null)
    try {
      const result = await startScan(target)
      if (!result.scan_id) throw new Error('Backend returned an invalid response')
      onScan(target, result.scan_id)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to start scan')
    }
  }

  const pills = ['🧪 localhost:3000', '🧪 testphp.vulnweb.com']

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 0', position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 28,
          opacity: visible ? 1 : 0, transition: 'opacity 400ms 100ms',
        }}>
          <img
            src={finalLogo}
            alt="0xVerdict \u2014 AI-Powered Web Vulnerability Analysis"
            style={{
              width: 120, height: 120, objectFit: 'cover', borderRadius: '50%',
              filter: 'drop-shadow(0 0 24px rgba(0,255,136,0.35)) drop-shadow(0 0 48px rgba(0,255,136,0.15))',
            }}
          />
        </div>

        {/* Wordmark */}
        <Wordmark visible={visible} />

        {/* Pre-title */}
        <div style={{
          fontFamily: mono, fontSize: 12, color: C.green,
          marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          opacity: visible ? 1 : 0, transition: 'opacity 400ms 300ms',
          minHeight: 18,
        }}>
          <span>{displayed}</span>
          <span style={{ opacity: displayed.length >= preTitleText.length ? (cursorOn ? 1 : 0) : 1, color: C.green }}>▋</span>
        </div>

        {/* Main headline */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 500ms 500ms, transform 500ms 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(40px, 5.5vw, 60px)', lineHeight: 1.1, color: C.textPrimary }}>
            Scan Smarter.
          </div>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(40px, 5.5vw, 60px)', lineHeight: 1.1, color: C.green }}>
            Get Verdicts.
          </div>
        </div>

        {/* Subheadline */}
        <p style={{
          fontFamily: inter, fontSize: 15, color: C.muted, maxWidth: 500,
          margin: '20px auto 0', lineHeight: 1.7,
          opacity: visible ? 1 : 0, transition: 'opacity 400ms 700ms',
        }}>
          0xVerdict combines automated vulnerability scanning with AI analysis to eliminate false positives and deliver developer-ready security reports.
        </p>

        {/* Value comparison strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 16, marginTop: 44, alignItems: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 400ms 900ms',
        }}>
          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>🔍</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 12, color: C.muted, marginBottom: 4, letterSpacing: '0.03em' }}>Traditional Scanner</div>
            <div style={{ fontFamily: inter, fontSize: 11, color: C.red, opacity: 0.8 }}>Raw findings → Developer confused</div>
          </div>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 28, color: C.green, opacity: 0.6 }}>→</div>
          <div style={{ background: 'rgba(0,255,136,0.03)', border: `1px solid rgba(0,255,136,0.15)`, borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>🤖</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 12, color: C.textPrimary, marginBottom: 4, letterSpacing: '0.03em' }}>0xVerdict</div>
            <div style={{ fontFamily: inter, fontSize: 11, color: C.green, opacity: 0.9 }}>AI Verdict → Root Cause → Fix → Report</div>
          </div>
        </div>

        {/* URL Input */}
        <div style={{
          marginTop: 44,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 400ms 1100ms, transform 400ms 1100ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            width: '100%', height: 56,
            background: C.bgSecondary,
            border: `1px solid ${focused ? C.green : C.border}`,
            borderRadius: 10, display: 'flex', alignItems: 'center',
            boxShadow: focused ? `0 0 0 3px rgba(0,255,136,0.1)` : 'none',
            transition: 'border-color 200ms, box-shadow 200ms',
            overflow: 'hidden',
          }}>
            <span style={{ fontFamily: mono, fontSize: 15, color: C.green, padding: '0 12px 0 16px', opacity: 0.7 }}>&gt;</span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="http://localhost:3000  —  enter authorized target URL"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: mono, fontSize: 13,
                color: C.textPrimary, caretColor: C.green,
              }}

            />
            <div style={{ width: 1, height: 32, background: C.border, marginRight: 0 }} />
            <button
              onClick={handleScan}
              style={{
                height: '100%', width: 96, background: C.green,
                border: 'none', cursor: 'pointer', borderRadius: '0 9px 9px 0',
                fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#08090D',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 200ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              SCAN ▶
            </button>
          </div>

          {/* Quick-fill pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ fontFamily: inter, fontSize: 11, color: C.muted }}>Test environments:</span>
            {pills.map(pill => (
              <button
                key={pill}
                onClick={() => setUrl(pill.includes('localhost') ? 'http://localhost:3000' : 'http://testphp.vulnweb.com')}
                style={{
                  fontFamily: inter, fontSize: 11, color: C.muted,
                  border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px',
                  background: 'transparent', cursor: 'pointer', transition: 'border-color 200ms, color 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Error message */}
          {scanError && (
            <div style={{
              fontFamily: mono, fontSize: 12, color: C.red,
              marginTop: 14, textAlign: 'center',
            }}>
              ⚠ {scanError}
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 52,
        }}>
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              ),
              label: null, title: '3 Vulnerability Types', body: 'Header Security · SQL Injection · Reflected XSS',
              border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: '1300ms',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              ),
              label: '⭐ CORE FEATURE', title: 'AI Verdict Engine', body: 'Confirmed · Needs Verification · Likely False Positive',
              border: 'rgba(0,212,255,0.25)', bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.cyan, delay: '1380ms',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              ),
              label: null, title: 'Developer Reports', body: 'Markdown Export · Professional PDF · Cover Page',
              border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: '1460ms',
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '18px 16px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 300ms ${card.delay}, transform 300ms ${card.delay} cubic-bezier(0.16, 1, 0.3, 1)`,
              }}
            >
              {card.label && (
                <div style={{ fontFamily: mono, fontSize: 9, color: C.cyan, marginBottom: 8, letterSpacing: '0.04em' }}>{card.label}</div>
              )}
              <div style={{ marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: card.titleColor, marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontFamily: inter, fontSize: 11, color: card.bodyColor, lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.bgSecondary, borderTop: `1px solid ${C.border}`,
        padding: '10px 64px', textAlign: 'center', zIndex: 10,
        opacity: visible ? 1 : 0, transition: 'opacity 400ms 1500ms',
      }}>
        <p style={{ fontFamily: inter, fontSize: 11, color: C.muted, lineHeight: 1.5, opacity: 0.7 }}>
          ⚠ NOTICE: This tool is intended exclusively for authorized security testing environments (e.g., OWASP Juice Shop, DVWA, or infrastructure where explicit written permission has been granted). Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
        </p>
      </div>
    </div>
  )
}

// ─── Screen 2: Scanning ───────────────────────────────────────────────────────
function Scanning({ target, scanId, onComplete }: {
  target: string; scanId: string; onComplete: (data: ScanResult) => void
}) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [counts] = useState({ critical: 0, high: 0, medium: 0, total: 0 })
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [failed, setFailed] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const prevMessageRef = useRef<string>('')

  useEffect(() => {
    setLines([
      { text: '> Initializing reconnaissance engine...', color: C.muted, bold: false },
      { text: `> Target: ${target}`, color: C.cyan, bold: false },
      { text: '', color: '', bold: false },
    ])

    const elapsedIv = setInterval(() => setElapsed(p => p + 1), 1000)

    let cancelled = false
    const POLL_INTERVAL = 2000

    const poll = async () => {
      while (!cancelled) {
        try {
          const data = await getScanStatus(scanId)
          if (cancelled) break

          setProgress(data.progress_percent)

          const stepMap: Record<string, number> = {
            Reconnoitering: 0, Scanning: 1, 'AI Analyzing': 2,
          }
          setPipelineStep(stepMap[data.scan_status] ?? -1)

          if (data.pipeline_message && data.pipeline_message !== prevMessageRef.current) {
            setLines(prev => [...prev, { text: `> ${data.pipeline_message}`, color: C.muted, bold: false }])
            prevMessageRef.current = data.pipeline_message
          }

          if (data.scan_status === 'Completed') {
            clearInterval(elapsedIv)
            const full = await getScanResult(scanId)
            setTimeout(() => onComplete(full), 800)
            return
          } else if (data.scan_status === 'Failed') {
            clearInterval(elapsedIv)
            setLines(prev => [...prev, { text: `> ERROR: ${data.pipeline_message || 'Scan failed'}`, color: C.red, bold: true }])
            setFailed(true)
            return
          }
        } catch (err) {
          if (!cancelled) {
            setFailed(true)
            setLines(prev => [...prev, { text: `> ERROR: ${err instanceof Error ? err.message : 'Connection lost'}`, color: C.red, bold: true }])
          }
          clearInterval(elapsedIv)
          return
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL))
      }
    }

    poll()

    return () => { cancelled = true; clearInterval(elapsedIv) }
  }, [scanId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

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
    { label: 'RECON', state: pipelineStep === 0 ? 'active' : pipelineStep > 0 ? 'complete' : 'waiting' },
    { label: 'SCANNING', state: pipelineStep === 1 ? 'active' : pipelineStep > 1 ? 'complete' : 'waiting' },
    { label: 'AI ANALYSIS', state: pipelineStep === 2 ? 'active' : 'waiting' },
  ]

  const recentLines = lines.slice(-3)

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Scan status banner */}
      <div style={{
        background: C.bgSecondary, borderBottom: `1px solid ${C.border}`,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={failed ? '' : 'pulse-dot'} style={{ width: 8, height: 8, borderRadius: '50%', background: failed ? C.red : C.green, flexShrink: 0 }} />
          <span style={{ fontFamily: mono, fontSize: 13, color: C.textPrimary }}>
            {failed ? 'FAILED:' : 'SCANNING:'} <span style={{ color: failed ? C.red : C.cyan }}>{target}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 13, color: C.green }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {mm}:{ss}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid', gridTemplateColumns: '62% 38%', gap: 16,
        padding: '24px 32px', height: 'calc(100vh - 64px - 52px)',
      }}>
        {/* Left: Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RECON & DETECTION LOG
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${failed ? C.red : C.green}`, borderRadius: 20, padding: '3px 10px',
            }}>
              <div className={failed ? '' : 'pulse-dot'} style={{ width: 5, height: 5, borderRadius: '50%', background: failed ? C.red : C.green }} />
              <span style={{ fontFamily: mono, fontSize: 9, color: failed ? C.red : C.green }}>{failed ? 'FAILED' : 'LIVE'}</span>
            </div>
          </div>

          <div
            ref={terminalRef}
            style={{
              flex: 1, background: C.bgInput, border: `1px solid ${failed ? C.red : C.border}`,
              borderRadius: 8, padding: 20, overflowY: 'auto',
              fontFamily: mono, fontSize: 12, lineHeight: '22px',
            }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                className="terminal-line"
                style={{
                  color: line.color || 'transparent',
                  fontWeight: line.bold ? 700 : 400,
                  animationDelay: `0ms`,
                  minHeight: 22,
                }}
              >
                {line.text || ' '}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Error banner */}
          {failed && (
            <div style={{
              background: 'rgba(255,51,102,0.1)', border: `1px solid ${C.red}`,
              borderRadius: 8, padding: '12px 16px',
              fontFamily: mono, fontSize: 12, color: C.red, lineHeight: 1.5,
            }}>
              SCAN FAILED<br />
              {prevMessageRef.current || 'An unknown error occurred.'}
            </div>
          )}
          {/* 2×2 metric grid */}
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
                <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: card.color, letterSpacing: '0.08em', marginBottom: 4 }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 36, color: card.textColor || card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontFamily: inter, fontSize: 11, color: C.muted, marginTop: 4 }}>vulnerabilities</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>SCAN PROGRESS</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: C.green }}>{Math.round(progress)}%</span>
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

          {/* Pipeline steps */}
          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
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
                      {step.state === 'complete' && <span style={{ color: C.green, fontSize: 12 }}>✓</span>}
                      {step.state === 'active' && <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />}
                      {step.state === 'waiting' && <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${C.border}` }} />}
                    </div>
                    <span style={{ fontFamily: inter, fontSize: 10, color: step.state === 'waiting' ? C.muted : C.textPrimary, whiteSpace: 'nowrap' }}>
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

          {/* Current action log */}
          <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', height: 84, overflow: 'hidden' }}>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>CURRENT ACTION</div>
            {recentLines.filter(l => l.text).slice(-3).map((line, i) => (
              <div key={i} style={{ fontFamily: mono, fontSize: 11, color: i === recentLines.filter(l => l.text).slice(-3).length - 1 ? line.color : C.muted, lineHeight: '18px' }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Verdict / Severity badges ────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: Finding['verdict'] }) {
  const cfg = {
    confirmed: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.4)', text: C.green, label: '✅ CONFIRMED' },
    verify: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.4)', text: C.orange, label: '⚠ NEEDS VERIFICATION' },
    fp: { bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)', text: C.red, label: '❌ LIKELY FALSE POSITIVE' },
  }[verdict]
  return (
    <span style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: grotesk, fontWeight: 600, fontSize: 11, color: cfg.text,
      whiteSpace: 'nowrap',
      textDecoration: verdict === 'fp' ? 'line-through' : 'none',
    }}>
      {cfg.label}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: Finding['severity'] }) {
  const cfg = {
    critical: { bg: 'rgba(255,51,102,0.12)', border: 'rgba(255,51,102,0.4)', text: C.red, label: '🔴 CRITICAL' },
    high: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.4)', text: C.orange, label: '🟠 HIGH' },
    medium: { bg: 'rgba(123,97,255,0.1)', border: 'rgba(123,97,255,0.4)', text: C.purple, label: '🟣 MEDIUM' },
    low: { bg: 'rgba(136,146,164,0.1)', border: 'rgba(136,146,164,0.3)', text: C.muted, label: '⚪ LOW' },
  }[severity]
  return (
    <span style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: grotesk, fontWeight: 600, fontSize: 11, color: cfg.text,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: Finding['priority'] }) {
  const cfg = {
    immediate: { bg: 'rgba(255,51,102,0.08)', border: C.red, text: C.red, label: '⚡ IMMEDIATE' },
    high: { bg: 'rgba(255,184,0,0.08)', border: C.orange, text: C.orange, label: '🔺 HIGH' },
    normal: { bg: 'rgba(123,97,255,0.08)', border: C.purple, text: C.purple, label: '— NORMAL' },
    low: { bg: 'rgba(136,146,164,0.08)', border: C.muted, text: C.muted, label: '↓ LOW' },
  }[priority]
  return (
    <span style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: mono, fontSize: 10, color: cfg.text,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────
function AIPanel({ finding, onDownloadPdf, markdownUrl }: {
  finding: Finding | null; onDownloadPdf: () => void; markdownUrl: string
}) {
  const [lang, setLang] = useState<'Node.js' | 'Python' | 'PHP'>('Node.js')

  if (!finding) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={C.border} strokeWidth="1.5">
          <polygon points="24,4 44,16 44,32 24,44 4,32 4,16" />
          <polygon points="24,12 38,20 38,28 24,36 10,28 10,20" />
        </svg>
        <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.muted }}>SELECT A FINDING</div>
        <div style={{ fontFamily: inter, fontSize: 12, color: C.muted }}>Click any row to view AI analysis</div>
      </div>
    )
  }

  const confidenceFilled = { HIGH: 3, MEDIUM: 2, LOW: 1 }[finding.confidence]

  return (
    <div className="ai-panel-enter" style={{ overflowY: 'auto', height: '100%', paddingRight: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI ANALYSIS</span>
        <span style={{
          fontFamily: mono, fontSize: 10, color: C.muted,
          border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 8px',
        }}>{finding.id}</span>
      </div>

      {/* Verdict */}
      <Section label="AI VERDICT">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            position: 'absolute', inset: '-8px -12px',
            background: 'radial-gradient(ellipse, rgba(0,255,136,0.15), transparent)',
            borderRadius: 8, pointerEvents: 'none',
          }} />
          <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 20, color: C.green, position: 'relative' }}>
            {finding.verdict === 'confirmed' && '✅ CONFIRMED'}
            {finding.verdict === 'verify' && '⚠ NEEDS VERIFICATION'}
            {finding.verdict === 'fp' && '❌ LIKELY FALSE POSITIVE'}
          </span>
        </div>
      </Section>

      {/* Severity reclassification */}
      {finding.scannerSeverity !== finding.aiSeverity && (
        <Section label="SEVERITY RECLASSIFICATION">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 14, color: C.muted, textDecoration: 'line-through' }}>
              {finding.scannerSeverity}
            </span>
            <span style={{ color: C.muted }}>→</span>
            <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 14, color: C.red }}>{finding.aiSeverity}</span>
          </div>
          <div style={{ fontFamily: inter, fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>
            AI upgraded severity after evidence review
          </div>
        </Section>
      )}

      {/* Priority */}
      <Section label="PRIORITY">
        <PriorityBadge priority={finding.priority} />
        <p style={{ fontFamily: inter, fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{finding.priorityReason}</p>
      </Section>

      {/* Confidence */}
      <Section label="CONFIDENCE">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.green }}>{finding.confidence}</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: 18, height: 8, borderRadius: 2,
                background: n <= confidenceFilled ? C.green : C.border,
              }} />
            ))}
          </div>
        </div>
        <p style={{ fontFamily: inter, fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>{finding.confidenceReason}</p>
      </Section>

      <div style={{ height: 1, background: C.border, margin: '12px 0' }} />

      {/* Root cause */}
      <Section label="ROOT CAUSE">
        <p style={{ fontFamily: inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{finding.rootCause}</p>
      </Section>

      {/* Dev explanation */}
      <Section label="DEVELOPER EXPLANATION">
        <p style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{finding.devExplanation}</p>
      </Section>

      {/* Fix recommendation */}
      <Section label="FIX RECOMMENDATION">
        <div style={{
          borderLeft: `3px solid ${C.green}`, background: 'rgba(0,255,136,0.06)',
          borderRadius: '0 6px 6px 0', padding: '10px 14px',
        }}>
          <p style={{ fontFamily: inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{finding.fixRecommendation}</p>
        </div>
      </Section>

      {/* Code block */}
      <Section label="SECURE CODE EXAMPLE">
        <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
          {(['Node.js', 'Python', 'PHP'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontFamily: mono, fontSize: 11, background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '4px 10px',
                color: lang === l ? C.green : C.muted,
                borderBottom: `2px solid ${lang === l ? C.green : 'transparent'}`,
                transition: 'color 150ms',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{
          background: C.bgInput, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.green}`, borderRadius: '0 6px 6px 0',
          padding: 16, position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 12, color: C.muted, userSelect: 'none', lineHeight: '20px' }}>
              {finding.remediationCode.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre style={{ fontFamily: mono, fontSize: 12, color: C.green, lineHeight: '20px', margin: 0, overflow: 'auto', flex: 1 }}>
              {finding.remediationCode}
            </pre>
          </div>
        </div>
      </Section>

      {/* Manual verification */}
      <Section label="MANUAL VERIFICATION">
        <div style={{
          background: 'rgba(0,212,255,0.05)', border: `1px solid rgba(0,212,255,0.2)`,
          borderRadius: 6, padding: 12,
        }}>
          {finding.manualSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < finding.manualSteps.length - 1 ? 8 : 0 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, minWidth: 16 }}>{i + 1}.</span>
              <span style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Priority note */}
      <Section label="">
        <div style={{
          background: 'rgba(255,184,0,0.08)', borderLeft: `3px solid ${C.orange}`,
          borderRadius: '0 6px 6px 0', padding: '10px 14px',
        }}>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.muted }}>⚠ {finding.priorityNote}</p>
        </div>
      </Section>

      {/* Download buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <button
          onClick={onDownloadPdf}
          style={{
            height: 44, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.green, color: C.bgPrimary,
            fontFamily: grotesk, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          📄 Download PDF Report
        </button>
        <a
          href={markdownUrl}
          download
          style={{
            height: 40, borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: grotesk, fontWeight: 500, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'border-color 150ms',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.muted)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
        >
          📝 Download Markdown
        </a>
        <p style={{ fontFamily: inter, fontSize: 10, color: C.muted, textAlign: 'center' }}>
          ⚠ Authorized use only. See full disclaimer in report.
        </p>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Screen 3: Results ────────────────────────────────────────────────────────
type FilterType = 'all' | 'confirmed' | 'verify' | 'fp'

function Results({ target, scanId, initialData, onModal }: {
  target: string; scanId: string; initialData: ScanResult | null; onModal: () => void
}) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Finding | null>(null)
  const [loading, setLoading] = useState(initialData === null)
  const [entering, setEntering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanData, setScanData] = useState<ScanResult | null>(initialData)
  const [findings, setFindings] = useState<Finding[]>(initialData ? mapFindings(initialData.findings) : [])

  useEffect(() => {
    if (initialData !== null) {
      const t = setTimeout(() => setEntering(false), 500)
      return () => clearTimeout(t)
    }
    getScanResult(scanId)
      .then(data => {
        setScanData(data)
        setFindings(mapFindings(data.findings))
        setLoading(false)
        setTimeout(() => setEntering(false), 500)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load results')
        setLoading(false)
        setEntering(false)
      })
  }, [scanId, initialData])

  if (entering) {
    return (
      <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1, background: C.bgPrimary }}>
        <div style={{
          height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: `3px solid ${C.border}`,
            borderTop: `3px solid ${C.green}`,
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 14, color: C.textPrimary, marginBottom: 6 }}>
              {loading ? 'Loading Scan Results' : 'Preparing Results'}
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: C.muted }}>
              {loading ? 'Fetching AI analysis...' : 'Finalizing report...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !scanData) {
    return (
      <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontFamily: mono, fontSize: 13, color: C.red }}>{error || 'Failed to load scan results'}</span>
          <button
            onClick={() => { setLoading(true); setError(null); getScanResult(scanId).then(d => { setScanData(d); setFindings(mapFindings(d.findings)); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }}
            style={{
              fontFamily: mono, fontSize: 12, padding: '8px 16px', borderRadius: 6,
              border: `1px solid ${C.border}`, background: 'transparent', color: C.textPrimary,
              cursor: 'pointer', transition: 'border-color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.green)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          >
            RETRY
          </button>
        </div>
      </div>
    )
  }

  const filtered = findings.filter(f => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return f.verdict === 'confirmed'
    if (filter === 'verify') return f.verdict === 'verify'
    if (filter === 'fp') return f.verdict === 'fp'
    return true
  })

  const counts = {
    confirmed: findings.filter(f => f.verdict === 'confirmed').length,
    verify: findings.filter(f => f.verdict === 'verify').length,
    fp: findings.filter(f => f.verdict === 'fp').length,
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `ALL (${findings.length})` },
    { key: 'confirmed', label: `✅ CONFIRMED (${counts.confirmed})` },
    { key: 'verify', label: `⚠ VERIFY (${counts.verify})` },
    { key: 'fp', label: `❌ FALSE POSITIVE (${counts.fp})` },
  ]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Summary bar */}
      <div style={{
        background: 'rgba(15, 15, 26, 0.85)', borderBottom: `1px solid ${C.border}`,
        height: 56, display: 'flex', alignItems: 'center',
      }}>
        {[
          { label: 'TARGET', value: target, color: C.cyan, mono: true },
          { label: 'SCAN DATE', value: scanData.scan_date || '—', color: C.textPrimary, mono: true },
          { label: 'DURATION', value: scanData.scan_duration || '—', color: C.textPrimary, mono: true },
          { label: 'CONFIRMED', value: String(scanData.summary?.confirmed ?? 0), color: C.green, big: true },
          { label: 'STATUS', value: '● COMPLETED', color: C.green, mono: true },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              height: '100%', padding: '0 16px',
            }}
          >
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{
              fontFamily: stat.mono ? mono : grotesk,
              fontWeight: stat.big ? 700 : 400,
              fontSize: stat.big ? 24 : 13,
              color: stat.color,
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'calc(65% - 8px) calc(35% - 8px)',
        gap: 16,
        height: 'calc(100vh - 64px - 56px - 24px)',
        padding: '0 24px 24px',
        overflow: 'hidden',
      }}>
        {/* Left: findings */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: 'rgba(10, 10, 15, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              VULNERABILITY FINDINGS
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {filters.map(f => {
                const isActive = filter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      fontFamily: mono, fontSize: 9, padding: '5px 12px', borderRadius: 4,
                      cursor: 'pointer', border: `1px solid ${isActive ? C.green : C.border}`,
                      background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                      color: isActive ? C.green : C.muted,
                      transition: 'all 150ms',
                      fontWeight: isActive ? 700 : 400,
                      boxShadow: isActive ? `0 0 8px rgba(0, 255, 136, 0.2)` : 'none',
                    }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.3)' }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.borderColor = C.border }}
                  >
                    {isActive ? `[ ${f.label} ]` : f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 90px 160px 110px 120px',
            padding: '0 24px', height: 44, alignItems: 'center',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            {['ID', 'VULNERABILITY', 'ENDPOINT', 'AI VERDICT', 'SEVERITY', 'PRIORITY'].map(h => (
              <span key={h} style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          <div className="cyber-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((f, i) => {
              const isSelected = selected?.id === f.id
              return (
                <div
                  key={f.id}
                  className={`finding-row-enter cyber-row ${isSelected ? 'cyber-row-active' : ''}`}
                  onClick={() => setSelected(isSelected ? null : f)}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 90px 160px 110px 120px',
                    padding: '0 24px', height: 48, alignItems: 'center',
                    cursor: 'pointer', position: 'relative',
                    borderBottom: `1px solid ${C.border}`,
                    opacity: f.verdict === 'fp' ? 0.55 : 1,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {/* Left accent bar */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: f.severity === 'critical' ? C.red
                              : f.severity === 'high' ? C.orange
                              : f.severity === 'medium' ? C.purple
                              : C.muted,
                    borderRadius: '0 2px 2px 0',
                    boxShadow: isSelected 
                      ? `0 0 8px ${f.severity === 'critical' ? C.red : f.severity === 'high' ? C.orange : f.severity === 'medium' ? C.purple : C.muted}`
                      : 'none',
                  }} />
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{f.id}</span>
                  <span style={{ fontFamily: inter, fontWeight: 600, fontSize: 13, color: C.textPrimary }}>{f.type}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan }}>{f.endpoint}</span>
                  <VerdictBadge verdict={f.verdict} />
                  <SeverityBadge severity={f.severity} />
                  <PriorityBadge priority={f.priority} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: AI panel */}
        <div className="cyber-scroll" style={{
          padding: '20px',
          overflowY: 'auto',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: 'rgba(15, 15, 26, 0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <AIPanel
            finding={selected}
            onDownloadPdf={onModal}
            markdownUrl={getMarkdownReportUrl(scanData.scan_id)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: PDF Modal ──────────────────────────────────────────────────────
function PdfModal({ target, findings, scanData, onClose }: {
  target: string; findings: Finding[]; scanData: ScanResult; onClose: () => void
}) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 960, maxHeight: '90vh', background: C.bgSecondary,
        border: `1px solid ${C.border}`, borderRadius: 12,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fade-slide-up 300ms ease-out both',
      }}>
        {/* Modal header */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.textPrimary }}>REPORT PREVIEW</span>
          <span style={{ fontFamily: inter, fontSize: 12, color: C.muted }}>0xVerdict Assessment Report</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: inter, fontSize: 13, color: C.muted,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
          >
            ✕ Close
          </button>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#e8e8e8', padding: 32 }}>
          {/* A4 page */}
          <div style={{
            width: '100%', maxWidth: 794, margin: '0 auto',
            background: '#fff', boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
            fontFamily: "'Georgia', serif",
          }}>
            {/* Cover page */}
            <div style={{ background: '#08090D', padding: '48px 56px', minHeight: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                <img
                  src={finalLogo}
                  alt="0xVerdict"
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.5))' }}
                />
                <div>
                  <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 26, color: '#F5F7FA', letterSpacing: '0.04em' }}>
                    <span style={{ color: '#00FF88' }}>Ox</span>Verdict
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#A7B0BE' }}>AI Security Intelligence Platform</div>
                </div>
              </div>

              <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: '#F5F7FA', marginBottom: 32, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Vulnerability Assessment Report
              </div>

              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 48 }}>
                {[
                  ['Target URL', target],
                  ['Scan Date', scanData.scan_date || '—'],
                  ['Scan Status', scanData.scan_status],
                  ['Duration', scanData.scan_duration || '—'],
                  ['Generated By', '0xVerdict AI Engine v1.0.0'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontFamily: mono, fontSize: 11, color: '#8892A4', padding: '6px 0', width: 160 }}>{k}:</td>
                    <td style={{ fontFamily: mono, fontSize: 11, color: '#F5F7FA', padding: '6px 0' }}>{v}</td>
                  </tr>
                ))}
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                {[
                  { label: 'CRITICAL', count: scanData.summary?.critical ?? 0, color: '#FF3366' },
                  { label: 'HIGH', count: scanData.summary?.high ?? 0, color: '#FFB800' },
                  { label: 'MEDIUM', count: scanData.summary?.medium ?? 0, color: '#7B61FF' },
                  { label: 'LOW', count: scanData.summary?.low ?? 0, color: '#8892A4' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.color, padding: '10px 16px' }}>
                    <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 20, color: '#fff' }}>{s.count}</div>
                    <div style={{ fontFamily: grotesk, fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div style={{ padding: '48px 56px', borderBottom: '1px solid #ddd' }}>
              <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 24, color: '#111', marginBottom: 16, fontWeight: 700 }}>Executive Summary</h1>
                <p style={{ fontFamily: inter, fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 24 }}>
                An automated vulnerability assessment was conducted against <strong>{target}</strong> on {scanData.scan_date || '—'}. The scan identified <strong>{scanData.summary?.total_findings ?? 0} potential security issues</strong>, of which <strong>{scanData.summary?.confirmed ?? 0} were confirmed</strong> by the AI Verdict Engine, <strong>{scanData.summary?.needs_verification ?? 0} requires manual verification</strong>, and <strong>{scanData.summary?.false_positives ?? 0} was classified as a likely false positive</strong>. Immediate remediation is recommended for the highest severity confirmed findings.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontFamily: inter, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['Total Findings', 'Confirmed', 'Needs Verification', 'False Positives'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#333', border: '1px solid #e0e0e0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[scanData.summary?.total_findings ?? 0, scanData.summary?.confirmed ?? 0, scanData.summary?.needs_verification ?? 0, scanData.summary?.false_positives ?? 0].map((v, i) => (
                      <td key={i} style={{ padding: '10px 16px', border: '1px solid #e0e0e0', color: '#555' }}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: '#111', marginBottom: 12 }}>Priority Breakdown</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: inter, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['⚡ Immediate', '🔺 High', '— Normal', '↓ Low'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#333', border: '1px solid #e0e0e0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {['immediate', 'high', 'normal', 'low'].map(p => String(findings.filter(f => f.priority === p).length)).map((v, i) => (
                      <td key={i} style={{ padding: '10px 16px', border: '1px solid #e0e0e0', color: '#555' }}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Finding detail */}
            {findings.filter(f => f.verdict === 'confirmed').map(f => (
              <div key={f.id} style={{ padding: '40px 56px', borderBottom: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 4 }}>{f.id}</div>
                    <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 20, color: '#111', fontWeight: 700 }}>{f.type}</h2>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: inter, fontSize: 12, color: '#555' }}>
                    <div>Endpoint: <strong style={{ fontFamily: mono }}>{f.endpoint}</strong></div>
                    <div>AI Verdict: <strong style={{ color: '#00AA55' }}>✅ CONFIRMED</strong></div>
                  </div>
                </div>

                <div style={{ background: '#fff8f8', border: '1px solid #ffcccc', borderRadius: 4, padding: '8px 14px', marginBottom: 16, fontFamily: inter, fontSize: 12, color: '#cc3333' }}>
                  Scanner Severity: <s>{f.scannerSeverity}</s> → AI Classified: <strong>{f.aiSeverity}</strong>
                </div>

                {[
                  { label: 'Root Cause', text: f.rootCause },
                  { label: 'Developer Explanation', text: f.devExplanation },
                  { label: 'Fix Recommendation', text: f.fixRecommendation },
                ].map(({ label, text }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <h3 style={{ fontFamily: inter, fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 4 }}>{label}</h3>
                    <p style={{ fontFamily: inter, fontSize: 13, color: '#555', lineHeight: 1.6 }}>{text}</p>
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ fontFamily: inter, fontWeight: 600, fontSize: 13, color: '#333', marginBottom: 8 }}>Secure Code Example (Node.js)</h3>
                  <pre style={{
                    background: '#1a1a2e', color: '#00FF88', fontFamily: mono, fontSize: 12,
                    padding: '16px', borderRadius: 4, overflow: 'auto', lineHeight: 1.6,
                  }}>{f.remediationCode}</pre>
                </div>
              </div>
            ))}

            {/* Legal */}
            <div style={{ padding: '24px 56px', background: '#f9f9f9' }}>
              <p style={{ fontFamily: inter, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                NOTICE: This tool is intended exclusively for authorized security testing environments (e.g., OWASP Juice Shop, DVWA, or infrastructure where explicit written permission has been granted). Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
              </p>
            </div>
          </div>
        </div>

        {/* Modal bottom bar */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          borderTop: `1px solid ${C.border}`, padding: '0 24px', flexShrink: 0,
        }}>
          <a
            href={getPdfReportUrl(scanData.scan_id)}
            download
            style={{
              height: 40, padding: '0 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: C.green, color: C.bgPrimary, fontFamily: grotesk, fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            }}
          >📥 Download PDF</a>
          <a
            href={getMarkdownReportUrl(scanData.scan_id)}
            download
            style={{
              height: 40, padding: '0 20px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.textPrimary, fontFamily: grotesk, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            }}
          >📝 Download Markdown</a>
          <button
            onClick={onClose}
            style={{
              height: 40, padding: '0 20px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.muted, fontFamily: grotesk, fontSize: 13,
            }}
          >✕ Close Preview</button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "'JetBrains Mono', monospace", color: '#FF3366', background: C.bgPrimary, minHeight: '100vh' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#8892A4', marginBottom: 8 }}>{this.state.error.message}</div>
          <button onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{ fontFamily: 'inherit', fontSize: 12, padding: '8px 16px', background: 'transparent', border: '1px solid #1E2030', color: C.textPrimary, borderRadius: 6, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── App shell ────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'scanning' | 'results'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [target, setTarget] = useState('http://localhost:3000')
  const [scanId, setScanId] = useState<string | null>(null)
  const [scanData, setScanData] = useState<ScanResult | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const navStatus: NavStatus = screen === 'landing' ? 'idle' : screen === 'scanning' ? 'scanning' : 'complete'

  const handleScan = useCallback((url: string, id: string) => {
    setTarget(url)
    setScanId(id)
    setScanError(null)
    setScreen('scanning')
  }, [])

  const handleScanComplete = useCallback((data: ScanResult) => {
    setScanData(data)
    setFindings(mapFindings(data.findings))
    setScreen('results')
  }, [])

  const handleCloseModal = useCallback(() => setShowModal(false), [])

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: C.bgPrimary }}>
        <Background isDashboard={screen === 'results'} />
        <Navbar status={navStatus} />
        {screen === 'landing' && <Landing onScan={handleScan} />}
        {screen === 'scanning' && scanId && (
          <Scanning target={target} scanId={scanId} onComplete={handleScanComplete} />
        )}
        {screen === 'scanning' && !scanId && (
          <div style={{ paddingTop: 64, minHeight: '100vh', background: C.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.muted }}>Invalid scan response from server.</span>
          </div>
        )}
        {screen === 'scanning' && scanError && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            background: 'rgba(255,51,102,0.12)', border: `1px solid ${C.red}`, borderRadius: 8,
            padding: '12px 20px', fontFamily: mono, fontSize: 13, color: C.red,
          }}>
            ⚠ {scanError}
          </div>
        )}
        {screen === 'results' && scanId && (
          <Results target={target} scanId={scanId} initialData={scanData} onModal={() => setShowModal(true)} />
        )}
        {screen === 'results' && !scanId && (
          <div style={{ paddingTop: 64, minHeight: '100vh', background: C.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.muted }}>No scan data available.</span>
          </div>
        )}
        {showModal && scanData && (
          <PdfModal target={target} findings={findings} scanData={scanData} onClose={handleCloseModal} />
        )}
      </div>
    </ErrorBoundary>
  )
}
