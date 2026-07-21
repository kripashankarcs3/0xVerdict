import type { ScanSummary } from "../types"

interface Props {
  summary: ScanSummary
}

export default function MetricsBar({ summary }: Props) {
  const severityCards = [
    { label: "Critical", count: summary.critical, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
    { label: "High", count: summary.high, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    { label: "Medium", count: summary.medium, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
    { label: "Low", count: summary.low, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
    { label: "Info", count: summary.info, color: "text-slate-400", bg: "bg-slate-700/50 border-slate-600/30" },
  ]

  const verdictCards = [
    { label: "Confirmed", count: summary.confirmed, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "✅" },
    { label: "Verify", count: summary.needs_verification, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: "🔍" },
    { label: "False+", count: summary.false_positives, color: "text-slate-400", bg: "bg-slate-700/50 border-slate-600/30", icon: "❌" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 col-span-2 flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest">Total Findings</p>
          <p className="text-4xl font-bold text-slate-100 mt-1">{summary.total_findings}</p>
        </div>
        <div className="flex gap-2">
          {verdictCards.map((v) => (
            <div key={v.label} className={`border rounded-lg px-4 py-2 text-center ${v.bg}`}>
              <p className="text-lg font-bold mt-0.5">
                <span className={v.color}>{v.count}</span>
              </p>
              <p className="text-xs text-slate-500">{v.icon} {v.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Severity breakdown */}
      {severityCards.map((s) => (
        <div
          key={s.label}
          className={`border rounded-xl p-4 flex items-center justify-between ${s.bg}`}
        >
          <span className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</span>
          <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
        </div>
      ))}
    </div>
  )
}
