import { useState, useEffect, useRef, useCallback } from 'react'
import finalLogo from '@/imports/final_logo.png'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bgPrimary: '#0A0A0F',
  bgSecondary: '#0F0F1A',
  bgTertiary: '#13131F',
  bgInput: '#080810',
  green: '#00FF88',
  cyan: '#00D4FF',
  red: '#FF3366',
  orange: '#FFB800',
  purple: '#7B61FF',
  muted: '#8892A4',
  textPrimary: '#F0F0F0',
  border: '#1E2030',
  borderStrong: '#2A2D45',
}

const mono = "'JetBrains Mono', monospace"
const grotesk = "'Space Grotesk', sans-serif"
const inter = "'Inter', sans-serif"

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

const FINDINGS: Finding[] = [
  {
    id: 'vuln_001', type: 'SQL Injection', endpoint: '/login',
    verdict: 'confirmed', severity: 'critical', scannerSeverity: 'HIGH', aiSeverity: 'CRITICAL',
    priority: 'immediate', confidence: 'HIGH',
    priorityReason: 'Direct database compromise possible via auth bypass.',
    confidenceReason: 'Database returned explicit SQL syntax error directly tied to input.',
    rootCause: 'User data directly concatenated into raw SQL string.',
    devExplanation: 'The payload broke the SQL query structure, altering backend behavior to return all user records.',
    fixRecommendation: 'Use parameterized queries or ORM binding.',
    remediationCode: "const sql = 'SELECT * FROM users WHERE username = ?';\ndb.query(sql, [userInput]);",
    manualSteps: [
      'Intercept the request using browser DevTools Network tab.',
      "Append the payload ' OR 1=1-- to the username parameter.",
      'Submit and check response for SQL exception message.',
    ],
    priorityNote: 'Fix this before XSS and header issues — direct data exposure risk.',
  },
  {
    id: 'vuln_002', type: 'Reflected XSS', endpoint: '/search',
    verdict: 'confirmed', severity: 'high', scannerSeverity: 'HIGH', aiSeverity: 'HIGH',
    priority: 'high', confidence: 'HIGH',
    priorityReason: 'Reflected XSS can steal session tokens and credentials.',
    confidenceReason: 'Script tag reflected verbatim in response body without encoding.',
    rootCause: 'User input rendered directly in HTML response without escaping.',
    devExplanation: 'The search query parameter is embedded in the page response without sanitization, allowing script injection.',
    fixRecommendation: 'Encode all user-supplied data before rendering in HTML context.',
    remediationCode: "const safe = encodeURIComponent(userInput);\nres.send(`<p>${safe}</p>`);",
    manualSteps: [
      'Navigate to /search?q=<script>alert(1)</script>',
      'Observe if the alert dialog executes in the browser.',
      'Check page source for unescaped script tag in response.',
    ],
    priorityNote: 'Address after SQL Injection — session theft risk remains significant.',
  },
  {
    id: 'vuln_003', type: 'Missing Content-Security-Policy', endpoint: '/',
    verdict: 'confirmed', severity: 'medium', scannerSeverity: 'MEDIUM', aiSeverity: 'MEDIUM',
    priority: 'normal', confidence: 'HIGH',
    priorityReason: 'CSP absence enables broader XSS attack surface.',
    confidenceReason: 'HTTP response headers confirmed absence of CSP directive.',
    rootCause: 'Server configuration does not set Content-Security-Policy header.',
    devExplanation: 'Without CSP, browsers have no restrictions on script execution sources.',
    fixRecommendation: 'Add Content-Security-Policy header in server middleware.',
    remediationCode: "app.use((req, res, next) => {\n  res.setHeader('Content-Security-Policy',\n    \"default-src 'self'\");\n  next();\n});",
    manualSteps: [
      'Open DevTools → Network tab → select any page response.',
      'Check Response Headers for Content-Security-Policy.',
      'Confirm it is absent in the current implementation.',
    ],
    priorityNote: 'Implement as part of a security header hardening pass.',
  },
  {
    id: 'vuln_004', type: 'Missing HSTS', endpoint: '/',
    verdict: 'verify', severity: 'low', scannerSeverity: 'LOW', aiSeverity: 'LOW',
    priority: 'low', confidence: 'MEDIUM',
    priorityReason: 'HSTS absence may allow protocol downgrade on public networks.',
    confidenceReason: 'Testing on localhost — HSTS is typically not applicable to local environments.',
    rootCause: 'Strict-Transport-Security header not configured in server response.',
    devExplanation: 'HSTS forces HTTPS connections, preventing protocol downgrade attacks.',
    fixRecommendation: 'Add HSTS header in production HTTPS configuration only.',
    remediationCode: "app.use((req, res, next) => {\n  res.setHeader('Strict-Transport-Security',\n    'max-age=31536000; includeSubDomains');\n  next();\n});",
    manualSteps: [
      'Test against a production HTTPS endpoint, not localhost.',
      'Check for Strict-Transport-Security in response headers.',
      'Verify max-age value meets minimum 1-year requirement.',
    ],
    priorityNote: 'Verify in production environment — likely a false positive on localhost.',
  },
  {
    id: 'vuln_005', type: 'Reflected XSS', endpoint: '/register',
    verdict: 'fp', severity: 'medium', scannerSeverity: 'MEDIUM', aiSeverity: 'LOW',
    priority: 'low', confidence: 'LOW',
    priorityReason: 'Payload was not reflected — likely framework auto-encoding.',
    confidenceReason: 'Modern framework auto-escapes template output, no reflection observed.',
    rootCause: 'Scanner triggered on parameter presence, not actual reflection.',
    devExplanation: 'The registration form uses a framework that auto-escapes all template variables.',
    fixRecommendation: 'No action required — framework encoding provides sufficient protection.',
    remediationCode: "// Framework handles escaping automatically\n// Verify template engine version is up to date",
    manualSteps: [
      'Manually test /register with XSS payload in each field.',
      'Verify all payloads are properly escaped in response.',
      'Confirm framework version has no known encoding bypass.',
    ],
    priorityNote: 'False positive — scanner triggered on parameter; framework protects output.',
  },
]

