'use client'

import { useState } from 'react'
import type { GenerateQuoteRequest, GenerateQuoteResponse } from '@/types'

interface UseAIQuoteReturn {
  generate: (request: GenerateQuoteRequest) => Promise<GenerateQuoteResponse | null>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useAIQuote(): UseAIQuoteReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (request: GenerateQuoteRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const json = await response.json()

      if (!response.ok || json.error) {
        setError(json.error?.message ?? 'Generation failed')
        return null
      }

      return json.data as GenerateQuoteResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setLoading(false)
  }

  return { generate, loading, error, reset }
}
