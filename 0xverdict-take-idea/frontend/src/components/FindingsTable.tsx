import { useState } from "react"
import type { Finding, Severity, Verdict } from "../types"
import FindingDetail from "./FindingDetail"
import { getMarkdownReportUrl, getPdfReportUrl } from "../utils/api"

interface Props {
  findings: Finding[]
  scanId: string
}

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  Low: "bg-green-500/15 text-green-400 border border-green-500/30",
  Info: "bg-slate-700/50 text-slate-400 border border-slate-600/30",
}

const VERDICT_STYLES: Record<Verdict, string> = {
  Confirmed: "text-emerald-400",
  "Needs Manual Verification": "text-amber-400",
  "Likely False Positive": "text-slate-500",
}

const VERDICT_ICONS: Record<Verdict, string> = {
  Confirmed: "✅",
  "Needs Manual Verification": "🔍",
  "Likely False Positive": "❌",
}

type SortKey = "type" | "severity" | "verdict" | "priority"
type FilterVerdict = "all" | Verdict

export default function FindingsTable({ findings, scanId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("severity")
  const [filterVerdict, setFilterVerdict] = useState<FilterVerdict>("all")

  const SEVERITY_ORDER: Record<Severity, number> = {
    Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
  }

  const filtered = findings.filter((f) => {
    if (filterVerdict === "all") return true
    return f.ai_analysis?.verdict === filterVerdict
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "severity") {
      const sa = a.ai_analysis?.severity_classified ?? a.scanner_severity
      const sb = b.ai_analysis?.severity_classified ?? b.scanner_severity
      return (SEVERITY_ORDER[sa] ?? 4) - (SEVERITY_ORDER[sb] ?? 4)
    }
    return 0
  })

  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="text-sky-400">⚡</span>
          Vulnerability Findings
          <span className="text-slate-600 font-normal">({sorted.length})</span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value as FilterVerdict)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-sky-500/50"
          >
            <option value="all">All Verdicts</option>
            <option value="Confirmed">✅ Confirmed</option>
            <option value="Needs Manual Verification">🔍 Needs Verification</option>
            <option value="Likely False Positive">❌ False Positives</option>
          </select>

          {/* Export buttons */}
          <a
            href={getMarkdownReportUrl(scanId)}
            download
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            .md
          </a>
          <a
            href={getPdfReportUrl(scanId)}
            download
            className="text-xs bg-sky-600 hover:bg-sky-500 border border-sky-500/50 rounded-lg px-3 py-1.5 text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
          <div className="col-span-4">Finding / Endpoint</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Verdict</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1" />
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-600 text-sm">
            No findings match the current filter
          </div>
        ) : (
          sorted.map((finding) => {
            const ai = finding.ai_analysis
            const verdict = ai?.verdict ?? ("Pending" as Verdict)
            const severity = ai?.severity_classified ?? finding.scanner_severity
            const isExpanded = expandedId === finding.id

            return (
              <div key={finding.id} className="border-b border-slate-800/70 last:border-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="w-full grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left items-center group"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="text-xs text-slate-400 truncate font-mono">
                      {finding.endpoint}
                    </p>
                    {ai?.root_cause && (
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">
                        {ai.root_cause}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-300 leading-tight">{finding.type}</span>
                  </div>
                  <div className="col-span-2">
                    {ai ? (
                      <span className={`text-xs font-medium ${VERDICT_STYLES[verdict as Verdict] ?? "text-slate-400"}`}>
                        {VERDICT_ICONS[verdict as Verdict]} {verdict}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 animate-pulse">Analyzing...</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES["Info"]}`}>
                      {severity}
                    </span>
                  </div>
                  <div className="col-span-1 text-xs text-slate-500">
                    {ai?.priority_recommendation ?? "—"}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <svg
                      className={`w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Drill-down detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800/50 bg-slate-950/50">
                    <FindingDetail finding={finding} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
