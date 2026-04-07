'use client'

import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="hidden text-sm text-gray-600 sm:block">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  )
}
