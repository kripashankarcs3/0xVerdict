import { useState, useCallback, useEffect } from 'react'
import { C } from './constants'
import type { NavStatus, AIStatus, Screen } from './types'
import CursorFollower from './components/CursorFollower'
import Background from './components/Background'
import Navbar from './components/Navbar'
import Landing from './components/Landing'
import Scanning from './components/Scanning'
import Results from './components/Results'
import PdfModal from './components/PdfModal'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [target, setTarget] = useState('http://localhost:3000')
  const [showModal, setShowModal] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus>('active')

  useEffect(() => {
    setAiStatus(screen === 'scanning' ? 'thinking' : 'active')
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
      <Background isDashboard={screen === 'results'} screen={screen} />
      <Navbar status={navStatus} aiStatus={aiStatus} />
      {screen === 'landing' && <Landing onScan={handleScan} />}
      {screen === 'scanning' && <Scanning target={target} onComplete={handleScanComplete} />}
      {screen === 'results' && <Results target={target} onModal={() => setShowModal(true)} />}
      {showModal && <PdfModal target={target} onClose={() => setShowModal(false)} />}
    </div>
  )
}
