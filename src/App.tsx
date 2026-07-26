import { useState, useCallback, useEffect } from 'react'
import { C, FINDINGS } from './constants'
import type { NavStatus, AIStatus, Screen, Finding, BackendFinding } from './types'
import { startScan, getScanResult } from './utils/api'
import CursorFollower from './components/CursorFollower'
import Background from './components/Background'
import Navbar from './components/Navbar'
import Landing from './components/Landing'
import Scanning from './components/Scanning'
import Results from './components/Results'
import PdfModal from './components/PdfModal'
import History from './components/History'
import AIChat from './components/AIChat'
import Threats from './components/Threats'
import ApiHub from './components/ApiHub'

interface StoredScan {
  scanId: string
  targetUrl: string
  scanDate: string
  scanDuration: string
  findings: typeof FINDINGS
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [target, setTarget] = useState('http://localhost:3000')
  const [showModal, setShowModal] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus>('active')

  const [scanId, setScanId] = useState<string | null>(null)
  const [activeScanFindings, setActiveScanFindings] = useState<typeof FINDINGS>(FINDINGS)
  const [activeScanDate, setActiveScanDate] = useState('2026-07-25')
  const [activeScanDuration, setActiveScanDuration] = useState('45 sec')

  useEffect(() => {
    setAiStatus(screen === 'scanning' ? 'thinking' : 'active')
  }, [screen])

  // Sync state with browser history (back/forward buttons)
  useEffect(() => {
    window.history.replaceState({ screen: 'landing' }, '')

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setScreen(event.state.screen)
      } else {
        setScreen('landing')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (nextScreen: Screen, replace = false) => {
    setScreen(nextScreen)
    if (replace) {
      window.history.replaceState({ screen: nextScreen }, '')
    } else {
      window.history.pushState({ screen: nextScreen }, '')
    }
  }

  const navStatus: NavStatus = screen === 'landing' ? 'idle' : screen === 'scanning' ? 'scanning' : 'complete'

  const handleScan = useCallback(async (url: string) => {
    try {
      const result = await startScan(url)
      setScanId(result.scan_id)
    } catch (err) {
      console.error('Failed to start scan:', err)
    }
    setTarget(url)
    navigateTo('scanning')
  }, [])

  function mapFinding(b: BackendFinding): Finding {
    const verdict = b.ai_analysis?.verdict === 'Confirmed' ? 'confirmed' : b.ai_analysis?.verdict === 'Likely False Positive' ? 'fp' : 'verify'
    return {
      id: b.id,
      type: b.type,
      endpoint: b.endpoint,
      verdict,
      severity: (b.ai_analysis?.severity_classified?.toLowerCase() as Finding['severity']) || 'medium',
      scannerSeverity: b.scanner_severity,
      aiSeverity: b.ai_analysis?.severity_classified || 'Medium',
      priority: ((b.ai_analysis?.priority_recommendation?.toLowerCase() === 'immediate' ? 'immediate' : b.ai_analysis?.priority_recommendation?.toLowerCase() === 'high' ? 'high' : b.ai_analysis?.priority_recommendation?.toLowerCase() === 'normal' ? 'normal' : 'low') as Finding['priority']),
      confidence: verdict === 'confirmed' ? 'HIGH' : verdict === 'fp' ? 'LOW' : 'MEDIUM',
      priorityReason: b.ai_analysis?.priority_reason || '',
      confidenceReason: b.ai_analysis?.confidence_reason || '',
      rootCause: b.ai_analysis?.root_cause || '',
      devExplanation: b.ai_analysis?.developer_explanation || '',
      fixRecommendation: b.ai_analysis?.fix_recommendation || '',
      remediationCode: b.ai_analysis?.remediation_code?.secure_code_example || '',
      manualSteps: (b.ai_analysis?.manual_verification_guide || '').split('\n').filter(s => s.trim() !== ''),
      priorityNote: '',
    }
  }

  const handleScanComplete = useCallback(async () => {
    let findings = FINDINGS
    let dateStr = new Date().toLocaleDateString('en-CA')
    let durationStr = `${35 + Math.floor(Math.random() * 20)} sec`

    if (scanId) {
      try {
        const result = await getScanResult(scanId)
        const mapped = (result.findings || []).map(mapFinding)
        if (mapped.length > 0) {
          findings = mapped
          dateStr = result.scan_date || dateStr
          durationStr = result.scan_duration || durationStr
        }
      } catch (err) {
        console.error('Failed to get scan result:', err)
      }
    }

    const base = target.replace(/\/$/, '')
    // Only override endpoints for mock FINDINGS fallback (not real backend data)
    const usingRealData = scanId && findings !== FINDINGS
    const customized = findings.map(f => {
      if (usingRealData) return f  // Real backend data — keep endpoints as-is
      let endpoint = f.endpoint
      if (f.type.includes('SQL')) {
        endpoint = `${base}/api/products?id=1`
      } else if (f.type.includes('XSS')) {
        endpoint = `${base}/search?q=<script>`
      } else if (f.type.includes('Directory')) {
        endpoint = `${base}/static/../../etc/passwd`
      } else if (f.type.includes('Exposure')) {
        endpoint = `${base}/.git/config`
      } else {
        endpoint = `${base}${f.endpoint}`
      }
      return { ...f, endpoint }
    })

    const newScan: StoredScan = {
      scanId: `scan_${Date.now()}`,
      targetUrl: target,
      scanDate: dateStr,
      scanDuration: durationStr,
      findings: customized,
    }

    const rawData = localStorage.getItem('0xverdict_scans')
    const historyList = rawData ? JSON.parse(rawData) : []
    localStorage.setItem('0xverdict_scans', JSON.stringify([newScan, ...historyList]))

    setActiveScanFindings(customized)
    setActiveScanDate(dateStr)
    setActiveScanDuration(durationStr)

    navigateTo('results', true)
  }, [target, scanId])

  const handleLoadScan = useCallback((scan: StoredScan) => {
    setTarget(scan.targetUrl)
    setActiveScanFindings(scan.findings)
    setActiveScanDate(scan.scanDate)
    setActiveScanDuration(scan.scanDuration)
    navigateTo('results')
  }, [])

  const handleBackToLanding = useCallback(() => {
    navigateTo('landing')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bgPrimary }}>
      <CursorFollower />
      <Background isDashboard={screen === 'results'} screen={screen} />
      <Navbar
        status={navStatus}
        aiStatus={aiStatus}
        activeScreen={screen}
        onNavigate={nextScreen => navigateTo(nextScreen)}
        onLogoClick={handleBackToLanding}
      />
      {screen === 'landing' && <Landing onScan={handleScan} />}
      {screen === 'scanning' && <Scanning target={target} scanId={scanId ?? ''} onComplete={handleScanComplete} />}
      {screen === 'results' && (
        <Results
          target={target}
          findings={activeScanFindings}
          scanDate={activeScanDate}
          scanDuration={activeScanDuration}
          onBack={handleBackToLanding}
          onModal={() => setShowModal(true)}
        />
      )}
      {screen === 'history' && <History onLoadScan={handleLoadScan} onGoScan={handleBackToLanding} />}
      {screen === 'chat' && <AIChat />}
      {screen === 'threats' && <Threats />}
      {screen === 'apiDocs' && <ApiHub />}
      {showModal && <PdfModal target={target} onClose={() => setShowModal(false)} />}
    </div>
  )
}

