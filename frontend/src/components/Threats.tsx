import { useState, useEffect } from 'react'
import { C, FONT } from '../constants'

interface GlobalCVE {
  id: string
  cve: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  vector: string
  published: string
  status: 'ACTIVE EXPLOIT' | 'MITIGATED' | 'PATCH DEPLOYED'
}

const INITIAL_CVES: GlobalCVE[] = [
  { id: '1', cve: 'CVE-2024-3094', title: 'XZ Utils Backdoor Liblzma Infiltration', severity: 'CRITICAL', vector: 'Remote Code Execution', published: '2024-03-29', status: 'ACTIVE EXPLOIT' },
  { id: '2', cve: 'CVE-2023-44487', title: 'HTTP/2 Rapid Reset DDoS Vulnerability', severity: 'HIGH', vector: 'Denial of Service', published: '2023-10-10', status: 'PATCH DEPLOYED' },
  { id: '3', cve: 'CVE-2024-21626', title: 'runc Container Breakout File Descriptor Leak', severity: 'CRITICAL', vector: 'Privilege Escalation', published: '2024-01-31', status: 'MITIGATED' },
  { id: '4', cve: 'CVE-2023-38606', title: 'Apple kernel private API exploitation', severity: 'HIGH', vector: 'Kernel PrivEsc', published: '2023-07-24', status: 'MITIGATED' },
  { id: '5', cve: 'CVE-2023-22515', title: 'Atlassian Confluence Server Broken Access Control', severity: 'CRITICAL', vector: 'Authentication Bypass', published: '2023-10-04', status: 'ACTIVE EXPLOIT' },
  { id: '6', cve: 'CVE-2024-27198', title: 'JetBrains TeamCity Auth Bypass admin generation', severity: 'CRITICAL', vector: 'Authentication Bypass', published: '2024-03-04', status: 'PATCH DEPLOYED' },
  { id: '7', cve: 'CVE-2023-4863', title: 'libwebp Heap Buffer Overflow image parse', severity: 'CRITICAL', vector: 'RCE / Heap Overflow', published: '2023-09-12', status: 'PATCH DEPLOYED' },
]

export default function Threats() {
  const [cves] = useState<GlobalCVE[]>(INITIAL_CVES)
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL')
  const [telemetry, setTelemetry] = useState({
    activeThreats: 14892,
    patchingRate: 94.2,
    mitigationTime: 14.8
  })

  // Simulated live telemetry shifts
  useEffect(() => {
    const iv = setInterval(() => {
      setTelemetry(prev => ({
        activeThreats: prev.activeThreats + Math.floor(Math.random() * 5) - 2,
        patchingRate: parseFloat((prev.patchingRate + (Math.random() * 0.2 - 0.1)).toFixed(1)),
        mitigationTime: parseFloat((prev.mitigationTime + (Math.random() * 0.4 - 0.2)).toFixed(1))
      }))
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  const filteredCves = cves.filter(c => {
    if (filter === 'ALL') return true
    return c.severity === filter
  })

  return (
    <div style={{
      paddingTop: 80, minHeight: '100vh', paddingBottom: 40,
      width: '100%', maxWidth: 1040, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, letterSpacing: '0.08em' }}>
            //_GLOBAL_THREAT_FEED
          </span>
          <h1 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 28, color: C.textPrimary }}>
            Threat Intelligence
          </h1>
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'CRITICAL', 'HIGH'] as const).map(f => {
            const isActive = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: FONT.mono, fontSize: 9, padding: '6px 14px', borderRadius: 4,
                  cursor: 'pointer', border: `1px solid ${isActive ? C.green : C.border}`,
                  background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                  color: isActive ? C.green : C.muted,
                  fontWeight: isActive ? 700 : 400,
                  transition: 'all 200ms',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* Telemetry Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        marginBottom: 24
      }}>
        {[
          { label: 'GLOBAL MONITORED THREATS', value: telemetry.activeThreats.toLocaleString(), sub: '+4.2% active escalation', color: C.red },
          { label: 'AVERAGE PLATFORM PATCH RATE', value: `${telemetry.patchingRate}%`, sub: '99.9% WAF mitigation coverage', color: C.green },
          { label: 'MEAN TIME TO REMEDIATION', value: `${telemetry.mitigationTime} hrs`, sub: 'Fastest security pipeline response', color: C.cyan }
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(10, 10, 15, 0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: `0 4px 15px rgba(0,0,0,0.1)`
            }}
          >
            <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, letterSpacing: '0.08em' }}>
              //_{stat.label}
            </span>
            <span style={{
              fontFamily: FONT.grotesk, fontSize: 24, fontWeight: 700, color: stat.color,
              textShadow: `0 0 10px ${stat.color}25`
            }}>
              {stat.value}
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>
              {stat.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Threats Table */}
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
          gridTemplateColumns: '130px 1.5fr 1fr 110px 130px',
          padding: '12px 24px',
          background: 'rgba(5, 7, 10, 0.5)',
          borderBottom: `1px solid ${C.border}`,
          alignItems: 'center',
        }}>
          {['IDENTIFIER', 'EXPLOIT TITLE', 'ATTACK VECTOR', 'RELEASED', 'VULN STATUS'].map(h => (
            <span key={h} style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>
              //_{h}
            </span>
          ))}
        </div>

        {/* Table Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredCves.map((c, i) => {
            const isCrit = c.severity === 'CRITICAL'
            const isActive = c.status === 'ACTIVE EXPLOIT'
            
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 1.5fr 1fr 110px 130px',
                  padding: '16px 24px',
                  borderBottom: i < filteredCves.length - 1 ? `1px solid ${C.border}` : 'none',
                  alignItems: 'center',
                  background: 'transparent',
                  transition: 'background 200ms',
                  animation: 'fade-slide-up 400ms ease-out forwards',
                  animationDelay: `${i * 50}ms`,
                  opacity: 0
                }}
              >
                {/* CVE ID */}
                <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.cyan, fontWeight: 700 }}>
                  {c.cve}
                </span>

                {/* Exploit Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 16 }}>
                  <span style={{ fontFamily: FONT.inter, fontSize: 12, color: C.textPrimary, fontWeight: 600 }}>
                    {c.title}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontFamily: FONT.mono, fontSize: 8,
                      background: isCrit ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255, 153, 51, 0.1)',
                      color: isCrit ? C.red : C.orange,
                      border: `1px solid ${isCrit ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 153, 51, 0.2)'}`,
                      padding: '1px 5px', borderRadius: 2, fontWeight: 700
                    }}>
                      {c.severity}
                    </span>
                  </div>
                </div>

                {/* Attack Vector */}
                <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.textPrimary }}>
                  {c.vector}
                </span>

                {/* Published Date */}
                <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
                  {c.published}
                </span>

                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? C.red : c.status === 'MITIGATED' ? C.cyan : C.green,
                    boxShadow: isActive ? `0 0 6px ${C.red}60` : 'none'
                  }} />
                  <span style={{
                    fontFamily: FONT.mono, fontSize: 10,
                    color: isActive ? C.red : c.status === 'MITIGATED' ? C.cyan : C.green,
                    fontWeight: 700
                  }}>
                    {c.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
