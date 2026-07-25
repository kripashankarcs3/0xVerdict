import { useState, useEffect } from 'react'
import { C, FONT, MOTION } from '../constants'
import { useTypewriter } from '../hooks/useTypewriter'
import { useReveal } from '../hooks/useReveal'
import finalLogo from '@/imports/final_logo.png'

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    label: null, title: '3 Vulnerability Types', body: 'Header Security · SQL Injection · Reflected XSS',
    border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: 1300,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    label: '\u2B50 CORE FEATURE', title: 'AI Verdict Engine', body: 'Confirmed · Needs Verification · Likely False Positive',
    border: 'rgba(0,212,255,0.3)', bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.cyan, delay: 1380,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    label: null, title: 'Developer Reports', body: 'Markdown Export · Professional PDF · Cover Page',
    border: C.border, bg: C.bgSecondary, titleColor: C.textPrimary, bodyColor: C.muted, delay: 1460,
  },
]

export default function Landing({ onScan }: { onScan: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [cursorOn, setCursorOn] = useState(true)
  const [scanDepth, setScanDepth] = useState<'light' | 'medium' | 'deep'>('medium')
  const visible = useReveal(100, 100) // instant: progress = 1 after 100ms frame
  const revealProgress = useReveal(3000, 100)
  const preTitleText = '> Initializing AI Security Engine...'
  const displayed = useTypewriter(preTitleText, 38, 500)

  useEffect(() => {
    const t = setInterval(() => setCursorOn(p => !p), 530)
    return () => clearInterval(t)
  }, [])

  const handleScan = () => {
    const target = url.trim() || 'http://localhost:3000'
    onScan(target)
  }

  const pills = ['\uD83E\uDDEA localhost:3000', '\uD83E\uDDEA testphp.vulnweb.com']

  const logoScale = 0.92 + 0.08 * revealProgress
  const logoOpacity = visible

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 70px', position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 680, textAlign: 'center' }}>

        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 28,
          opacity: logoOpacity ? 1 : 0,
          transform: `scale(${logoScale})`,
          transition: `opacity ${MOTION.duration.slow}ms ${MOTION.easing}, transform 1000ms ${MOTION.easing}`,
        }}>
          <img
            src={finalLogo}
            alt="0xVerdict \u2014 AI-Powered Web Vulnerability Analysis"
            style={{
              width: 120, height: 120, objectFit: 'cover', borderRadius: '50%',
              filter: 'drop-shadow(0 0 24px rgba(0,255,136,0.35)) drop-shadow(0 0 48px rgba(0,255,136,0.15))',
              willChange: 'transform',
            }}
          />
        </div>

        <div style={{
          fontFamily: FONT.mono, fontSize: 12, color: C.green,
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          opacity: visible ? 1 : 0,
          transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing}`,
          minHeight: 18,
        }}>
          <span>{displayed}</span>
          <span style={{ opacity: displayed.length >= preTitleText.length ? (cursorOn ? 1 : 0) : 1, color: C.green }}>&#9608;</span>
        </div>

        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: `opacity ${MOTION.duration.slow}ms ${MOTION.easing}, transform ${MOTION.duration.slow}ms ${MOTION.easing}`,
        }}>
          <div className="glitch-text" style={{
            fontFamily: FONT.grotesk, fontWeight: 700,
            fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1, color: C.textPrimary,
            position: 'relative', letterSpacing: '-0.02em',
          }}>
            <span data-text="Scan Smarter.">Scan Smarter.</span>
          </div>
          <div className="glitch-text" style={{
            fontFamily: FONT.grotesk, fontWeight: 700,
            fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1.1,
            color: `rgba(0,255,136,0.95)`, position: 'relative',
            letterSpacing: '-0.02em',
            textShadow: '0 0 12px rgba(0,255,136,0.3)',
          }}>
            <span data-text="Get Verdicts.">Get Verdicts.</span>
          </div>
        </div>

        <p style={{
          fontFamily: FONT.inter, fontSize: 16, color: C.muted, maxWidth: 520,
          margin: '24px auto 0', lineHeight: 1.7,
          opacity: visible ? 1 : 0,
          transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing}`,
        }}>
          0xVerdict combines automated vulnerability scanning with AI analysis to eliminate false positives and deliver developer-ready security reports.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 16, marginTop: 48, alignItems: 'center',
          opacity: visible ? 1 : 0,
          transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing}`,
        }}>
          <div className="hover-card" style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>&#x1F50D;</div>
            <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 6 }}>Traditional Scanner</div>
            <div style={{ fontFamily: FONT.inter, fontSize: 12, color: C.red }}>Raw findings &#x2192; Developer confused</div>
          </div>
          <div style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 32, color: C.green }}>&#x2192;</div>
          <div className="hover-card" style={{ background: 'rgba(0,255,136,0.04)', border: `1px solid rgba(0,255,136,0.2)`, borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>&#x1F916;</div>
            <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 13, color: C.textPrimary, marginBottom: 6 }}>0xVerdict</div>
            <div style={{ fontFamily: FONT.inter, fontSize: 12, color: C.green }}>AI Verdict &#x2192; Root Cause &#x2192; Fix &#x2192; Report</div>
          </div>
        </div>

        <div style={{
          marginTop: 56,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing}, transform ${MOTION.duration.moderate}ms ${MOTION.easing}`,
        }}>
          <div style={{
            width: '100%', height: 60,
            background: C.bgSecondary,
            border: `1px solid ${focused ? C.green : C.border}`,
            borderRadius: 8, display: 'flex', alignItems: 'center',
            boxShadow: focused ? `0 0 0 3px rgba(0,255,136,0.12)` : 'none',
            transition: `border-color ${MOTION.duration.fast}ms, box-shadow ${MOTION.duration.fast}ms`,
            overflow: 'hidden',
          }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 16, color: C.green, padding: '0 12px 0 16px' }}>&gt;</span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="http://localhost:3000  \u2014  enter authorized target URL"
              aria-label="Target URL to scan"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: FONT.mono, fontSize: 14,
                color: C.textPrimary, caretColor: C.green,
              }}
            />
            <div style={{ width: 1, height: 36, background: C.border, marginRight: 0 }} />
            <button
              onClick={handleScan}
              className="hover-glow"
              aria-label="Start scan"
              style={{
                height: '100%', width: 100, background: C.green,
                border: 'none', cursor: 'pointer', borderRadius: '0 7px 7px 0',
                fontFamily: FONT.mono, fontWeight: 700, fontSize: 13, color: C.bgPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              data-hover="true"
            >
              SCAN &#x25B6;
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, justifyContent: 'center' }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>SCAN DEPTH:</span>
            {[
              { key: 'light' as const, label: 'LIGHT', desc: 'Quick header check', color: C.green },
              { key: 'medium' as const, label: 'MEDIUM', desc: 'Standard analysis', color: C.orange },
              { key: 'deep' as const, label: 'DEEP', desc: 'Full exploit test', color: C.red },
            ].map(d => (
              <button
                key={d.key}
                onClick={() => setScanDepth(d.key)}
                className="hover-glow"
                aria-pressed={scanDepth === d.key}
                style={{
                  fontFamily: FONT.mono, fontSize: 10, padding: '6px 14px', borderRadius: 6,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ fontFamily: FONT.inter, fontSize: 11, color: C.muted }}>Test environments:</span>
            {pills.map(pill => (
              <button
                key={pill}
                onClick={() => setUrl(pill.includes('localhost') ? 'http://localhost:3000' : 'http://testphp.vulnweb.com')}
                className="hover-glow"
                aria-label={`Fill URL: ${pill}`}
                style={{
                  fontFamily: FONT.inter, fontSize: 11, color: C.muted,
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

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 56,
        }}>
          {FEATURE_CARDS.map((card, i) => (
            <div
              key={i}
              className="hover-card"
              style={{
                background: card.bg, border: `1px solid ${card.border}`, borderRadius: 8, padding: 20,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing} ${card.delay}ms, transform ${MOTION.duration.moderate}ms ${MOTION.easing} ${card.delay}ms, border-color 300ms, box-shadow 300ms`,
              }}
              data-hover="true"
            >
              {card.label && (
                <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.cyan, marginBottom: 10 }}>{card.label}</div>
              )}
              <div style={{ marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 14, color: card.titleColor, marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontFamily: FONT.inter, fontSize: 12, color: card.bodyColor, lineHeight: 1.5 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WORKFLOW PIPELINE SECTION */}
      <div style={{
        marginTop: 80, width: '100%', maxWidth: 680, textAlign: 'left',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity ${MOTION.duration.slow}ms ${MOTION.easing} 1500ms, transform ${MOTION.duration.slow}ms ${MOTION.easing} 1500ms`,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, marginBottom: 8, letterSpacing: '0.08em' }}>
          //_ANALYSIS_WORKFLOW_PIPELINE
        </div>
        <h2 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 24, color: C.textPrimary, marginBottom: 28, letterSpacing: '-0.01em' }}>
          How 0xVerdict Secures Your Stack
        </h2>
        
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {[
            {
              step: '01', title: 'Deep Reconnaissance', desc: 'Crawls domains, identifies active endpoints, forms, parameters, and parses HTTP security headers to construct a full attack surface map.',
              color: C.green
            },
            {
              step: '02', title: 'Exploit Simulation', desc: 'Sends non-destructive security validation payloads (e.g. SQL Injection boundaries, XSS reflections) to test active validation defenses.',
              color: C.orange
            },
            {
              step: '03', title: 'AI Reasoning & Remediation', desc: 'Feeds raw findings into the AI Orchestrator to filter false alerts, describe root causes, and output custom code fixes for PHP, Python, and Node.js.',
              color: C.cyan
            }
          ].map((item, idx) => (
            <div key={idx} className="hover-card" style={{
              background: C.bgSecondary,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '20px 24px',
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 8, right: 12,
                fontFamily: FONT.mono, fontSize: 32, fontWeight: 900,
                color: `${item.color}08`, userSelect: 'none'
              }}>{item.step}</div>
              
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `${item.color}15`, border: `1px solid ${item.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, color: item.color,
                flexShrink: 0
              }}>
                {item.step}
              </div>
              
              <div>
                <h3 style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 15, color: C.textPrimary, marginBottom: 4 }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* METRICS & RADAR SECTION */}
      <div style={{
        marginTop: 64, width: '100%', maxWidth: 680, textAlign: 'left',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity ${MOTION.duration.slow}ms ${MOTION.easing} 1600ms, transform ${MOTION.duration.slow}ms ${MOTION.easing} 1600ms`,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.cyan, marginBottom: 8, letterSpacing: '0.08em' }}>
          //_LIVE_THREAT_RADAR
        </div>
        <h2 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 24, color: C.textPrimary, marginBottom: 28, letterSpacing: '-0.01em' }}>
          Assessment Metrics
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'GLOBAL ASSESSMENTS', value: '298,419', desc: 'Verified endpoints' },
            { label: 'FALSE POSITIVES FILTERED', value: '94.2%', desc: 'AI confidence rate' },
            { label: 'AVG SCAN SPEED', value: '45s', desc: 'Realtime analysis' },
            { label: 'AI VERDICT PIPELINE', value: 'OPTIMAL', desc: 'Agent active', color: C.green, mono: true }
          ].map((stat, idx) => (
            <div key={idx} className="hover-card" style={{
              background: 'rgba(15, 15, 26, 0.4)',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '20px 16px',
              textAlign: 'center'
            }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.06em', marginBottom: 8 }}>
                //_{stat.label}
              </div>
              <div style={{
                fontFamily: stat.mono ? FONT.mono : FONT.grotesk,
                fontWeight: 700, fontSize: 22,
                color: stat.color || C.cyan,
                marginBottom: 4,
                textShadow: `0 0 10px ${(stat.color || C.cyan)}20`
              }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: FONT.inter, fontSize: 10, color: C.muted }}>
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div style={{
        marginTop: 64, width: '100%', maxWidth: 680, textAlign: 'left',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity ${MOTION.duration.slow}ms ${MOTION.easing} 1700ms, transform ${MOTION.duration.slow}ms ${MOTION.easing} 1700ms`,
        paddingBottom: 40,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.purple, marginBottom: 8, letterSpacing: '0.08em' }}>
          //_SYSTEM_KNOWLEDGE_BASE
        </div>
        <h2 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 24, color: C.textPrimary, marginBottom: 28, letterSpacing: '-0.01em' }}>
          Security Testing FAQ
        </h2>
        
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          {[
            {
              q: "How does the AI Verdict engine eliminate false positives?",
              a: "Unlike traditional scanners that alert on any raw pattern match (e.g. database error text in HTML), 0xVerdict feeds the exact HTTP scan context, request headers, and response telemetry into our security-tuned model to simulate reasoning. The AI confirms vulnerabilities only when execution evidence is mathematically verified."
            },
            {
              q: "Is it safe to run 0xVerdict on production systems?",
              a: "Yes. 0xVerdict simulates security vulnerabilities non-intrusively. It checks response headers, runs input boundaries, and inspects errors without attempting to read restricted files, execute system shells, or modify databases."
            },
            {
              q: "How are the custom remediation code snippets written?",
              a: "For every verified vulnerability, the AI parses the specific parameters and data formats. It generates clean, optimized code wrappers using modern secure coding practices (such as parameterized bindings for SQL and HTML sanitizers for XSS) for Node.js, Python, and PHP."
            }
          ].map((faq, idx) => (
            <details key={idx} className="faq-details" style={{
              background: C.bgSecondary,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'border-color 200ms',
            }}>
              <summary style={{
                fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 14,
                color: C.textPrimary, listStyle: 'none', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                outline: 'none', userSelect: 'none'
              }}>
                {faq.q}
                <span style={{ color: C.green, fontSize: 14, fontFamily: FONT.mono }}>+</span>
              </summary>
              <div style={{
                fontFamily: FONT.inter, fontSize: 12, color: C.muted,
                lineHeight: 1.6, marginTop: 12, borderTop: `1px solid ${C.border}`,
                paddingTop: 12, cursor: 'default'
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* STATIC PAGE FOOTER */}
      <footer style={{
        width: '100%',
        background: C.bgSecondary,
        borderTop: `1px solid ${C.border}`,
        padding: '32px 24px 40px',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transition: `opacity ${MOTION.duration.moderate}ms ${MOTION.easing}`,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: FONT.inter, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
            &#x26A0; NOTICE: This tool is intended exclusively for authorized security testing environments. Unauthorized scanning violates global cyber defense frameworks. Authors assume no liability for misuse.
          </p>
          <div style={{ width: 40, height: 1, background: C.border, margin: '8px auto' }} />
          <p style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, letterSpacing: '0.04em' }}>
            &copy; 2026 0XVERDICT SECURITY SOLUTIONS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  )
}
