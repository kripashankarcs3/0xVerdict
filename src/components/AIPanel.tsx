import { useState } from 'react'
import { C, FONT, MOTION } from '../constants'
import { PriorityBadge } from './Badges'
import type { Finding } from '../types'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 8, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          //_{label}
        </div>
      )}
      {children}
    </div>
  )
}

export default function AIPanel({ finding, onDownloadPdf }: { finding: Finding | null; onDownloadPdf: () => void }) {
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>
            // SELECT_VULN_TARGET
          </div>
          <div style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, marginTop: 4 }}>
            Click any finding on the list to load AI Verdict & Remediation Stream.
          </div>
        </div>
      </div>
    )
  }

  const confidenceFilled = { HIGH: 3, MEDIUM: 2, LOW: 1 }[finding.confidence]

  return (
    <div className="ai-panel-enter cyber-scroll" style={{ overflowY: 'auto', height: '100%', paddingRight: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
        <span style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>//_SYSTEM_DIAGNOSTICS_STREAM</span>
        <span style={{
          fontFamily: FONT.mono, fontSize: 9, color: C.cyan,
          border: `1px solid rgba(0,212,255,0.3)`, borderRadius: 4, padding: '2px 8px',
          background: 'rgba(0,212,255,0.05)',
        }}>{finding.id}</span>
      </div>

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
            fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 16,
            color: finding.verdict === 'confirmed' ? C.green : finding.verdict === 'verify' ? C.orange : C.red,
            textShadow: `0 0 10px ${finding.verdict === 'confirmed' ? C.green : finding.verdict === 'verify' ? C.orange : C.red}40`,
            position: 'relative',
          }}>
            {finding.verdict === 'confirmed' && '\u2705 CONFIRMED VERDICT'}
            {finding.verdict === 'verify' && '\u26A0\uFE0F NEEDS VERIFICATION'}
            {finding.verdict === 'fp' && '\u274C LIKELY FALSE POSITIVE'}
          </span>
        </div>
      </Section>

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
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted, textDecoration: 'line-through' }}>
                {finding.scannerSeverity}
              </span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.red }}>&#x2192;</span>
              <span style={{
                fontFamily: FONT.mono, fontWeight: 700, fontSize: 13, color: C.red,
                textShadow: `0 0 8px ${C.red}40`
              }}>{finding.aiSeverity}</span>
            </div>
            <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.red, background: 'rgba(255,51,102,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em' }}>
              AI_UPGRADED_THREAT
            </span>
          </div>
        </Section>
      )}

      <Section label="PRIORITY">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <PriorityBadge priority={finding.priority} />
        </div>
        <p style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{finding.priorityReason}</p>
      </Section>

      <Section label="CONFIDENCE">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 12, color: C.green }}>{finding.confidence}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: 20, height: 6, borderRadius: 1,
                background: n <= confidenceFilled ? C.green : C.border,
                boxShadow: n <= confidenceFilled ? `0 0 8px ${C.green}50` : 'none',
                transition: `background ${MOTION.duration.moderate}ms`,
              }} />
            ))}
          </div>
        </div>
        <p style={{ fontFamily: FONT.inter, fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{finding.confidenceReason}</p>
      </Section>

      <div style={{ height: 1, background: C.border, margin: '16px 0' }} />

      <Section label="ROOT CAUSE">
        <p style={{ fontFamily: FONT.inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6, background: 'rgba(255,255,255,0.01)', border: `1px solid ${C.border}`, padding: 12, borderRadius: 6 }}>
          {finding.rootCause}
        </p>
      </Section>

      <Section label="DEVELOPER EXPLANATION">
        <p style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, lineHeight: 1.6, padding: '0 4px' }}>{finding.devExplanation}</p>
      </Section>

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
          <p style={{ fontFamily: FONT.inter, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{finding.fixRecommendation}</p>
        </div>
      </Section>

      <Section label="SECURE CODE EXAMPLE">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['Node.js', 'Python', 'PHP'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  fontFamily: FONT.mono, fontSize: 10, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '6px 12px',
                  color: lang === l ? C.green : C.muted,
                  borderBottom: `2px solid ${lang === l ? C.green : 'transparent'}`,
                  transition: `all ${MOTION.duration.fast}ms`,
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
              borderRadius: 4, padding: '4px 8px', fontFamily: FONT.mono, fontSize: 9,
              color: copied ? C.green : C.muted, cursor: 'pointer',
              transition: `all ${MOTION.duration.normal}ms`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = copied ? C.green : C.muted }}
          >
            {copied ? '\u2713 COPIED' : '\u2B09 COPY'}
          </button>
        </div>
        <div style={{
          background: C.bgInput, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.green}`, borderRadius: '0 6px 6px 0',
          padding: 16, position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.borderStrong, userSelect: 'none', lineHeight: '20px', textAlign: 'right', minWidth: 16 }}>
              {finding.remediationCode.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre style={{ fontFamily: FONT.mono, fontSize: 11, color: C.green, lineHeight: '20px', margin: 0, overflow: 'auto', flex: 1 }}>
              {finding.remediationCode}
            </pre>
          </div>
        </div>
      </Section>

      <Section label="MANUAL VERIFICATION">
        <div style={{
          background: 'rgba(0,212,255,0.02)', border: `1px solid rgba(0,212,255,0.15)`,
          borderRadius: 6, padding: '16px',
        }}>
          {finding.manualSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < finding.manualSteps.length - 1 ? 12 : 0, alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: FONT.mono, fontSize: 9, color: C.cyan,
                background: 'rgba(0,212,255,0.1)', width: 18, height: 18,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: `1px solid rgba(0,212,255,0.2)`
              }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section label="">
        <div style={{
          background: 'rgba(255,184,0,0.03)', borderLeft: `3px solid ${C.orange}`,
          borderTop: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          borderRadius: '0 6px 6px 0', padding: '12px 16px',
        }}>
          <p style={{ fontFamily: FONT.inter, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>&#x26A0;&#xFE0F; {finding.priorityNote}</p>
        </div>
      </Section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        <button
          onClick={onDownloadPdf}
          className="hover-glow"
          style={{
            height: 44, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.green, color: C.bgPrimary,
            fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 4px 14px ${C.green}30`,
          }}
          data-hover="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          DOWNLOAD PDF REPORT
        </button>
        <button
          className="hover-glow"
          style={{
            height: 40, borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
            color: C.textPrimary, fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: `all ${MOTION.duration.normal}ms`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          data-hover="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
          DOWNLOAD MARKDOWN
        </button>
        <p style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: '0.05em' }}>
          // AUTHORIZED_ACCESS_ONLY // SEC_INTEL_V1
        </p>
      </div>
    </div>
  )
}
