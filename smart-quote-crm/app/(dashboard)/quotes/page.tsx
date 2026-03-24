import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { QuoteCard } from '@/components/quotes/QuoteCard'
import { ROUTES } from '@/lib/constants'
import type { Quote } from '@/types'

export const metadata: Metadata = { title: 'Quotes' }

export default async function QuotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <Header
        title="Quotes"
        actions={
          <Link href={ROUTES.quoteNew}>
            <Button size="sm">+ New quote</Button>
          </Link>
        }
      />
      <div className="p-6">
        {!quotes || quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
            <p className="text-gray-500">No quotes yet.</p>
            <Link href={ROUTES.quoteNew} className="mt-4">
              <Button>Create your first quote</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote as Quote} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
