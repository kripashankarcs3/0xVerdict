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

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

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
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      })

      if (!res.ok) throw new Error('API server returned status error')
      const data = await res.json()
      
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
          <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.muted }}>SEC_CONN: ACTIVE</span>
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
    </div>
  )
}
