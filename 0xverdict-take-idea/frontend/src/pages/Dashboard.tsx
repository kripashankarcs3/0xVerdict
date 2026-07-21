import { useState } from "react"
import { useScan } from "../hooks/useScan"
import ScanProgress from "../components/ScanProgress"
import MetricsBar from "../components/MetricsBar"
import FindingsTable from "../components/FindingsTable"
import ReconPanel from "../components/ReconPanel"

interface DashboardProps {
  onScanComplete: (scanId: string) => void
}

const EXAMPLE_TARGETS = [
  "http://testphp.vulnweb.com",
  "http://dvwa.local",
  "http://juice-shop.local",
]

export default function Dashboard({ onScanComplete }: DashboardProps) {
  const [targetUrl, setTargetUrl] = useState("")
  const { scanId, scanData, isLoading, error, triggerScan } = useScan()

  const handleScan = async () => {
    if (!targetUrl.trim()) return
    await triggerScan(targetUrl.trim())
  }

  const isComplete = scanData?.scan_status === "Completed"

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-xs text-sky-400 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          AI-Powered Vulnerability Analysis
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-sky-400">0x</span>
          <span className="text-slate-100">Verdict</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Transforms raw scanner output into developer-ready security intelligence
        </p>
      </div>

      {/* Scanner Input */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-600 text-xs ml-2">target-scanner.sh</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
              $
            </span>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleScan()}
              placeholder="https://target.example.com"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 disabled:opacity-50 transition-colors"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isLoading || !targetUrl.trim()}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap border border-sky-500/50 disabled:border-slate-600"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-sky-300/30 border-t-sky-300 rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start Scan
              </>
            )}
          </button>
        </div>

        {/* Example targets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-600 text-xs">Try:</span>
          {EXAMPLE_TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setTargetUrl(t)}
              disabled={isLoading}
              className="text-xs text-sky-600 hover:text-sky-400 font-mono transition-colors disabled:opacity-40"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Live scan progress */}
      {(isLoading || scanData) && scanData && (
        <ScanProgress scanData={scanData} />
      )}

      {/* Results */}
      {scanData && (
        <>
          <MetricsBar summary={scanData.summary} />

          {scanData.recon_data && (
            <ReconPanel recon={scanData.recon_data} />
          )}

          {scanData.findings.length > 0 && (
            <FindingsTable findings={scanData.findings} scanId={scanId!} />
          )}

          {isComplete && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-emerald-400 text-sm">
                ✅ Scan complete in {scanData.scan_duration} — {scanData.summary.total_findings} findings analyzed by AI
              </p>
            </div>
          )}
        </>
      )}

      {/* Legal disclaimer */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 text-xs text-amber-500/70 leading-relaxed">
        <span className="font-semibold text-amber-500">⚠️ Legal Notice:</span> This tool is intended
        exclusively for authorized security testing environments (OWASP Juice Shop, DVWA, or
        infrastructure where explicit written permission has been granted). Unauthorized scanning
        violates global cyber defense frameworks and local regulations. Authors assume no liability
        for misuse.
      </div>
    </div>
  )
}
