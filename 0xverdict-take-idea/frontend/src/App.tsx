import { useState } from "react"
import Dashboard from "./pages/Dashboard"
import ScanResults from "./pages/ScanResults"
import ScanHistory from "./pages/ScanHistory"
import type { ActivePage } from "./types"

export default function App() {
  const [page, setPage] = useState<ActivePage>("dashboard")
  const [activeScanId, setActiveScanId] = useState<string | null>(null)

  const navigateTo = (p: ActivePage, scanId?: string) => {
    if (scanId) setActiveScanId(scanId)
    setPage(p)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-mono">
      {/* Ambient grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Nav */}
      <nav className="relative border-b border-slate-800 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigateTo("dashboard")}
            className="flex items-center gap-3 group"
          >
            <div className="w-7 h-7 rounded border border-sky-500/40 bg-sky-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-sky-400 font-bold tracking-wider text-sm group-hover:text-sky-300 transition-colors">
              0x<span className="text-slate-200">Verdict</span>
            </span>
          </button>

          <div className="flex items-center gap-1">
            <NavButton active={page === "dashboard"} onClick={() => navigateTo("dashboard")}>
              Scanner
            </NavButton>
            <NavButton active={page === "history"} onClick={() => navigateTo("history")}>
              History
            </NavButton>
            {activeScanId && (
              <NavButton active={page === "results"} onClick={() => navigateTo("results")}>
                Results
              </NavButton>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono">v1.0.0</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </nav>

      {/* Pages */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {page === "dashboard" && (
          <Dashboard onScanComplete={(id) => navigateTo("results", id)} />
        )}
        {page === "results" && activeScanId && (
          <ScanResults scanId={activeScanId} />
        )}
        {page === "history" && (
          <ScanHistory onViewScan={(id) => navigateTo("results", id)} />
        )}
      </main>
    </div>
  )
}

function NavButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded transition-all ${
        active
          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
      }`}
    >
      {children}
    </button>
  )
}
