import { useState, useCallback, useEffect } from 'react'
import { C, FINDINGS } from './constants'
import type { NavStatus, AIStatus, Screen } from './types'
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

  const handleScan = useCallback((url: string) => {
    setTarget(url)
    navigateTo('scanning')
  }, [])

  const handleScanComplete = useCallback(() => {
    const base = target.replace(/\/$/, '')
    const customized = FINDINGS.map(f => {
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
      return {
        ...f,
        endpoint,
      }
    })

    const dateStr = new Date().toLocaleDateString('en-CA')
    const durationStr = `${35 + Math.floor(Math.random() * 20)} sec`

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
  }, [target])

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
      {screen === 'scanning' && <Scanning target={target} onComplete={handleScanComplete} />}
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

