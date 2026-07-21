import type { ScanResult } from './types'

const API_BASE = 'http://localhost:8000'

export async function startScan(targetUrl: string): Promise<{ scan_id: string; status: string; target_url: string }> {
  const res = await fetch(`${API_BASE}/scan/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_url: targetUrl }),
  })
  if (!res.ok) throw new Error(`Failed to start scan: ${res.statusText}`)
  return res.json()
}

export async function getScanStatus(scanId: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${scanId}/status`)
  if (!res.ok) throw new Error(`Failed to get scan status`)
  return res.json()
}

export async function getScanResult(scanId: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${scanId}/result`)
  if (!res.ok) throw new Error(`Failed to get scan result`)
  return res.json()
}

export function getMarkdownReportUrl(scanId: string): string {
  return `${API_BASE}/scan/${scanId}/report/markdown`
}

export function getPdfReportUrl(scanId: string): string {
  return `${API_BASE}/scan/${scanId}/report/pdf`
}
