import { useState, useEffect } from 'react'

export function useTypewriter(text: string, delay = 40, startAfter = 0) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    setDisplayed('')
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(iv)
      }, delay)
      return () => clearInterval(iv)
    }, startAfter)
    return () => clearTimeout(t)
  }, [text, delay, startAfter])
  return displayed
}
