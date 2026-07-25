import { useState } from 'react'
import { C, FONT } from '../constants'

interface ApiEndpoint {
  method: 'GET' | 'POST'
  path: string
  desc: string
  payload?: string
  response: string
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/scan/start',
    desc: 'Trigger a new vulnerability scan pipeline.',
    payload: `{\n  "target_url": "http://localhost:3000"\n}`,
    response: `{\n  "scan_id": "8a7f1c9d-4e2b-4a5f-9c8d-3b2a1f0e9d8c",\n  "status": "initiated",\n  "target_url": "http://localhost:3000"\n}`
  },
  {
    method: 'GET',
    path: '/scan/{scan_id}/status',
    desc: 'Poll the active status and phase of a running scan.',
    response: `{\n  "scan_id": "8a7f1c9d-4e2b-4a5f-9c8d-3b2a1f0e9d8c",\n  "scan_status": "Scanning",\n  "pipeline_message": "Running vulnerability detectors..."\n}`
  },
  {
    method: 'GET',
    path: '/scan/{scan_id}/result',
    desc: 'Retrieve full audit results and AI verdicts of a finished scan.',
    response: `{\n  "scan_id": "8a7f1c9d-4e2b-4a5f-9c8d-3b2a1f0e9d8c",\n  "scan_status": "Completed",\n  "summary": {\n    "total_findings": 5,\n    "critical": 1,\n    "high": 2\n  },\n  "findings": [...] \n}`
  }
]

export default function ApiHub() {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl')
  const [copied, setCopied] = useState(false)

  const codeTemplates = {
    curl: `curl -X POST http://localhost:8000/scan/start \\
  -H "Content-Type: application/json" \\
  -d '{"target_url": "https://example.com"}'`,
    
    python: `import requests

url = "http://localhost:8000/scan/start"
payload = {"target_url": "https://example.com"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

    node: `const axios = require('axios');

axios.post('http://localhost:8000/scan/start', {
  target_url: 'https://example.com'
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeTemplates[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      paddingTop: 80, minHeight: '100vh', paddingBottom: 40,
      width: '100%', maxWidth: 1040, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16
      }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, letterSpacing: '0.08em' }}>
          //_DEVELOPER_INTEGRATION_HUB
        </span>
        <h1 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 28, color: C.textPrimary }}>
          API Documentation
        </h1>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '55% 45%', gap: 24, alignItems: 'start'
      }}>
        {/* Left Side: Endpoint Reference */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontFamily: FONT.grotesk, fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>
            REST API Endpoints
          </h2>
          
          {ENDPOINTS.map((ep, i) => {
            const isGet = ep.method === 'GET'
            return (
              <div
                key={i}
                style={{
                  background: 'rgba(10, 10, 15, 0.72)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: FONT.mono, fontSize: 9, fontWeight: 700,
                    background: isGet ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                    color: isGet ? C.cyan : C.green,
                    border: `1px solid ${isGet ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 255, 136, 0.2)'}`,
                    padding: '2px 8px', borderRadius: 3
                  }}>
                    {ep.method}
                  </span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textPrimary, fontWeight: 700 }}>
                    {ep.path}
                  </span>
                </div>
                
                <p style={{ fontFamily: FONT.grotesk, fontSize: 12, color: C.muted, margin: 0 }}>
                  {ep.desc}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>//_MOCK_RESPONSE:</span>
                  <pre style={{
                    background: 'rgba(5, 7, 10, 0.8)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    padding: '10px 14px',
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: C.cyan,
                    overflowX: 'auto',
                    lineHeight: 1.4
                  }}>
                    {ep.response}
                  </pre>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Side: Code Playground */}
        <div style={{
          position: 'sticky', top: 100,
          background: 'rgba(10, 10, 15, 0.72)',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Playground Header Tabs */}
          <div style={{
            height: 40, background: 'rgba(5, 7, 10, 0.85)',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px'
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['curl', 'python', 'node'] as const).map(t => {
                const isActive = activeTab === t
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isActive ? C.green : C.muted,
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      transition: 'color 150ms'
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent',
                border: 'none',
                color: copied ? C.green : C.muted,
                fontFamily: FONT.mono,
                fontSize: 10,
                cursor: 'pointer',
                transition: 'color 150ms'
              }}
            >
              {copied ? '[ COPIED! ]' : '[ COPY CODE ]'}
            </button>
          </div>

          {/* Code Viewer Panel */}
          <div style={{ padding: 20 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted, display: 'block', marginBottom: 8 }}>
              //_TRIGGER_SCAN_CLIENT_EXAMPLE:
            </span>
            <pre style={{
              background: 'rgba(5, 7, 10, 0.9)',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '16px 20px',
              fontFamily: FONT.mono,
              fontSize: 10.5,
              color: C.green,
              overflowX: 'auto',
              lineHeight: 1.5,
              textShadow: '0 0 4px rgba(0, 255, 136, 0.15)'
            }}>
              {codeTemplates[activeTab]}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
