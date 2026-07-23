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
      'Open DevTools \u2192 Network tab \u2192 select any page response.',
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
    confidenceReason: 'Testing on localhost \u2014 HSTS is typically not applicable to local environments.',
    rootCause: 'Strict-Transport-Security header not configured in server response.',
    devExplanation: 'HSTS forces HTTPS connections, preventing protocol downgrade attacks.',
    fixRecommendation: 'Add HSTS header in production HTTPS configuration only.',
    remediationCode: "app.use((req, res, next) => {\n  res.setHeader('Strict-Transport-Security',\n    'max-age=31536000; includeSubDomains');\n  next();\n});",
    manualSteps: [
      'Test against a production HTTPS endpoint, not localhost.',
      'Check for Strict-Transport-Security in response headers.',
      'Verify max-age value meets minimum 1-year requirement.',
    ],
    priorityNote: 'Verify in production environment \u2014 likely a false positive on localhost.',
  },
  {
    id: 'vuln_005', type: 'Reflected XSS', endpoint: '/register',
    verdict: 'fp', severity: 'medium', scannerSeverity: 'MEDIUM', aiSeverity: 'LOW',
    priority: 'low', confidence: 'LOW',
    priorityReason: 'Payload was not reflected \u2014 likely framework auto-encoding.',
    confidenceReason: 'Modern framework auto-escapes template output, no reflection observed.',
    rootCause: 'Scanner triggered on parameter presence, not actual reflection.',
    devExplanation: 'The registration form uses a framework that auto-escapes all template variables.',
    fixRecommendation: 'No action required \u2014 framework encoding provides sufficient protection.',
    remediationCode: "// Framework handles escaping automatically\n// Verify template engine version is up to date",
    manualSteps: [
      'Manually test /register with XSS payload in each field.',
      'Verify all payloads are properly escaped in response.',
      'Confirm framework version has no known encoding bypass.',
    ],
    priorityNote: 'False positive \u2014 scanner triggered on parameter; framework protects output.',
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
  { text: '> [SCANNER] Testing /login \u2192 username param...', color: C.orange, bold: false },
  { text: "> [SCANNER] Payload: ' OR 1=1--", color: C.orange, bold: false },
  { text: '> [!!] SQL ERROR DETECTED at /login', color: C.red, bold: true },
  { text: '> [!!] Evidence: MySQL syntax error near OR 1=1...', color: C.red, bold: false },
  { text: '', color: '', bold: false },
  { text: '> [SCANNER] Initializing XSS tests...', color: C.orange, bold: false },
  { text: '> [SCANNER] Testing /search \u2192 q param...', color: C.orange, bold: false },
  { text: '> [SCANNER] Payload: <script>alert(1)</script>', color: C.orange, bold: false },
  { text: '> [!!] XSS REFLECTION DETECTED at /search', color: C.red, bold: true },
  { text: '', color: '', bold: false },
  { text: '> [AI ENGINE] Packaging raw findings...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Sending to AI Verdict Engine...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Analyzing 5 findings...', color: C.cyan, bold: false },
  { text: '> [AI ENGINE] Processing...', color: C.cyan, bold: false },
  { text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591  80%', color: C.cyan, bold: false },
]

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

function Background({ isDashboard }: { isDashboard: boolean }) {
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
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 6,
      duration: 3 + Math.random() * 5,
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

      {/* Blinking hacker node particles */}
      {hackerNodes.map(node => (
        <div
          key={node.id}
          className="pulse-dot"
          style={{
            position: 'absolute',
            left: `${node.left}%`,
            top: `${node.top}%`,
            width: node.size,
            height: node.size,
            borderRadius: '50%',
            background: node.id % 2 === 0 ? C.green : C.cyan,
            boxShadow: `0 0 10px ${node.id % 2 === 0 ? C.green : C.cyan}`,
            opacity: isDashboard ? 0.35 : 0.22,
            animationDelay: `${node.delay}s`,
            animationDuration: `${node.duration}s`,
          }}
        />
      ))}

      {/* Cyber text scroll overlays at sides */}
      <>
        <div style={{ position: 'absolute', left: 24, top: 80, bottom: 80, width: 220 }}>
          <HackerStreams isDashboard={isDashboard} />
        </div>
        <div style={{ position: 'absolute', right: 24, top: 80, bottom: 80, width: 220 }}>
          <HackerStreams isDashboard={isDashboard} />
        </div>
      </>

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
type AIStatus = 'active' | 'thinking' | 'idle'

function Navbar({ status, aiStatus }: { status: NavStatus; aiStatus: AIStatus }) {
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
    <nav className="nav-glow" style={{
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
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: C.green }}>0x</span>
            <span style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 22, color: C.textPrimary }}>Verdict</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
            &gt; AI Security Analyst
            <span style={{ color: C.green, opacity: cursorOn ? 1 : 0, transition: 'opacity 50ms' }}>\u258b</span>
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

        {/* AI Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
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
              fontFamily: mono, fontSize: 10,
              color: aiConfig.labelColor,
              letterSpacing: '0.04em',
            }}>
              {aiConfig.label}
            </span>
          </div>
        </div>

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
  const [scanDepth, setScanDepth] = useState<'light' | 'medium' | 'deep'>('medium')
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
      padding: '80px 24px 70px', position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 680, textAlign: 'center' }}>

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

        {/* Pre-title */}
        <div style={{
          fontFamily: mono, fontSize: 12, color: C.green,
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          opacity: visible ? 1 : 0, transition: 'opacity 300ms',
          minHeight: 18,
        }}>
          <span>{displayed}</span>
          <span style={{ opacity: displayed.length >= preTitleText.length ? (cursorOn ? 1 : 0) : 1, color: C.green }}>\u258b</span>
        </div>

        {/* Main headline */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 400ms 400ms, transform 400ms 400ms ease-out',
        }}>
          <div className="glitch-text" style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1, color: C.textPrimary, position: 'relative' }}>
            <span data-text="Scan Smarter.">Scan Smarter.</span>
          </div>
          <div className="glitch-text" style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1, color: C.green, position: 'relative' }}>
            <span data-text="Get Verdicts.">Get Verdicts.</span>
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
          <div className="hover-card" style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 6 }}>Traditional Scanner</div>
            <div style={{ fontFamily: inter, fontSize: 12, color: C.red }}>Raw findings \u2192 Developer confused</div>
          </div>
          <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 32, color: C.green }}>\u2192</div>
          <div className="hover-card" style={{ background: 'rgba(0,255,136,0.04)', border: `1px solid rgba(0,255,136,0.2)`, borderRadius: 8, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🤖</div>
            <div style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13, color: C.textPrimary, marginBottom: 6 }}>0xVerdict</div>
            <div style={{ fontFamily: inter, fontSize: 12, color: C.green }}>AI Verdict \u2192 Root Cause \u2192 Fix \u2192 Report</div>
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
              placeholder="http://localhost:3000  \u2014  enter authorized target URL"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: mono, fontSize: 14,
                color: C.textPrimary, caretColor: C.green,
              }}
            />
            <div style={{ width: 1, height: 36, background: C.border, marginRight: 0 }} />
            <button
              onClick={handleScan}
              className="hover-glow"
              style={{
                height: '100%', width: 100, background: C.green,
                border: 'none', cursor: 'pointer', borderRadius: '0 7px 7px 0',
                fontFamily: mono, fontWeight: 700, fontSize: 13, color: C.bgPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              data-hover="true"
            >
              SCAN \u25b6
            </button>
          </div>

          {/* Scan Depth Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, justifyContent: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>SCAN DEPTH:</span>
            {[
              { key: 'light' as const, label: 'LIGHT', desc: 'Quick header check', color: C.green },
              { key: 'medium' as const, label: 'MEDIUM', desc: 'Standard analysis', color: C.orange },
              { key: 'deep' as const, label: 'DEEP', desc: 'Full exploit test', color: C.red },
            ].map(d => (
              <button
                key={d.key}
                onClick={() => setScanDepth(d.key)}
                className="hover-glow"
                style={{
                  fontFamily: mono, fontSize: 10, padding: '6px 14px', borderRadius: 6,
                  cursor: 'pointer',
                  border: `1px solid ${scanDepth === d.key ? d.color : C.border}`,
                  background: scanDepth === d.key ? `${d.color}18` : 'transparent',
                  color: scanDepth === d.key ? d.color : C.muted,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  minWidth: 80,
                }}
                data-hover="true"
              >
                <span style={{ fontWeight: 700 }}>{d.label}</span>
                <span style={{ fontSize: 8, opacity: 0.7 }}>{d.desc}</span>
              </button>
            ))}
          </div>

          {/* Quick-fill pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ fontFamily: inter, fontSize: 11, color: C.muted }}>Test environments:</span>
            {pills.map(pill => (
              <button
                key={pill}
                onClick={() => setUrl(pill.includes('localhost') ? 'http://localhost:3000' : 'http://testphp.vulnweb.com')}
                className="hover-glow"
                style={{
                  fontFamily: inter, fontSize: 11, color: C.muted,
                  border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px',
                  background: 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                data-hover="true"
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
              label: null, title: '3 Vulnerability Types', body: 'Header Security \u00b7 SQL Injection \u00b7 Reflected XSS',
              border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: '1300ms',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              ),
              label: '\u2B50 CORE FEATURE', title: 'AI Verdict Engine', body: 'Confirmed \u00b7 Needs Verification \u00b7 Likely False Positive',
              border: 'rgba(0,212,255,0.3)', bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.cyan, delay: '1380ms',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              ),
              label: null, title: 'Developer Reports', body: 'Markdown Export \u00b7 Professional PDF \u00b7 Cover Page',
              border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: '1460ms',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="hover-card"
              style={{
                background: card.bg, border: `1px solid ${card.border}`, borderRadius: 8, padding: 20,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 250ms ${card.delay}, transform 250ms ${card.delay} ease-out, border-color 300ms, box-shadow 300ms`,
              }}
              data-hover="true"
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
        padding: '12px 24px', textAlign: 'center', zIndex: 10,
        opacity: visible ? 1 : 0, transition: 'opacity 300ms 1500ms',
      }}>
        <p style={{ fontFamily: inter, fontSize: 10, color: C.muted, lineHeight: 1.4, maxWidth: 800, margin: '0 auto' }}>
          \u26A0 NOTICE: This tool is intended exclusively for authorized security testing environments. Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
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

    setTimeout(() => setPipelineStep(1), 2500)
    setTimeout(() => setPipelineStep(2), 5000)

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

      <div style={{
        display: 'grid', gridTemplateColumns: '62% 38%', gap: 16,
        padding: '24px 32px', height: 'calc(100vh - 64px - 52px)',
      }}>
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
                      {step.state === 'complete' && <span style={{ color: C.green, fontSize: 12 }}>\u2713</span>}
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
    confirmed: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.4)', text: C.green, label: '\u2705 CONFIRMED' },
    verify: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.4)', text: C.orange, label: '\u26A0 NEEDS VERIFICATION' },
    fp: { bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)', text: C.red, label: '\u274C LIKELY FALSE POSITIVE' },
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
    immediate: { bg: 'rgba(255,51,102,0.08)', border: C.red, text: C.red, label: '\u26A1 IMMEDIATE' },
    high: { bg: 'rgba(255,184,0,0.08)', border: C.orange, text: C.orange, label: '🔺 HIGH' },
    normal: { bg: 'rgba(123,97,255,0.08)', border: C.purple, text: C.purple, label: '\u2014 NORMAL' },
    low: { bg: 'rgba(136,146,164,0.08)', border: C.muted, text: C.muted, label: '\u2193 LOW' },
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
// ─── AI Analysis Panel ────────────────────────────────────────────────────────
function AIPanel({ finding, onDownloadPdf }: { finding: Finding | null; onDownloadPdf: () => void }) {
  const [lang, setLang] = useState<'Node.js' | 'Python' | 'PHP'>('Node.js')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (finding) {
      navigator.clipboard.writeText(finding.remediationCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!finding) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: 24, border: `1px dashed ${C.border}`, borderRadius: 8,
        background: 'rgba(10, 10, 15, 0.2)',
      }}>
        <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pulse-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,255,136,0.05)', border: `1px solid rgba(0,255,136,0.1)` }} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>
            // SELECT_VULN_TARGET
          </div>
          <div style={{ fontFamily: inter, fontSize: 12, color: C.muted, marginTop: 4 }}>
            Click any finding on the list to load AI Verdict & Remediation Stream.
          </div>
        </div>
      </div>
    )
  }

  const confidenceFilled = { HIGH: 3, MEDIUM: 2, LOW: 1 }[finding.confidence]

  return (
    <div className="ai-panel-enter cyber-scroll" style={{ overflowY: 'auto', height: '100%', paddingRight: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
        <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>//_SYSTEM_DIAGNOSTICS_STREAM</span>
        <span style={{
          fontFamily: mono, fontSize: 9, color: C.cyan,
          border: `1px solid rgba(0,212,255,0.3)`, borderRadius: 4, padding: '2px 8px',
          background: 'rgba(0,212,255,0.05)',
        }}>{finding.id}</span>
      </div>

      {/* Verdict */}
      <Section label="AI VERDICT">
        <div style={{
          background: 'rgba(15, 15, 26, 0.4)',
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: '12px 16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          width: '100%',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: finding.verdict === 'confirmed'
              ? 'radial-gradient(circle at 10% 50%, rgba(0,255,136,0.15), transparent 70%)'
              : finding.verdict === 'verify'
              ? 'radial-gradient(circle at 10% 50%, rgba(255,184,0,0.15), transparent 70%)'
              : 'radial-gradient(circle at 10% 50%, rgba(255,51,102,0.15), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <span style={{
            fontFamily: grotesk, fontWeight: 700, fontSize: 16,
            color: finding.verdict === 'confirmed' ? C.green : finding.verdict === 'verify' ? C.orange : C.red,
            textShadow: `0 0 10px ${finding.verdict === 'confirmed' ? C.green : finding.verdict === 'verify' ? C.orange : C.red}40`,
            position: 'relative',
          }}>
            {finding.verdict === 'confirmed' && '✅ CONFIRMED VERDICT'}
            {finding.verdict === 'verify' && '⚠️ NEEDS VERIFICATION'}
            {finding.verdict === 'fp' && '❌ LIKELY FALSE POSITIVE'}
          </span>
        </div>
      </Section>

      {/* Severity reclassification */}
      {finding.scannerSeverity !== finding.aiSeverity && (
        <Section label="SEVERITY RECLASSIFICATION">
          <div style={{
            background: 'rgba(255,51,102,0.04)',
            border: `1px solid rgba(255,51,102,0.25)`,
            borderRadius: 6,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, textDecoration: 'line-through' }}>
                {finding.scannerSeverity}
              </span>
              <span style={{ fontFamily: mono, fontSize: 12, color: C.red }}>→</span>
              <span style={{
                fontFamily: mono, fontWeight: 700, fontSize: 13, color: C.red,
                textShadow: `0 0 8px ${C.red}40`
              }}>{finding.aiSeverity}</span>
            </div>
            <span style={{ fontFamily: mono, fontSize: 8, color: C.red, background: 'rgba(255,51,102,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em' }}>
              AI_UPGRADED_THREAT
            </span>
          </div>
        </Section>
      )}

      {/* Priority */}
      <Section label="PRIORITY">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <PriorityBadge priority={finding.priority} />
        </div>
        <p style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{finding.priorityReason}</p>
      </Section>

      {/* Confidence */}
      <Section label="CONFIDENCE">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: C.green }}>{finding.confidence}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: 20, height: 6, borderRadius: 1,
                background: n <= confidenceFilled ? C.green : C.border,
                boxShadow: n <= confidenceFilled ? `0 0 8px ${C.green}50` : 'none',
                transition: 'background 300ms',
              }} />
            ))}
          </div>
        </div>
        <p style={{ fontFamily: inter, fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{finding.confidenceReason}</p>
      </Section>

      <div style={{ height: 1, background: C.border, margin: '16px 0' }} />

      {/* Root cause */}
      <Section label="ROOT CAUSE">
        <p style={{ fontFamily: inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6, background: 'rgba(255,255,255,0.01)', border: `1px solid ${C.border}`, padding: 12, borderRadius: 6 }}>
          {finding.rootCause}
        </p>
      </Section>

      {/* Dev explanation */}
      <Section label="DEVELOPER EXPLANATION">
        <p style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.6, padding: '0 4px' }}>{finding.devExplanation}</p>
      </Section>

      {/* Fix recommendation */}
      <Section label="FIX RECOMMENDATION">
        <div style={{
          borderLeft: `3px solid ${C.green}`,
          background: 'rgba(0,255,136,0.03)',
          borderTop: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          borderRadius: '0 6px 6px 0',
          padding: '12px 16px',
        }}>
          <p style={{ fontFamily: inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{finding.fixRecommendation}</p>
        </div>
      </Section>

      {/* Code block */}
      <Section label="SECURE CODE EXAMPLE">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['Node.js', 'Python', 'PHP'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  fontFamily: mono, fontSize: 10, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '6px 12px',
                  color: lang === l ? C.green : C.muted,
                  borderBottom: `2px solid ${lang === l ? C.green : 'transparent'}`,
                  transition: 'all 150ms',
                  fontWeight: lang === l ? 700 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '4px 8px', fontFamily: mono, fontSize: 9,
              color: copied ? C.green : C.muted, cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = copied ? C.green : C.muted }}
          >
            {copied ? '✓ COPIED' : '⧉ COPY'}
          </button>
        </div>
        <div style={{
          background: C.bgInput, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.green}`, borderRadius: '0 6px 6px 0',
          padding: 16, position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.borderStrong, userSelect: 'none', lineHeight: '20px', textAlign: 'right', minWidth: 16 }}>
              {finding.remediationCode.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre style={{ fontFamily: mono, fontSize: 11, color: C.green, lineHeight: '20px', margin: 0, overflow: 'auto', flex: 1 }}>
              {finding.remediationCode}
            </pre>
          </div>
        </div>
      </Section>

      {/* Manual verification */}
      <Section label="MANUAL VERIFICATION">
        <div style={{
          background: 'rgba(0,212,255,0.02)', border: `1px solid rgba(0,212,255,0.15)`,
          borderRadius: 6, padding: '16px',
        }}>
          {finding.manualSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < finding.manualSteps.length - 1 ? 12 : 0, alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: mono, fontSize: 9, color: C.cyan,
                background: 'rgba(0,212,255,0.1)', width: 18, height: 18,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: `1px solid rgba(0,212,255,0.2)`
              }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Priority note */}
      <Section label="">
        <div style={{
          background: 'rgba(255,184,0,0.03)', borderLeft: `3px solid ${C.orange}`,
          borderTop: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          borderRadius: '0 6px 6px 0', padding: '12px 16px',
        }}>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>⚠️ {finding.priorityNote}</p>
        </div>
      </Section>

      {/* Download buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        <button
          onClick={onDownloadPdf}
          className="hover-glow"
          style={{
            height: 44, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.green, color: C.bgPrimary,
            fontFamily: grotesk, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 4px 14px ${C.green}30`,
          }}
          data-hover="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          DOWNLOAD PDF REPORT
        </button>
        <button
          className="hover-glow"
          style={{
            height: 40, borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: grotesk, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          data-hover="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
          DOWNLOAD MARKDOWN
        </button>
        <p style={{ fontFamily: mono, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: '0.05em' }}>
          // AUTHORIZED_ACCESS_ONLY // SEC_INTEL_V1
        </p>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 8, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          //_{label}
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
    { key: 'confirmed', label: `CONFIRMED (${counts.confirmed})` },
    { key: 'verify', label: `VERIFY (${counts.verify})` },
    { key: 'fp', label: `FALSE POSITIVE (${counts.fp})` },
  ]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Summary bar */}
      <div style={{
        background: 'rgba(15, 15, 26, 0.85)',
        borderBottom: `1px solid ${C.border}`,
        height: 56, display: 'flex', alignItems: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {[
          {
            label: 'TARGET',
            value: target,
            color: C.cyan,
            mono: true,
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )
          },
          {
            label: 'SCAN DATE',
            value: '2026-07-19',
            color: C.textPrimary,
            mono: true,
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            )
          },
          {
            label: 'DURATION',
            value: '45 sec',
            color: C.textPrimary,
            mono: true,
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            )
          },
          {
            label: 'CONFIRMED',
            value: '3',
            color: C.green,
            big: true,
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            )
          },
          {
            label: 'STATUS',
            value: 'COMPLETED',
            color: C.green,
            mono: true,
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            )
          },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              height: '100%', padding: '0 16px',
              transition: 'background 200ms',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {stat.icon}
              <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>
                //_{stat.label}
              </span>
            </div>
            <div style={{
              fontFamily: stat.mono ? mono : grotesk,
              fontWeight: stat.big ? 700 : 400,
              fontSize: stat.big ? 18 : 12,
              color: stat.color,
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textShadow: stat.color === C.green || stat.color === C.cyan ? `0 0 8px ${stat.color}40` : 'none',
            }}>
              {stat.label === 'STATUS' && <span style={{ color: C.green, marginRight: 4 }}>●</span>}
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
            <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>
              //_VULNERABILITY_FINDINGS
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
            padding: '0 24px', height: 38, alignItems: 'center',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
            background: 'rgba(10, 10, 15, 0.5)',
          }}>
            {['ID', 'VULNERABILITY', 'ENDPOINT', 'AI VERDICT', 'SEVERITY', 'PRIORITY'].map(h => (
              <span key={h} style={{ fontFamily: mono, fontWeight: 600, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>
                //_{h}
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
          <AIPanel finding={selected} onDownloadPdf={onModal} />
        </div>
      </div>
    </div>
  )
}
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
            \u2715 Close
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#e8e8e8', padding: 32 }}>
          <div style={{
            width: '100%', maxWidth: 794, margin: '0 auto',
            background: '#fff', boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
            fontFamily: "'Georgia', serif",
          }}>
            <div style={{ background: '#0A0A0F', padding: '48px 56px', minHeight: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                <img
                  src={finalLogo}
                  alt="0xVerdict"
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.5))' }}
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

            <div style={{ padding: '48px 56px', borderBottom: '1px solid #ddd' }}>
              <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 24, color: '#111', marginBottom: 16, fontWeight: 700 }}>Executive Summary</h1>
              <p style={{ fontFamily: inter, fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 24 }}>
                An automated vulnerability assessment was conducted against <strong>{target}</strong> on 2026-07-19. The scan identified <strong>5 potential security issues</strong>, of which <strong>3 were confirmed</strong> by the AI Verdict Engine, <strong>1 requires manual verification</strong>, and <strong>1 was classified as a likely false positive</strong>. Immediate remediation is recommended for the confirmed SQL Injection vulnerability due to potential database compromise risk.
              </p>
            </div>

            {FINDINGS.filter(f => f.verdict === 'confirmed').map(f => (
              <div key={f.id} style={{ padding: '40px 56px', borderBottom: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 4 }}>{f.id}</div>
                    <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 20, color: '#111', fontWeight: 700 }}>{f.type}</h2>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: inter, fontSize: 12, color: '#555' }}>
                    <div>Endpoint: <strong style={{ fontFamily: mono }}>{f.endpoint}</strong></div>
                    <div>AI Verdict: <strong style={{ color: '#00AA55' }}>{'\u2705'} CONFIRMED</strong></div>
                  </div>
                </div>

                <div style={{ background: '#fff8f8', border: '1px solid #ffcccc', borderRadius: 4, padding: '8px 14px', marginBottom: 16, fontFamily: inter, fontSize: 12, color: '#cc3333' }}>
                  Scanner Severity: <s>{f.scannerSeverity}</s> {'\u2192'} AI Classified: <strong>{f.aiSeverity}</strong>
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

            <div style={{ padding: '24px 56px', background: '#f9f9f9' }}>
              <p style={{ fontFamily: inter, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                NOTICE: This tool is intended exclusively for authorized security testing environments (e.g., OWASP Juice Shop, DVWA, or infrastructure where explicit written permission has been granted). Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
              </p>
            </div>
          </div>
        </div>

        <div style={{
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          borderTop: `1px solid ${C.border}`, padding: '0 24px', flexShrink: 0,
        }}>
          <button style={{
            height: 40, padding: '0 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.green, color: C.bgPrimary, fontFamily: grotesk, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>{'\u{1F4E5}'} Download PDF</button>
          <button style={{
            height: 40, padding: '0 20px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: grotesk, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>{'\u{1F4DD}'} Download Markdown</button>
          <button
            onClick={onClose}
            style={{
              height: 40, padding: '0 20px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.muted, fontFamily: grotesk, fontSize: 13,
            }}
          >{'\u2715'} Close Preview</button>
        </div>
      </div>
    </div>
  )
}

// ─── Cursor Follower ──────────────────────────────────────────────────────────
function CursorFollower() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [target, setTarget] = useState({ x: -100, y: -100 })
  const [hovered, setHovered] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setTarget({ x: e.clientX, y: e.clientY })
    }
    const handleOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)
      if (t.closest('button, a, input, [data-hover]')) setHovered(true)
    }
    const handleOut = () => setHovered(false)
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const animate = () => {
      setPos(p => ({
        x: p.x + (target.x - p.x) * 0.35,
        y: p.y + (target.y - p.y) * 0.35,
      }))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target])

  return (
    <>
      <div className="cursor-follower" style={{
        position: 'fixed', left: pos.x - 12, top: pos.y - 12,
        width: 24, height: 24, borderRadius: '50%',
        border: `1.5px solid ${hovered ? C.green : 'rgba(0,255,136,0.5)'}`,
        transform: hovered ? 'scale(1.6)' : 'scale(1)',
        transition: 'border-color 80ms, transform 80ms',
        pointerEvents: 'none', zIndex: 9999,
        boxShadow: hovered
          ? '0 0 12px rgba(0,255,136,0.3), inset 0 0 12px rgba(0,255,136,0.05)'
          : '0 0 6px rgba(0,255,136,0.15)',
      }} />
      <div style={{
        position: 'fixed', left: pos.x - 2, top: pos.y - 2,
        width: 4, height: 4, borderRadius: '50%',
        background: C.green,
        transform: hovered ? 'scale(1.8)' : 'scale(1)',
        transition: 'transform 80ms',
        pointerEvents: 'none', zIndex: 9999,
        boxShadow: `0 0 6px ${C.green}`,
      }} />
    </>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────
type Screen = 'landing' | 'scanning' | 'results'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [target, setTarget] = useState('http://localhost:3000')
  const [showModal, setShowModal] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus>('active')

  useEffect(() => {
    if (screen === 'scanning') {
      setAiStatus('thinking')
    } else {
      setAiStatus('active')
    }
  }, [screen])

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
      <CursorFollower />
      <Background isDashboard={screen === 'results'} />
      <Navbar status={navStatus} aiStatus={aiStatus} />
      {screen === 'landing' && <Landing onScan={handleScan} />}
      {screen === 'scanning' && <Scanning target={target} onComplete={handleScanComplete} />}
      {screen === 'results' && <Results target={target} onModal={() => setShowModal(true)} />}
      {showModal && <PdfModal target={target} onClose={() => setShowModal(false)} />}
    </div>
  )
}
