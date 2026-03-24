'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useSignOut } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: ROUTES.dashboard, icon: '◻' },
  { label: 'Contacts',   href: ROUTES.contacts,  icon: '👤' },
  { label: 'Quotes',     href: ROUTES.quotes,    icon: '📄' },
  { label: 'Settings',   href: ROUTES.settings,  icon: '⚙' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useSignOut()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-brand-600">Smart Quote CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon }) => {
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
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <span aria-hidden>↩</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
