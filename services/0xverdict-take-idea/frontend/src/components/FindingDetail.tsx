import { useState } from "react"
import type { Finding } from "../types"

interface Props {
  finding: Finding
}

export default function FindingDetail({ finding }: Props) {
  const ai = finding.ai_analysis
  const [codeTab, setCodeTab] = useState<"code" | "guide">("code")

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
      {/* Left column */}
      <div className="space-y-3">
        {/* Raw Evidence */}
        <Section title="📟 Raw Scanner Evidence">
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800">
            {finding.raw_evidence}
          </div>
          <div className="flex gap-3 mt-2">
            <Meta label="Payload" value={finding.payload} mono />
            {finding.http_method && <Meta label="Method" value={finding.http_method} />}
            <Meta label="Scanner Sev" value={finding.scanner_severity} />
          </div>
          {finding.injected_params && finding.injected_params.length > 0 && (
            <div className="mt-1">
              <span className="text-slate-600">Injected params: </span>
              {finding.injected_params.map((p) => (
                <span key={p} className="bg-slate-800 rounded px-1.5 py-0.5 font-mono text-sky-400 mr-1">
                  {p}
                </span>
              ))}
            </div>
          )}
        </Section>

        {ai && (
          <>
            {/* AI Analysis */}
            <Section title="🧠 AI Decision Trace">
              <InfoRow label="Verdict" value={ai.verdict} highlight />
              <InfoRow label="Confidence" value={ai.confidence_reason} />
              <InfoRow label="Priority Reason" value={ai.priority_reason} />
            </Section>

            {/* Root Cause */}
            <Section title="🔎 Root Cause">
              <p className="text-slate-400 leading-relaxed">{ai.root_cause}</p>
            </Section>

            {/* Developer Explanation */}
            <Section title="💡 Developer Explanation">
              <p className="text-slate-400 leading-relaxed">{ai.developer_explanation}</p>
            </Section>
          </>
        )}
      </div>

      {/* Right column */}
      {ai && (
        <div className="space-y-3">
          {/* Fix Recommendation */}
          <Section title="🛠️ Fix Recommendation">
            <p className="text-slate-300 leading-relaxed font-medium">{ai.fix_recommendation}</p>
          </Section>

          {/* Code / Verification Tabs */}
          <Section title="">
            <div className="flex gap-1 mb-3">
              <TabButton
                active={codeTab === "code"}
                onClick={() => setCodeTab("code")}
              >
                {ai.remediation_code.language} Secure Code
              </TabButton>
              <TabButton
                active={codeTab === "guide"}
                onClick={() => setCodeTab("guide")}
              >
                Manual Verification
              </TabButton>
            </div>

            {codeTab === "code" && (
              <div className="relative">
                <div className="flex items-center justify-between bg-slate-800 rounded-t-lg px-3 py-1.5 border border-slate-700">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ai.remediation_code.language}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(ai.remediation_code.secure_code_example)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-950 rounded-b-lg border border-t-0 border-slate-700 p-3 overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap">
                  {ai.remediation_code.secure_code_example}
                </pre>
              </div>
            )}

            {codeTab === "guide" && (
              <div className="bg-slate-950 rounded-lg border border-slate-700 p-3">
                <div className="text-slate-400 leading-relaxed whitespace-pre-line">
                  {ai.manual_verification_guide.split("\n").map((line, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      {line.match(/^\d+\./) ? (
                        <>
                          <span className="text-sky-500 shrink-0 font-mono">{line.match(/^\d+\./)?.[0]}</span>
                          <span>{line.replace(/^\d+\.\s*/, "")}</span>
                        </>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {!ai && (
        <div className="flex items-center justify-center col-span-2 py-8 text-slate-600">
          <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mr-3" />
          AI analysis in progress...
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && (
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      )}
      {children}
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="mb-2">
      <span className="text-slate-600">{label}: </span>
      <span className={highlight ? "text-emerald-400 font-semibold" : "text-slate-400"}>{value}</span>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-slate-600">{label}: </span>
      <span className={`text-slate-300 ${mono ? "font-mono bg-slate-800 px-1 rounded" : ""}`}>
        {value}
      </span>
    </div>
  )
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] rounded-lg transition-colors ${
        active
          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
          : "text-slate-500 hover:text-slate-300 border border-transparent"
      }`}
    >
      {children}
    </button>
  )
}
