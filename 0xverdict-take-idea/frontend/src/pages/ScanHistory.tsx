import { useEffect, useState } from "react"
import { listScans } from "../utils/api"
import type { ScanListItem } from "../types"

interface Props {
  onViewScan: (scanId: string) => void
}

export default function ScanHistory({ onViewScan }: Props) {
  const [scans, setScans] = useState<ScanListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listScans()
      .then((s) => {
        setScans(s.reverse())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Scan History</h1>

      {scans.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-600">
          No scans yet. Run your first scan from the Scanner tab.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
            <div className="col-span-4">Target</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Findings</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {scans.map((scan) => (
            <div
              key={scan.scan_id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/70 last:border-0 items-center hover:bg-slate-800/20 transition-colors"
            >
              <div className="col-span-4 font-mono text-xs text-sky-400/80 truncate">
                {scan.target_url}
              </div>
              <div className="col-span-2 text-xs text-slate-500">{scan.scan_date}</div>
              <div className="col-span-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    scan.scan_status === "Completed"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : scan.scan_status === "Failed"
                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                      : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  }`}
                >
                  {scan.scan_status}
                </span>
              </div>
              <div className="col-span-2 text-xs">
                <span className="text-slate-300">{scan.summary.total_findings}</span>
                <span className="text-slate-600 ml-1">
                  ({scan.summary.confirmed}✅ {scan.summary.needs_verification}🔍)
                </span>
              </div>
              <div className="col-span-2 text-right">
                <button
                  onClick={() => onViewScan(scan.scan_id)}
                  className="text-[10px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
