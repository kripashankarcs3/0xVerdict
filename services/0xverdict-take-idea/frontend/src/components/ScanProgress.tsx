import type { ScanResult, ScanStatus } from "../types"

const PIPELINE_STAGES: { key: ScanStatus; label: string; icon: string }[] = [
  { key: "Initiated", label: "Queued", icon: "⏳" },
  { key: "Reconnoitering", label: "Recon", icon: "🔍" },
  { key: "Scanning", label: "Detecting", icon: "⚡" },
  { key: "AI Analyzing", label: "AI Analysis", icon: "🤖" },
  { key: "Completed", label: "Complete", icon: "✅" },
]

const STATUS_ORDER: Record<ScanStatus, number> = {
  Initiated: 0,
  Reconnoitering: 1,
  Scanning: 2,
  "AI Analyzing": 3,
  Completed: 4,
  Failed: 4,
}

interface Props {
  scanData: ScanResult
}

export default function ScanProgress({ scanData }: Props) {
  const { scan_status, pipeline_message, progress_percent } = scanData
  const currentOrder = STATUS_ORDER[scan_status] ?? 0
  const isFailed = scan_status === "Failed"

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
          Scan Pipeline
        </span>
        <span className={`text-xs px-2 py-1 rounded font-mono ${
          isFailed
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : scan_status === "Completed"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-sky-500/15 text-sky-400 border border-sky-500/30 animate-pulse"
        }`}>
          {scan_status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isFailed ? "bg-red-500" : "bg-sky-500"
          }`}
          style={{ width: `${isFailed ? 100 : progress_percent}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const order = STATUS_ORDER[stage.key] ?? idx
          const isDone = !isFailed && currentOrder > order
          const isActive = !isFailed && currentOrder === order
          const isPending = isFailed || currentOrder < order

          return (
            <div key={stage.key} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 flex flex-col items-center gap-1`}>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                    isDone
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      : isActive
                      ? "bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-600"
                  }`}
                >
                  {stage.icon}
                </div>
                <span
                  className={`text-[10px] text-center whitespace-nowrap ${
                    isDone ? "text-emerald-500" : isActive ? "text-sky-400" : "text-slate-600"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px mb-5 transition-colors ${
                    isDone ? "bg-emerald-500/40" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Live message */}
      <p className="text-xs text-slate-500 font-mono border-l-2 border-sky-500/30 pl-3">
        {pipeline_message}
      </p>
    </div>
  )
}
