export interface ScanRequest {
  target_url: string
}

export interface RemediationCode {
  language: string
  secure_code_example: string
}

export interface AIAnalysis {
  verdict: 'Confirmed' | 'Needs Manual Verification' | 'Likely False Positive'
  severity_classified: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
  priority_recommendation: 'Immediate' | 'High' | 'Normal' | 'Low'
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
  scanner_severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
  ai_analysis: AIAnalysis | null
}

export interface ReconData {
  pages_found: string[]
  forms_found: Record<string, unknown>[]
  headers_collected: Record<string, string>
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
  scan_status: string
  scan_duration: string
  pipeline_message: string
  summary: ScanSummary
  recon_data: ReconData | null
  findings: Finding[]
}

export interface ScanStatus {
  scan_id: string
  scan_status: string
  pipeline_message: string
  progress_percent: number
}
