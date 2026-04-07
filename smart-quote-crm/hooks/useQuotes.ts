'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Quote, QuoteFilters, PaginatedResponse } from '@/types'

interface UseQuotesReturn {
  quotes: Quote[]
  total: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useQuotes(filters: QuoteFilters = {}): UseQuotesReturn {
  const [data, setData] = useState<PaginatedResponse<Quote> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const {
      page = 1,
      perPage = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      contactId,
      search,
    } = filters

    async function fetchQuotes() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setError('Not authenticated')
        setLoading(false)
        return
      }

      let query = supabase
        .from('quotes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (status) query = query.eq('status', status)
      if (contactId) query = query.eq('contact_id', contactId)
      if (search) query = query.ilike('title', `%${search}%`)

      const from = (page - 1) * perPage
      const { data: rows, count, error: dbError } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, from + perPage - 1)

      if (cancelled) return

      if (dbError) {
        setError(dbError.message)
      } else {
        setData({
          data: rows ?? [],
          total: count ?? 0,
          page,
          perPage,
          totalPages: Math.ceil((count ?? 0) / perPage),
        })
      }
      setLoading(false)
    }

    fetchQuotes()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, filters.page, filters.status, filters.contactId, filters.search])

  return {
    quotes: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    refetch,
  }
}
