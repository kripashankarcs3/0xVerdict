/**
 * 0xVerdict — AI Client
 * Direct OpenCode Zen API integration (OpenAI-compatible)
 */

const OPENCODE_BASE_URL = '/opencode-api'
const OPENCODE_MODEL = 'deepseek-v4-flash-free'

function getApiKey(): string {
  return import.meta.env.VITE_OPENCODE_API_KEY || 'sk-VIbqP1rTs1nUows5PLp7Rts2HPoTZTdD4tFDDszqbuhlBGF0u02Q8ihFNUbRp4MX'
}

function extractAnswer(content: string, reasoning: string): string {
  // If content has actual text, use it
  if (content && content.trim()) return content.trim()

  // For reasoning models: reasoning_content has the thinking + answer
  // Extract the final answer after the thinking process
  if (reasoning && reasoning.trim()) {
    const text = reasoning.trim()

    // Try to find text after common reasoning conclusion markers
    const markers = [
      /\n\n(?=\*\*(?:Answer|Response|Solution|Result|Summary))/,
      /\n\n(?=[A-Z][a-z].*(?:is|are|involves|means|refers))/,
      /(?:In summary|To summarize|In conclusion|Therefore|Finally)[,:]?\s*/i,
    ]

    for (const marker of markers) {
      const parts = text.split(marker)
      if (parts.length > 1) {
        const answer = parts[parts.length - 1].trim()
        if (answer.length > 20) return answer
      }
    }

    // Fallback: take the last 3 paragraphs (skip thinking preamble)
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
    if (paragraphs.length > 3) {
      return paragraphs.slice(-3).join('\n\n').trim()
    }
    return text
  }

  return 'No response generated.'
}

export async function askAI(
  prompt: string,
  systemInstruction = 'You are VerdictAI, an expert cybersecurity analyst. Be concise and technical. Answer directly without explaining your thinking process.'
): Promise<string | null> {
  const apiKey = getApiKey()

  try {
    const response = await fetch(`${OPENCODE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': '0xVerdict Security Scanner',
      },
      body: JSON.stringify({
        model: OPENCODE_MODEL,
        max_tokens: 3000,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('AI API error:', err)
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(err)}`)
    }

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const msg = data.choices[0].message
      const content = msg.content || ''
      const reasoning = msg.reasoning_content || ''
      return extractAnswer(content, reasoning)
    }

    throw new Error('Invalid response structure from API')
  } catch (error) {
    console.error('AI Client Error:', error)
    return null
  }
}
