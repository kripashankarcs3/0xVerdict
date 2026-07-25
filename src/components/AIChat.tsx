import { useState, useEffect, useRef } from 'react'
import { C, FONT } from '../constants'

interface Message {
  sender: 'user' | 'ai' | 'system'
  text: string
  timestamp: string
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'system',
      text: 'VerdictAI v1.0.0 Cyber Security Consultant Initialized. Ready for queries.',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  // Local Storage API Key Management
  const [apiKey, setApiKey] = useState(localStorage.getItem('0xverdict_openrouter_key') || '')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    // Pre-check for API key availability: if there is no key set locally AND no key configured,
    // we can request it immediately before sending!
    if (!apiKey) {
      setShowKeyModal(true)
      return
    }

    const userMsg: Message = {
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMsg])
    const prompt = input
    setInput('')
    setLoading(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: prompt })
      })

      if (!res.ok) throw new Error('API server returned status error')
      const data = await res.json()
      
      // If the backend indicates that the API key is missing
      if (data.error === 'API_KEY_MISSING') {
        setShowKeyModal(true)
        // Also put a message back into user input so they don't lose it
        setInput(prompt)
        setMessages(prev => [...prev, {
          sender: 'system',
          text: 'Authentication Required: Please enter a valid OpenRouter API Key to connect.',
          timestamp: new Date().toLocaleTimeString()
        }])
        setLoading(false)
        return
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: data.response || 'No response returned from the security AI.',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errorMsg: Message = {
        sender: 'system',
        text: `Error communicating with VerdictAI: ${(err as Error).message}. Check if python backend is running.`,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      paddingTop: 80, minHeight: '100vh', paddingBottom: 40,
      width: '100%', maxWidth: 840, margin: '0 auto', paddingLeft: 24, paddingRight: 24,
      position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 80px)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, letterSpacing: '0.08em' }}>
          //_SECURITY_AI_CONSULTATION
        </span>
        <h1 style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 28, color: C.textPrimary }}>
          AI Security Advisor
        </h1>
      </div>

      {/* Terminal Chat Box */}
      <div style={{
        flex: 1,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        background: 'rgba(10, 10, 15, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 25px rgba(0, 255, 136, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginBottom: 20
      }}>
        {/* Terminal Header */}
        <div style={{
          height: 32, background: 'rgba(5, 7, 10, 0.85)',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: '0.04em' }}>
              VERDICTAI_SHELL_v1.0
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setTempKey(apiKey)
                setShowKeyModal(true)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: apiKey ? C.green : C.orange,
                fontFamily: FONT.mono,
                fontSize: 8,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                transition: 'all 200ms',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>🔑</span>
              {apiKey ? '[ CUSTOM_KEY: ACTIVE ]' : '[ NO_KEY: CLICK_TO_CONFIG ]'}
            </button>
            <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>SEC_CONN: ACTIVE</span>
          </div>
        </div>

        {/* Message Log Feed */}
        <div 
          ref={feedRef}
          className="cyber-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {messages.map((msg, i) => {
            const isSystem = msg.sender === 'system'
            const isUser = msg.sender === 'user'
            
            return (
              <div 
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  animation: 'fade-slide-up 300ms ease-out forwards'
                }}
              >
                {/* Message Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  justifyContent: isUser ? 'flex-end' : 'flex-start' 
                }}>
                  <span style={{
                    fontFamily: FONT.mono,
                    fontSize: 8,
                    fontWeight: 700,
                    color: isSystem ? C.muted : isUser ? C.cyan : C.green,
                    letterSpacing: '0.08em'
                  }}>
                    {isSystem ? '[ SYSTEM ]' : isUser ? '[ USER ]' : '[ VerdictAI ]'}
                  </span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Content Bubble */}
                <div style={{
                  background: isUser ? 'rgba(0, 212, 255, 0.05)' : isSystem ? 'rgba(255,255,255,0.01)' : 'rgba(0, 255, 136, 0.03)',
                  border: `1px solid ${isUser ? 'rgba(0, 212, 255, 0.2)' : isSystem ? C.border : 'rgba(0, 255, 136, 0.2)'}`,
                  borderRadius: 6,
                  padding: '12px 16px',
                  color: isSystem ? C.muted : C.textPrimary,
                  fontFamily: isSystem || !isUser ? FONT.mono : 'inherit',
                  fontSize: isSystem ? 10 : 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: isUser 
                    ? '0 2px 10px rgba(0, 212, 255, 0.02)' 
                    : !isSystem 
                      ? '0 2px 10px rgba(0, 255, 136, 0.02)' 
                      : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            )
          })}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.green, fontWeight: 700 }}>[ VerdictAI ]</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>ANALYZING...</span>
              </div>
              <div style={{
                background: 'rgba(0, 255, 136, 0.02)',
                border: `1px solid rgba(0, 255, 136, 0.1)`,
                borderRadius: 6,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animationDelay: '200ms' }} />
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animationDelay: '400ms' }} />
                </div>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green }}>Waiting for secure shell response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={handleSubmit}
          style={{
            height: 52,
            borderTop: `1px solid ${C.border}`,
            background: 'rgba(5, 7, 10, 0.6)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12
          }}
        >
          <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.green }}>&gt;_</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder={loading ? "AI security analyst is thinking..." : "Consult AI about exploit payloads, patch recommendations, etc..."}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: C.textPrimary,
              fontFamily: FONT.mono,
              fontSize: 12,
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading ? C.green : 'transparent',
              color: input.trim() && !loading ? C.bgPrimary : C.muted,
              border: `1px solid ${input.trim() && !loading ? C.green : C.border}`,
              borderRadius: 4,
              padding: '6px 16px',
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 700,
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              transition: 'all 200ms',
              boxShadow: input.trim() && !loading ? `0 0 10px rgba(0, 255, 136, 0.2)` : 'none'
            }}
            onMouseEnter={e => {
              if (input.trim() && !loading) {
                e.currentTarget.style.boxShadow = `0 0 15px rgba(0, 255, 136, 0.4)`
              }
            }}
            onMouseLeave={e => {
              if (input.trim() && !loading) {
                e.currentTarget.style.boxShadow = `0 0 10px rgba(0, 255, 136, 0.2)`
              }
            }}
          >
            EXECUTE
          </button>
        </form>
      </div>

      {/* API Key Modal Popup */}
      {showKeyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'rgba(10, 10, 15, 0.95)',
            border: `1px solid ${C.green}`,
            borderRadius: 8,
            width: '90%',
            maxWidth: 480,
            padding: 24,
            boxShadow: `0 0 30px rgba(0, 255, 136, 0.15)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.green, letterSpacing: '0.08em' }}>
                //_CLIENT_AUTHENTICATION_CONFIG
              </span>
              <h3 style={{ fontFamily: FONT.grotesk, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                Configure OpenRouter API Key
              </h3>
            </div>

            <p style={{ fontFamily: FONT.inter, fontSize: 11, color: C.muted, lineHeight: 1.4, margin: 0 }}>
              AI client needs an active OpenRouter API key to route requests. If backend key is missing or you want to override it, enter your custom key below. It is stored safely in your local browser storage.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted }}>OPENROUTER_API_KEY:</label>
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder="sk-or-v1-..."
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: '10px 12px',
                  color: C.textPrimary,
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  outline: 'none',
                  transition: 'border-color 150ms'
                }}
                onFocus={e => e.currentTarget.style.borderColor = C.green}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setShowKeyModal(false)
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                  borderRadius: 4,
                  padding: '8px 16px',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
              >
                CANCEL
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const cleaned = tempKey.trim()
                  localStorage.setItem('0xverdict_openrouter_key', cleaned)
                  setApiKey(cleaned)
                  setShowKeyModal(false)
                  setMessages(prev => [...prev, {
                    sender: 'system',
                    text: cleaned 
                      ? 'Custom OpenRouter API Key configured successfully. Resuming standard shell routing.' 
                      : 'Custom API Key cleared. Standard backend defaults active.',
                    timestamp: new Date().toLocaleTimeString()
                  }])
                }}
                style={{
                  background: C.green,
                  color: C.bgPrimary,
                  border: `1px solid ${C.green}`,
                  borderRadius: 4,
                  padding: '8px 20px',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  boxShadow: `0 0 10px rgba(0, 255, 136, 0.2)`
                }}
              >
                SAVE & CONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

