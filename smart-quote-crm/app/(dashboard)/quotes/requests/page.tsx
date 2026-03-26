'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { formatRelativeTime, truncate } from '@/lib/utils'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ROUTES } from '@/lib/constants'
import type { QuoteRequest, QuoteRequestStatus } from '@/types/quote-requests'

type TabFilter = 'all' | 'pending' | 'reviewing' | 'sent'

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'Todos',       value: 'all' },
  { label: 'Novos',       value: 'pending' },
  { label: 'Em revisão',  value: 'reviewing' },
  { label: 'Enviados',    value: 'sent' },
]

export default function QuoteRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const supabaseRef = useRef(createClient())

  const fetchRequests = useCallback(async (status?: QuoteRequestStatus) => {
    const supabase = supabaseRef.current
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('quote_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data } = await query
    if (data) setRequests(data as QuoteRequest[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : (activeTab as QuoteRequestStatus)
    setLoading(true)
    fetchRequests(status)
  }, [activeTab, fetchRequests])

  // Polling every 30 s + Supabase Realtime
  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel('quote_requests_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_requests' },
        () => {
          const status = activeTab === 'all' ? undefined : (activeTab as QuoteRequestStatus)
          fetchRequests(status)
        },
      )
      .subscribe()

    const interval = setInterval(() => {
      const status = activeTab === 'all' ? undefined : (activeTab as QuoteRequestStatus)
      fetchRequests(status)
    }, 30_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [activeTab, fetchRequests])

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos de Orçamento</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pedidos recebidos através do formulário público.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sem pedidos</p>
          <p className="text-sm mt-1">
            Partilhe o link{' '}
            <span className="font-mono text-brand-600">/pedir-orcamento</span> com os seus clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={ROUTES.quoteRequest(req.id)}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {req.client_name}
                  </span>
                  {req.client_company && (
                    <span className="text-gray-400 text-xs truncate">· {req.client_company}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {truncate(req.request_text, 80)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    REQUEST_STATUS_COLORS[req.status],
                  )}
                >
                  {REQUEST_STATUS_LABELS[req.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(req.created_at)}
                </span>
              </div>

              <span className="text-gray-300 group-hover:text-brand-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
