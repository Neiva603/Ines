'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactFilters, PaginatedResponse } from '@/types'

interface UseContactsReturn {
  contacts: Contact[]
  total: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContacts(filters: ContactFilters = {}): UseContactsReturn {
  const [data, setData] = useState<PaginatedResponse<Contact> | null>(null)
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
      search,
    } = filters

    async function fetchContacts() {
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
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (status) query = query.eq('status', status)
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
        )
      }

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

    fetchContacts()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, filters.page, filters.status, filters.search, filters.sortOrder])

  return {
    contacts: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    refetch,
  }
}
