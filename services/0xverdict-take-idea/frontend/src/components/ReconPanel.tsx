import { useState } from "react"
import type { ReconData } from "../types"

interface Props {
  recon: ReconData
}

export default function ReconPanel({ recon }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-base">🔍</span>
          <div>
            <p className="text-sm font-semibold text-slate-200">Reconnaissance Data</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {recon.pages_found.length} pages · {recon.forms_found.length} forms ·{" "}
              {recon.missing_headers?.length ?? 0} missing headers
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pages */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pages Found</p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {recon.pages_found.map((p, i) => (
                <div key={i} className="text-xs font-mono text-sky-400/80 bg-slate-800/50 rounded px-2 py-1">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Forms Found</p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {recon.forms_found.map((f, i) => (
                <div key={i} className="text-xs bg-slate-800/50 rounded px-2 py-1">
                  <span className="text-purple-400 font-mono">{f.method}</span>{" "}
                  <span className="text-slate-300 font-mono">{f.endpoint}</span>
                  <div className="text-slate-500 mt-0.5">
                    {f.inputs.map((inp) => inp.name).join(", ")}
                  </div>
                </div>
              ))}
              {recon.forms_found.length === 0 && (
                <div className="text-xs text-slate-600">No forms discovered</div>
              )}
            </div>
          </div>

          {/* Missing Headers */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Missing Headers</p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {(recon.missing_headers ?? []).map((h, i) => (
                <div key={i} className="text-xs font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                  {h}
                </div>
              ))}
              {(recon.missing_headers?.length ?? 0) === 0 && (
                <div className="text-xs text-emerald-500">All critical headers present ✅</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