const TERMINAL_LINES = [
  { text: '> Initializing reconnaissance engine...', color: C.muted, bold: false },
  { text: '> Target: http://localhost:3000', color: C.cyan, bold: false },
  { text: '', color: '', bold: false },
  { text: '> [RECON] Crawling homepage...', color: C.muted, bold: false },
  { text: '> [RECON] Found 14 internal links', color: C.green, bold: false },
  { text: '> [RECON] Detecting HTML forms...', color: C.muted, bold: false },
  { text: '> [RECON] 3 forms discovered:', color: C.green, bold: false },
  { text: '  /login    [POST] username, password', color: C.muted, bold: false },
  { text: '  /search   [GET]  q', color: C.muted, bold: false },
  { text: '  /register [POST] email, pass, confirm', color: C.muted, bold: false },
  { text: '> [RECON] Collecting HTTP headers...', color: C.muted, bold: false },
  { text: '> [RECON] Headers collected: 8 entries', color: C.green, bold: false },
  { text: '', color: '', bold: false },
  { text: '> [SCANNER] Running Security Header checks...', color: C.orange, bold: false },
  { text: '> [SCANNER] Missing: Content-Security-Policy', color: C.orange, bold: false },
  { text: '> [SCANNER] Missing: X-Frame-Options', color: C.orange, bold: false },
  { text: '> [SCANNER] Missing: HSTS', color: C.orange, bold: false },
  { text: '', color: '', bold: false },
  { text: '> [SCANNER] Initializing SQL Injection tests...', color: C.orange, bold: false },
  { text: '> [SCANNER] Testing /login → username param...', color: C.orange, bold: false },
  { text: "> [SCANNER] Payload: ' OR 1=1--", color: C.orange, bold: false },
  { text: '> [!!] SQL ERROR DETECTED at /login', color: C.red, bold: true },
  { text: '> [!!] Evidence: MySQL syntax error near OR 1=1...', color: C.red, bold: false },
  { text: '', color: '', bold: false },
  { text: '> [SCANNER] Initializing XSS tests...', color: C.orange, bold: false },
  { text: '> [SCANNER] Testing /search → q param...', color: C.orange, bold: false },
  { text: '> [SCANNER] Payload: <script>alert(1)</script>', color: C.orange, bold: false },
  { text: '> [!!] XSS REFLECTION DETECTED at /search', color: C.red, bold: true },
  { text: '', color: '', bold: false },
  { text: '> [AI ENGINE] Packaging raw findings...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Sending to AI Verdict Engine...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Analyzing 5 findings...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Processing...', color: C.cyan, bold: false },
  { text: '  ████████████████████░░░░  80%', color: C.cyan, bold: false },
]

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: C.bgPrimary }} />
      <div className="dot-grid-bg" style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(600px circle at top left, rgba(0,255,136,0.06), transparent)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(400px circle at top right, rgba(0,212,255,0.05), transparent)`,
      }} />
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
      height: 64, background: 'rgba(10,10,15,0.92)',
      borderBottom: `1px solid ${C.border}`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={finalLogo}
          alt="0xVerdict logo"
          style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: C.green }}>0x</span>
            <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: C.textPrimary }}>Verdict</span>
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
function Landing({ onScan }: { onScan: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [cursorOn, setCursorOn] = useState(true)
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

  const handleScan = () => {
    const target = url.trim() || 'http://localhost:3000'
    onScan(target)
  }

  const pills = ['🧪 localhost:3000', '🧪 testphp.vulnweb.com']

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 0', position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 680, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 28,
          opacity: visible ? 1 : 0, transition: 'opacity 400ms 100ms',
        }}>
          <img
            src={finalLogo}
            alt="0xVerdict — AI-Powered Web Vulnerability Analysis"
            style={{
              width: 120, height: 120, objectFit: 'contain',
              filter: 'drop-shadow(0 0 24px rgba(0,255,136,0.35)) drop-shadow(0 0 48px rgba(0,255,136,0.15))',
            }}
          />
        </div>

        {/* Pre-title */}
        <div style={{
          fontFamily: mono, fontSize: 12, color: C.green,
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          opacity: visible ? 1 : 0, transition: 'opacity 300ms',
          minHeight: 18,
        }}>
          <span>{displayed}</span>
          <span style={{ opacity: displayed.length >= preTitleText.length ? (cursorOn ? 1 : 0) : 1, color: C.green }}>▋</span>
        </div>

        {/* Main headline */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 400ms 400ms, transform 400ms 400ms ease-out',
        }}>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1, color: C.textPrimary }}>
            Scan Smarter.
          </div>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1, color: C.green }}>
            Get Verdicts.
          </div>
        </div>

        {/* Subheadline */}
        <p style={{
          fontFamily: inter, fontSize: 16, color: C.muted, maxWidth: 520,
          margin: '20px auto 0', lineHeight: 1.6,
          opacity: visible ? 1 : 0, transition: 'opacity 300ms 700ms',
        }}>
          0xVerdict combines automated vulnerability scanning with AI analysis to eliminate false positives and deliver developer-ready security reports.
        </p>

        {/* Value comparison strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 16, marginTop: 40, alignItems: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 300ms 900ms',
        }}>
          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 6 }}>Traditional Scanner</div>
            <div style={{ fontFamily: inter, fontSize: 12, color: C.red }}>Raw findings → Developer confused</div>
          </div>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 32, color: C.green }}>→</div>
          <div style={{ background: 'rgba(0,255,136,0.04)', border: `1px solid rgba(0,255,136,0.2)`, borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🤖</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.textPrimary, marginBottom: 6 }}>0xVerdict</div>
            <div style={{ fontFamily: inter, fontSize: 12, color: C.green }}>AI Verdict → Root Cause → Fix → Report</div>
          </div>
        </div>

        {/* URL Input */}
        <div style={{
          marginTop: 48,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms 1100ms, transform 300ms 1100ms ease-out',
        }}>
          <div style={{
            width: '100%', height: 60,
            background: C.bgSecondary,
            border: `1px solid ${focused ? C.green : C.border}`,
            borderRadius: 8, display: 'flex', alignItems: 'center',
            boxShadow: focused ? `0 0 0 3px rgba(0,255,136,0.12)` : 'none',
            transition: 'border-color 150ms, box-shadow 150ms',
            overflow: 'hidden',
          }}>
            <span style={{ fontFamily: mono, fontSize: 16, color: C.green, padding: '0 12px 0 16px' }}>&gt;</span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="http://localhost:3000  —  enter authorized target URL"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: mono, fontSize: 14,
                color: C.textPrimary, caretColor: C.green,
              }}

            />
            <div style={{ width: 1, height: 36, background: C.border, marginRight: 0 }} />
            <button
              onClick={handleScan}
              style={{
                height: '100%', width: 100, background: C.green,
                border: 'none', cursor: 'pointer', borderRadius: '0 7px 7px 0',
                fontFamily: mono, fontWeight: 700, fontSize: 13, color: C.bgPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 150ms',
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
                  background: 'transparent', cursor: 'pointer', transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 48,
        }}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              ),
              label: null, title: '3 Vulnerability Types', body: 'Header Security · SQL Injection · Reflected XSS',
              border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: '1300ms',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              ),
              label: '⭐ CORE FEATURE', title: 'AI Verdict Engine', body: 'Confirmed · Needs Verification · Likely False Positive',
              border: 'rgba(0,212,255,0.3)', bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.cyan, delay: '1380ms',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                background: card.bg, border: `1px solid ${card.border}`, borderRadius: 8, padding: 20,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 250ms ${card.delay}, transform 250ms ${card.delay} ease-out`,
              }}
            >
              {card.label && (
                <div style={{ fontFamily: mono, fontSize: 9, color: C.cyan, marginBottom: 10 }}>{card.label}</div>
              )}
              <div style={{ marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 14, color: card.titleColor, marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontFamily: inter, fontSize: 12, color: card.bodyColor, lineHeight: 1.5 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.bgSecondary, borderTop: `1px solid ${C.border}`,
        padding: '12px 64px', textAlign: 'center', zIndex: 10,
        opacity: visible ? 1 : 0, transition: 'opacity 300ms 1500ms',
      }}>
        <p style={{ fontFamily: inter, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          ⚠ NOTICE: This tool is intended exclusively for authorized security testing environments (e.g., OWASP Juice Shop, DVWA, or infrastructure where explicit written permission has been granted). Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
        </p>
      </div>
    </div>
  )
}

