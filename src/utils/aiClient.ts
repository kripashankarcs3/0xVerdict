/**
 * 0xVerdict — AI Client
 * Direct OpenCode Zen API integration (OpenAI-compatible)
 */

const OPENCODE_BASE_URL = 'https://opencode.ai/zen/v1'
const OPENCODE_MODEL = 'deepseek-v4-flash-free'

function getApiKey(): string {
  // Use hardcoded key — no user input needed
  return import.meta.env.VITE_OPENCODE_API_KEY || 'sk-VIbqP1rTs1nUows5PLp7Rts2HPoTZTdD4tFDDszqbuhlBGF0u02Q8ihFNUbRp4MX'
}

export async function askAI(
  prompt: string,
  systemInstruction = 'You are VerdictAI, an expert cybersecurity analyst. Be concise and technical.'
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
        max_tokens: 1000,
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
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const msg = data.choices[0].message
      // Handle reasoning models
      return msg.content || msg.reasoning_content || null
    }
    throw new Error('Invalid response structure')
  } catch (error) {
    console.error('AI Client Error:', error)
    return null
  }
}
