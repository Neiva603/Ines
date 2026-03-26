'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useSignOut } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

// ─── Pending count badge ──────────────────────────────────────────────────────

function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-bold leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const TOP_NAV = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: '◻' },
  { label: 'Contactos',  href: ROUTES.contacts,  icon: '👤' },
] as const

const BOTTOM_NAV = [
  { label: 'Definições', href: ROUTES.settings, icon: '⚙' },
] as const

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useSignOut()
  const [pendingCount, setPendingCount] = useState(0)
  const supabaseRef = useRef(createClient())

  // Fetch pending count + subscribe to realtime changes
  useEffect(() => {
    const supabase = supabaseRef.current

    async function fetchCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')

      setPendingCount(count ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel('sidebar_pending_count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_requests' },
        () => fetchCount(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const quotesActive =
    pathname === ROUTES.quotes ||
    pathname.startsWith(ROUTES.quotes + '/') ||
    pathname === ROUTES.quoteRequests ||
    pathname.startsWith(ROUTES.quoteRequests + '/')

  const requestsActive =
    pathname === ROUTES.quoteRequests ||
    pathname.startsWith(ROUTES.quoteRequests + '/')

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-brand-600">Smart Quote CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {/* Top nav items */}
          {TOP_NAV.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <span aria-hidden>{icon}</span>
                  {label}
                </Link>
              </li>
            )
          })}

          {/* Quotes with sub-navigation */}
          <li>
            <Link
              href={ROUTES.quotes}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                quotesActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <span aria-hidden>📄</span>
              Orçamentos
            </Link>

            {/* Sub-items */}
            <ul className="mt-1 ml-6 space-y-0.5">
              <li>
                <Link
                  href={ROUTES.quotes}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    pathname === ROUTES.quotes || (pathname.startsWith(ROUTES.quotes + '/') && !requestsActive)
                      ? 'text-brand-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  Todos
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.quoteRequests}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    requestsActive
                      ? 'text-brand-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  Pedidos
                  <PendingBadge count={pendingCount} />
                </Link>
              </li>
            </ul>
          </li>

          {/* Bottom nav items */}
          {BOTTOM_NAV.map(({ label, href, icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <span aria-hidden>{icon}</span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <span aria-hidden>↩</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
