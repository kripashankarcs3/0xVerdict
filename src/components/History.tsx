import { useState, useEffect } from 'react'
import { C, FONT } from '../constants'
import type { Finding } from '../types'

interface StoredScan {
  scanId: string
  targetUrl: string
  scanDate: string
  scanDuration: string
  findings: Finding[]
}

export default function History({
  onLoadScan,
  onGoScan
}: {
  onLoadScan: (scan: StoredScan) => void
  onGoScan: () => void
}) {
  const [scans, setScans] = useState<StoredScan[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const data = localStorage.getItem('0xverdict_scans')
    if (data) {
      try {
        setScans(JSON.parse(data))
      } catch (e) {
        console.error('Failed to parse scan history', e)
      }
    }
  }, [])

  const filteredScans = scans.filter(s =>
    s.targetUrl.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = scans.filter(s => s.scanId !== id)
    setScans(updated)
    localStorage.setItem('0xverdict_scans', JSON.stringify(updated))
  }

  const getSeverityCounts = (findings: Finding[]) => {
    return {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    }
  }

  return (
    <div style={{
      paddingTop: 80, minHeight: '100vh', paddingBottom: 40,
      width: '100%', maxWidth: 1040, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 16
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, letterSpacing: '0.08em' }}>
            //_SEC_AUDIT_LOGS
          </span>
          <h1 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 28, color: C.textPrimary }}>
            Audit History
          </h1>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="[ SEARCH TARGET DOMAIN... ]"
          style={{
            background: 'rgba(5, 7, 10, 0.75)',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: '10px 16px',
            color: C.textPrimary,
            fontFamily: FONT.mono,
            fontSize: 11,
            width: 280,
            outline: 'none',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
          onFocus={e => {
            e.target.style.borderColor = C.green
            e.target.style.boxShadow = `0 0 10px rgba(0, 255, 136, 0.15)`
          }}
          onBlur={e => {
            e.target.style.borderColor = C.border
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {filteredScans.length === 0 ? (
        <div style={{
          border: `1px dashed ${C.border}`,
          borderRadius: 8,
          padding: '64px 24px',
          textAlign: 'center',
          background: 'rgba(10, 10, 15, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            {scans.length === 0 
              ? '//_NO_AUDIT_RECORDS_FOUND. HISTORICAL SCAN CACHE IS EMPTY.' 
              : '//_NO_SEARCH_MATCHES. ADJUST YOUR DOMAIN QUERY.'}
          </span>
          {scans.length === 0 && (
            <button
              onClick={onGoScan}
              style={{
                background: C.green,
                color: C.bgPrimary,
                border: 'none',
                borderRadius: 4,
                padding: '10px 20px',
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 0 15px rgba(0, 255, 136, 0.3)`,
                transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 20px rgba(0, 255, 136, 0.5)` }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 15px rgba(0, 255, 136, 0.3)` }}
            >
              RUN FIRST SCAN
            </button>
          )}
        </div>
      ) : (
        <div style={{
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(10, 10, 15, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 220px 100px 90px',
            padding: '12px 24px',
            background: 'rgba(5, 7, 10, 0.5)',
            borderBottom: `1px solid ${C.border}`,
            alignItems: 'center',
          }}>
            {['TARGET URL', 'SCAN DATE', 'SEVERITY RATIOS', 'STATUS', 'ACTION'].map(h => (
              <span key={h} style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>
                //_{h}
              </span>
            ))}
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredScans.map((scan, i) => {
              const counts = getSeverityCounts(scan.findings)
              return (
                <div
                  key={scan.scanId}
                  onClick={() => onLoadScan(scan)}
                  className="cyber-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 140px 220px 100px 90px',
                    padding: '16px 24px',
                    borderBottom: i < filteredScans.length - 1 ? `1px solid ${C.border}` : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 200ms',
                    animation: 'fade-slide-up 400ms ease-out forwards',
                    animationDelay: `${i * 50}ms`,
                    opacity: 0,
                  }}
                >
                  {/* Target URL */}
                  <span style={{
                    fontFamily: FONT.mono, fontSize: 12, color: C.cyan,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    paddingRight: 16
                  }}>
                    {scan.targetUrl}
                  </span>

                  {/* Date */}
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.textPrimary }}>
                    {scan.scanDate}
                  </span>

                  {/* Severity tags distribution */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {counts.critical > 0 && (
                      <span style={{
                        fontFamily: FONT.mono, fontSize: 9, background: 'rgba(255, 51, 102, 0.1)',
                        color: C.red, border: `1px solid rgba(255, 51, 102, 0.2)`,
                        padding: '2px 6px', borderRadius: 3, fontWeight: 700
                      }}>
                        {counts.critical} CRIT
                      </span>
                    )}
                    {counts.high > 0 && (
                      <span style={{
                        fontFamily: FONT.mono, fontSize: 9, background: 'rgba(255, 153, 51, 0.1)',
                        color: C.orange, border: `1px solid rgba(255, 153, 51, 0.2)`,
                        padding: '2px 6px', borderRadius: 3, fontWeight: 700
                      }}>
                        {counts.high} HIGH
                      </span>
                    )}
                    {counts.medium > 0 && (
                      <span style={{
                        fontFamily: FONT.mono, fontSize: 9, background: 'rgba(184, 115, 255, 0.1)',
                        color: C.purple, border: `1px solid rgba(184, 115, 255, 0.2)`,
                        padding: '2px 6px', borderRadius: 3, fontWeight: 700
                      }}>
                        {counts.medium} MED
                      </span>
                    )}
                    {counts.critical === 0 && counts.high === 0 && counts.medium === 0 && (
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted }}>
                        NO VULNS FOUND
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, fontWeight: 700 }}>
                      DONE
                    </span>
                  </div>

                  {/* Delete action */}
                  <button
                    onClick={e => handleDelete(scan.scanId, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: C.muted,
                      cursor: 'pointer',
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      textAlign: 'left',
                      padding: 4,
                      outline: 'none',
                      transition: 'color 200ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.red }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted }}
                  >
                    [ DELETE ]
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
