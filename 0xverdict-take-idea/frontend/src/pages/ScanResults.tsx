import { useEffect, useState } from "react"
import { getScanResult } from "../utils/api"
import type { ScanResult } from "../types"
import MetricsBar from "../components/MetricsBar"
import FindingsTable from "../components/FindingsTable"
import ReconPanel from "../components/ReconPanel"
import ScanProgress from "../components/ScanProgress"

interface Props {
  scanId: string
}

export default function ScanResults({ scanId }: Props) {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getScanResult(scanId)
      .then((r) => {
        setResult(r)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [scanId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-sm">
        {error ?? "Scan not found"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Scan Results</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-mono">{result.target_url}</p>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div>{result.scan_date}</div>
          <div>{result.scan_duration}</div>
        </div>
      </div>

      <ScanProgress scanData={result} />
      <MetricsBar summary={result.summary} />

      {result.recon_data && <ReconPanel recon={result.recon_data} />}

      {result.findings.length > 0 ? (
        <FindingsTable findings={result.findings} scanId={scanId} />
      ) : (
        <div className="text-center py-12 text-slate-600">
          No findings to display for this scan.
        </div>
      )}
    </div>
  )
}
