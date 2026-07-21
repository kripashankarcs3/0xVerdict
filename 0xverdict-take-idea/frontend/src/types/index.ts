export type ActivePage = "dashboard" | "results" | "history"

export type Verdict = "Confirmed" | "Needs Manual Verification" | "Likely False Positive"
export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info"
export type Priority = "Immediate" | "High" | "Normal" | "Low"
export type ScanStatus =
  | "Initiated"
  | "Reconnoitering"
  | "Scanning"
  | "AI Analyzing"
  | "Completed"
  | "Failed"

export interface RemediationCode {
  language: string
  secure_code_example: string
}

export interface AIAnalysis {
  verdict: Verdict
  severity_classified: Severity
  priority_recommendation: Priority
  priority_reason: string
  confidence_reason: string
  root_cause: string
  developer_explanation: string
  fix_recommendation: string
  remediation_code: RemediationCode
  manual_verification_guide: string
}

export interface Finding {
  id: string
  type: string
  endpoint: string
  payload: string
  raw_evidence: string
  scanner_severity: Severity
  http_method?: string
  injected_params?: string[]
  ai_analysis?: AIAnalysis
}

export interface ReconData {
  pages_found: string[]
  forms_found: Array<{
    endpoint: string
    method: string
    inputs: Array<{ name: string; type: string }>
  }>
  headers_collected: Record<string, string>
  missing_headers?: string[]
}

export interface ScanSummary {
  total_findings: number
  confirmed: number
  needs_verification: number
  false_positives: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export interface ScanResult {
  scan_id: string
  target_url: string
  scan_date: string
  scan_status: ScanStatus
  scan_duration: string
  pipeline_message: string
  progress_percent: number
  summary: ScanSummary
  recon_data?: ReconData
  findings: Finding[]
}

export interface ScanListItem {
  scan_id: string
  target_url: string
  scan_date: string
  scan_status: ScanStatus
  summary: ScanSummary
}