// ─── Screen 2: Scanning ───────────────────────────────────────────────────────
function Scanning({ target, onComplete }: { target: string; onComplete: () => void }) {
  const [lines, setLines] = useState<typeof TERMINAL_LINES>([])
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, total: 0 })
  const [pipelineStep, setPipelineStep] = useState(0)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let idx = 0
    const addLine = () => {
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

    // Pipeline steps
    setTimeout(() => setPipelineStep(1), 2500)
    setTimeout(() => setPipelineStep(2), 5000)

    // Counts
    setTimeout(() => setCounts(p => ({ ...p, medium: 1, total: 1 })), 3500)
    setTimeout(() => setCounts(p => ({ ...p, high: 1, total: 2 })), 4500)
    setTimeout(() => setCounts(p => ({ ...p, critical: 1, high: 2, medium: 3, total: 5 })), 6000)

    return () => {
      clearTimeout(t)
      clearInterval(elapsedIv)
      clearInterval(progressIv)
    }
  }, [onComplete])

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
    { label: 'RECON', state: pipelineStep > 0 ? 'complete' : 'waiting' },
    { label: 'SCANNING', state: pipelineStep >= 1 && pipelineStep < 2 ? 'active' : pipelineStep >= 2 ? 'complete' : 'waiting' },
    { label: 'AI ANALYSIS', state: pipelineStep >= 2 ? 'active' : 'waiting' },
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
          <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
          <span style={{ fontFamily: mono, fontSize: 13, color: C.textPrimary }}>
            SCANNING: <span style={{ color: C.cyan }}>{target}</span>
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
              border: `1px solid ${C.green}`, borderRadius: 20, padding: '3px 10px',
            }}>
              <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <span style={{ fontFamily: mono, fontSize: 9, color: C.green }}>LIVE</span>
            </div>
          </div>

          <div
            ref={terminalRef}
            style={{
              flex: 1, background: C.bgInput, border: `1px solid ${C.border}`,
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
function AIPanel({ finding, onDownloadPdf }: { finding: Finding | null; onDownloadPdf: () => void }) {
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
        <button
          style={{
            height: 40, borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: grotesk, fontWeight: 500, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'border-color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.muted)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
        >
          📝 Download Markdown
        </button>
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

function Results({ target, onModal }: { target: string; onModal: () => void }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Finding | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = FINDINGS.filter(f => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return f.verdict === 'confirmed'
    if (filter === 'verify') return f.verdict === 'verify'
    if (filter === 'fp') return f.verdict === 'fp'
    return true
  })

  const counts = {
    confirmed: FINDINGS.filter(f => f.verdict === 'confirmed').length,
    verify: FINDINGS.filter(f => f.verdict === 'verify').length,
    fp: FINDINGS.filter(f => f.verdict === 'fp').length,
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `ALL (${FINDINGS.length})` },
    { key: 'confirmed', label: `✅ CONFIRMED (${counts.confirmed})` },
    { key: 'verify', label: `⚠ VERIFY (${counts.verify})` },
    { key: 'fp', label: `❌ FALSE POSITIVE (${counts.fp})` },
  ]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Summary bar */}
      <div style={{
        background: C.bgSecondary, borderBottom: `1px solid ${C.border}`,
        height: 80, display: 'flex', alignItems: 'center',
      }}>
        {[
          { label: 'TARGET', value: target, color: C.cyan, mono: true },
          { label: 'SCAN DATE', value: '2026-07-19', color: C.textPrimary, mono: true },
          { label: 'DURATION', value: '45 sec', color: C.textPrimary, mono: true },
          { label: 'CONFIRMED', value: '3', color: C.green, big: true },
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
        display: 'grid', gridTemplateColumns: '65% 35%', gap: 0,
        height: 'calc(100vh - 64px - 80px)',
      }}>
        {/* Left: findings */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>
          {/* Header row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              VULNERABILITY FINDINGS
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    fontFamily: mono, fontSize: 10, padding: '4px 10px', borderRadius: 4,
                    cursor: 'pointer', border: `1px solid ${filter === f.key ? C.green : C.border}`,
                    background: filter === f.key ? C.green : 'transparent',
                    color: filter === f.key ? C.bgPrimary : C.muted,
                    transition: 'all 150ms',
                  }}
                >
                  {f.label}
                </button>
              ))}
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
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((f, i) => {
              const isSelected = selected?.id === f.id
              const isHovered = hovered === f.id
              return (
                <div
                  key={f.id}
                  className="finding-row-enter"
                  onClick={() => setSelected(isSelected ? null : f)}
                  onMouseEnter={() => setHovered(f.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 90px 160px 110px 120px',
                    padding: '0 24px', height: 52, alignItems: 'center',
                    cursor: 'pointer', position: 'relative',
                    background: isSelected ? C.bgTertiary : isHovered ? '#0d0d18' : 'transparent',
                    borderBottom: `1px solid ${C.border}`,
                    opacity: f.verdict === 'fp' ? 0.6 : 1,
                    animationDelay: `${i * 80}ms`,
                    transition: 'background 150ms',
                  }}
                >
                  {/* Left accent bar */}
                  {(isSelected || isHovered) && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                      background: isSelected ? C.green : C.muted,
                      borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{f.id}</span>
                  <span style={{ fontFamily: inter, fontWeight: 600, fontSize: 13, color: C.textPrimary }}>{f.type}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: C.cyan }}>{f.endpoint}</span>
                  <VerdictBadge verdict={f.verdict} />
                  <SeverityBadge severity={f.severity} />
                  <PriorityBadge priority={f.priority} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: AI panel */}
        <div style={{ padding: '20px 20px 20px 20px', overflowY: 'auto' }}>
          <AIPanel finding={selected} onDownloadPdf={onModal} />
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: PDF Modal ──────────────────────────────────────────────────────
function PdfModal({ target, onClose }: { target: string; onClose: () => void }) {
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
            <div style={{ background: '#0A0A0F', padding: '48px 56px', minHeight: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                <img
                  src={finalLogo}
                  alt="0xVerdict"
                  style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.5))' }}
                />
                <div>
                  <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 28, color: '#fff' }}>
                    <span style={{ color: '#00FF88' }}>0x</span>Verdict
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#8892A4' }}>AI Security Intelligence Platform</div>
                </div>
              </div>

              <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: '#F0F0F0', marginBottom: 32, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Vulnerability Assessment Report
              </div>

              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 48 }}>
                {[
                  ['Target URL', target],
                  ['Scan Date', '2026-07-19'],
                  ['Scan Status', 'Completed'],
                  ['Duration', '45 seconds'],
                  ['Generated By', '0xVerdict AI Engine v1.0.0'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontFamily: mono, fontSize: 11, color: '#8892A4', padding: '6px 0', width: 160 }}>{k}:</td>
                    <td style={{ fontFamily: mono, fontSize: 11, color: '#F0F0F0', padding: '6px 0' }}>{v}</td>
                  </tr>
                ))}
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                {[
                  { label: 'CRITICAL', count: 1, color: '#FF3366' },
                  { label: 'HIGH', count: 2, color: '#FFB800' },
                  { label: 'MEDIUM', count: 3, color: '#7B61FF' },
                  { label: 'LOW', count: 1, color: '#8892A4' },
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
                An automated vulnerability assessment was conducted against <strong>{target}</strong> on 2026-07-19. The scan identified <strong>5 potential security issues</strong>, of which <strong>3 were confirmed</strong> by the AI Verdict Engine, <strong>1 requires manual verification</strong>, and <strong>1 was classified as a likely false positive</strong>. Immediate remediation is recommended for the confirmed SQL Injection vulnerability due to potential database compromise risk.
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
                    {['5', '3', '1', '1'].map((v, i) => (
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
                    {['1', '2', '1', '1'].map((v, i) => (
                      <td key={i} style={{ padding: '10px 16px', border: '1px solid #e0e0e0', color: '#555' }}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Finding detail */}
            {FINDINGS.filter(f => f.verdict === 'confirmed').map(f => (
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
          <button style={{
            height: 40, padding: '0 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.green, color: C.bgPrimary, fontFamily: grotesk, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>📥 Download PDF</button>
          <button style={{
            height: 40, padding: '0 20px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: grotesk, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>📝 Download Markdown</button>
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

// ─── App shell ────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'scanning' | 'results'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [target, setTarget] = useState('http://localhost:3000')
  const [showModal, setShowModal] = useState(false)

  const navStatus: NavStatus = screen === 'landing' ? 'idle' : screen === 'scanning' ? 'scanning' : 'complete'

  const handleScan = useCallback((url: string) => {
    setTarget(url)
    setScreen('scanning')
  }, [])

  const handleScanComplete = useCallback(() => {
    setScreen('results')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bgPrimary }}>
      <Background />
      <Navbar status={navStatus} />
      {screen === 'landing' && <Landing onScan={handleScan} />}
      {screen === 'scanning' && <Scanning target={target} onComplete={handleScanComplete} />}
      {screen === 'results' && <Results target={target} onModal={() => setShowModal(true)} />}
      {showModal && <PdfModal target={target} onClose={() => setShowModal(false)} />}
    </div>
  )
}
