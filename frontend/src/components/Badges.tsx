import { C, MOTION } from '../constants'
import type { Finding } from '../types'

export function VerdictBadge({ verdict }: { verdict: Finding['verdict'] }) {
  const cfg = {
    confirmed: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.4)', text: C.green, label: '\u2705 CONFIRMED' },
    verify: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.4)', text: C.orange, label: '\u26A0 NEEDS VERIFICATION' },
    fp: { bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)', text: C.red, label: '\u274C LIKELY FALSE POSITIVE' },
  }[verdict]
  return (
    <span className="badge-micro" style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11, color: cfg.text,
      whiteSpace: 'nowrap', display: 'inline-block', cursor: 'default',
      textDecoration: verdict === 'fp' ? 'line-through' : 'none',
      transition: `transform ${MOTION.duration.normal}ms ${MOTION.easing}, box-shadow ${MOTION.duration.normal}ms ${MOTION.easing}`,
    }}>
      {cfg.label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: Finding['severity'] }) {
  const cfg = {
    critical: { bg: 'rgba(255,51,102,0.12)', border: 'rgba(255,51,102,0.4)', text: C.red, label: '\uD83D\uDD34 CRITICAL' },
    high: { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.4)', text: C.orange, label: '\uD83D\uDFE0 HIGH' },
    medium: { bg: 'rgba(123,97,255,0.1)', border: 'rgba(123,97,255,0.4)', text: C.purple, label: '\uD83D\uDD23 MEDIUM' },
    low: { bg: 'rgba(136,146,164,0.1)', border: 'rgba(136,146,164,0.3)', text: C.muted, label: '\u26AA LOW' },
  }[severity]
  return (
    <span className="badge-micro" style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 11, color: cfg.text,
      whiteSpace: 'nowrap', display: 'inline-block', cursor: 'default',
      transition: `transform ${MOTION.duration.normal}ms ${MOTION.easing}, box-shadow ${MOTION.duration.normal}ms ${MOTION.easing}`,
    }}>
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Finding['priority'] }) {
  const cfg = {
    immediate: { bg: 'rgba(255,51,102,0.08)', border: C.red, text: C.red, label: '\u26A1 IMMEDIATE' },
    high: { bg: 'rgba(255,184,0,0.08)', border: C.orange, text: C.orange, label: '\uD83D\uDD3A HIGH' },
    normal: { bg: 'rgba(123,97,255,0.08)', border: C.purple, text: C.purple, label: '\u2014 NORMAL' },
    low: { bg: 'rgba(136,146,164,0.08)', border: C.muted, text: C.muted, label: '\u2193 LOW' },
  }[priority]
  return (
    <span className="badge-micro" style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '3px 8px',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cfg.text,
      whiteSpace: 'nowrap', display: 'inline-block', cursor: 'default',
      transition: `transform ${MOTION.duration.normal}ms ${MOTION.easing}, box-shadow ${MOTION.duration.normal}ms ${MOTION.easing}`,
    }}>
      {cfg.label}
    </span>
  )
}
