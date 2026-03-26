import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parallel data fetching
  const [contactsResult, quotesResult] = await Promise.all([
    supabase
      .from('contacts')
      .select('status', { count: 'exact', head: false })
      .eq('user_id', user!.id),
    supabase
      .from('quotes')
      .select('status, total_amount', { count: 'exact', head: false })
      .eq('user_id', user!.id),
  ])

  const contacts = contactsResult.data ?? []
  const quotes = quotesResult.data ?? []

  const totalRevenue = quotes
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + (q.total_amount ?? 0), 0)

  const pendingQuotes = quotes.filter(
    (q) => q.status === 'draft' || q.status === 'sent',
  ).length

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Contacts"
            value={contacts.length}
            icon={<span aria-hidden>👤</span>}
          />
          <StatCard
            label="Total Quotes"
            value={quotes.length}
            icon={<span aria-hidden>📄</span>}
          />
          <StatCard
            label="Pending Quotes"
            value={pendingQuotes}
            icon={<span aria-hidden>⏳</span>}
          />
          <StatCard
            label="Revenue (accepted)"
            value={new Intl.NumberFormat('pt-PT', {
              style: 'currency',
              currency: 'EUR',
            }).format(totalRevenue)}
            icon={<span aria-hidden>💶</span>}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Getting started
          </h2>
          <p className="text-sm text-gray-600">
            Add your first contact, then create an AI-powered quote in seconds.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-gray-700">
            <li>1. Go to <strong>Contacts</strong> and add a client</li>
            <li>2. Go to <strong>Quotes → New quote</strong></li>
            <li>3. Describe what you need to quote — Claude will generate a structured proposal</li>
            <li>4. Review, adjust amounts, and send</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
