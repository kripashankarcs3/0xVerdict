export type ScanStatus =
  | 'Initiated'
  | 'Reconnoitering'
  | 'Scanning'
  | 'AI Analyzing'
  | 'Completed'
  | 'Failed'

export interface ScanResult {
  scan_id: string
  target_url: string
  scan_date: string
  scan_status: ScanStatus
  scan_duration: string
  pipeline_message: string
  summary: ScanSummary
  recon_data: ReconData | null
  findings: BackendFinding[]
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

export interface ReconData {
  pages_found: string[]
  forms_found: {
    endpoint: string
    method: string
    inputs: { name: string; type: string }[]
  }[]
  headers_collected: Record<string, string>
  missing_headers: string[]
}

export interface BackendFinding {
  id: string
  type: string
  endpoint: string
  payload: string
  raw_evidence: string
  scanner_severity: string
  http_method?: string
  injected_params?: string[]
  ai_analysis?: {
    verdict: string
    severity_classified: string
    priority_recommendation: string
    priority_reason: string
    confidence_reason: string
    root_cause: string
    developer_explanation: string
    fix_recommendation: string
    remediation_code: {
      language: string
      secure_code_example: string
    }
    manual_verification_guide: string
  } | null
}

export interface ScanListItem {
  scan_id: string
  target_url: string
  scan_date: string
  scan_status: ScanStatus
  summary: ScanSummary
}

export interface Finding {
  id: string
  type: string
  endpoint: string
  verdict: 'confirmed' | 'verify' | 'fp'
  severity: 'critical' | 'high' | 'medium' | 'low'
  scannerSeverity: string
  aiSeverity: string
  priority: 'immediate' | 'high' | 'normal' | 'low'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  priorityReason: string
  confidenceReason: string
  rootCause: string
  devExplanation: string
  fixRecommendation: string
  remediationCode: string
  manualSteps: string[]
  priorityNote: string
}

export type NavStatus = 'idle' | 'scanning' | 'complete'
export type AIStatus = 'active' | 'thinking' | 'idle'
export type Screen = 'landing' | 'scanning' | 'results' | 'history' | 'chat' | 'threats' | 'apiDocs'
export type FilterType = 'all' | 'confirmed' | 'verify' | 'fp'
