import { useState } from 'react'
import { C, FONT, FINDINGS } from '../constants'
import { VerdictBadge, SeverityBadge, PriorityBadge } from './Badges'
import AIPanel from './AIPanel'
import type { Finding, FilterType } from '../types'

function SummaryStat({ stat, index, arr }: {
  stat: { label: string; value: string; color: string; mono?: boolean; big?: boolean; icon: React.ReactNode }
  index: number
  arr: unknown[]
}) {
  return (
    <div
      className="summary-stat-enter"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderRight: index < arr.length - 1 ? `1px solid ${C.border}` : 'none',
        height: '100%', padding: '0 16px',
        transition: 'background 200ms',
        cursor: 'default',
        animationDelay: `${index * 100}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {stat.icon}
        <span style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>
          //_{stat.label}
        </span>
      </div>
      <div style={{
        fontFamily: stat.mono ? FONT.mono : FONT.grotesk,
        fontWeight: stat.big ? 700 : 400,
        fontSize: stat.big ? 18 : 12,
        color: stat.color,
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textShadow: stat.color === C.green || stat.color === C.cyan ? `0 0 8px ${stat.color}40` : 'none',
      }}>
        {stat.label === 'STATUS' && <span style={{ color: C.green, marginRight: 4 }}>&#x25CF;</span>}
        {stat.value}
      </div>
    </div>
  )
}

export default function Results({
  target,
  findings = FINDINGS,
  scanDate = '2026-07-25',
  scanDuration = '45 sec',
  onBack,
  onModal
}: {
  target: string
  findings?: Finding[]
  scanDate?: string
  scanDuration?: string
  onBack: () => void
  onModal: () => void
}) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Finding | null>(null)

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
    { key: 'confirmed', label: `CONFIRMED (${counts.confirmed})` },
    { key: 'verify', label: `VERIFY (${counts.verify})` },
    { key: 'fp', label: `FALSE POSITIVE (${counts.fp})` },
  ]

  const summaryStats = [
    {
      label: 'TARGET',
      value: target,
      color: C.cyan,
      mono: true,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      )
    },
    {
      label: 'SCAN DATE',
      value: scanDate,
      color: C.textPrimary,
      mono: true,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    },
    {
      label: 'DURATION',
      value: scanDuration,
      color: C.textPrimary,
      mono: true,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },
    {
      label: 'CONFIRMED',
      value: String(counts.confirmed),
      color: C.green,
      big: true,
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      )
    },
  ]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{
        background: 'rgba(15, 15, 26, 0.85)',
        borderBottom: `1px solid ${C.border}`,
        height: 56, display: 'flex', alignItems: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {summaryStats.map((stat, i, arr) => (
          <SummaryStat key={stat.label} stat={stat} index={i} arr={arr} />
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'calc(65% - 8px) calc(35% - 8px)',
        gap: 16,
        height: 'calc(100vh - 64px - 56px - 24px)',
        padding: '0 24px 24px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          background: 'rgba(10, 10, 15, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>
              //_VULNERABILITY_FINDINGS
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {filters.map(f => {
                const isActive = filter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      fontFamily: FONT.mono, fontSize: 9, padding: '5px 12px', borderRadius: 4,
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
              <div style={{ width: 1, height: 16, background: C.border, margin: '0 8px' }} />
              <button
                onClick={onBack}
                style={{
                  fontFamily: FONT.mono, fontSize: 9, padding: '5px 12px', borderRadius: 4,
                  cursor: 'pointer', border: `1px solid ${C.cyan}`,
                  background: 'rgba(0, 212, 255, 0.08)',
                  color: C.cyan,
                  transition: 'all 150ms',
                  fontWeight: 700,
                  boxShadow: `0 0 8px rgba(0, 212, 255, 0.2)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)' }}
              >
                &lt; NEW SCAN
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '72px 1fr 160px 150px 100px 100px',
            padding: '0 24px', height: 38, alignItems: 'center',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
            background: 'rgba(10, 10, 15, 0.5)',
          }}>
            {['ID', 'VULNERABILITY', 'ENDPOINT', 'AI VERDICT', 'SEVERITY', 'PRIORITY'].map(h => (
              <span key={h} style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>
                //_{h}
              </span>
            ))}
          </div>

          <div className="cyber-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((f, i) => {
              const isSelected = selected?.id === f.id
              return (
                <div
                  key={f.id}
                  className={`finding-row-enter cyber-row ${isSelected ? 'cyber-row-active' : ''}`}
                  onClick={() => setSelected(isSelected ? null : f)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Finding: ${f.type} at ${f.endpoint}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(isSelected ? null : f) } }}
                  style={{
                    display: 'grid', gridTemplateColumns: '72px 1fr 160px 150px 100px 100px',
                    padding: '0 24px', height: 48, alignItems: 'center',
                    cursor: 'pointer', position: 'relative',
                    borderBottom: `1px solid ${C.border}`,
                    opacity: f.verdict === 'fp' ? 0.55 : 1,
                    animationDelay: `${i * 60}ms`,
                    outline: 'none',
                  }}
                >
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

                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.id}</span>
                  <span style={{ fontFamily: FONT.inter, fontWeight: 600, fontSize: 13, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{f.type}</span>
                  <span title={f.endpoint} style={{ fontFamily: FONT.mono, fontSize: 11, color: C.cyan, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>{f.endpoint}</span>
                  <VerdictBadge verdict={f.verdict} />
                  <SeverityBadge severity={f.severity} />
                  <PriorityBadge priority={f.priority} />
                </div>
              )
            })}
          </div>
        </div>

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
