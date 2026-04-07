import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { QuoteStatusBadge } from '@/components/ui/Badge'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote } from '@/types'

interface QuoteCardProps {
  quote: Quote
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <Link href={ROUTES.quote(quote.id)}>
      <Card hover className="animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 line-clamp-1">{quote.title}</p>
              {quote.ai_generated && (
                <span
                  className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                  title="AI-generated quote"
                >
                  AI
                </span>
              )}
            </div>
            {quote.description && (
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                {quote.description}
              </p>
            )}
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="space-y-0.5 text-sm text-gray-500">
            <p>Created {formatDate(quote.created_at)}</p>
            {quote.valid_until && (
              <p>Valid until {formatDate(quote.valid_until)}</p>
            )}
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(quote.total_amount, quote.currency)}
          </p>
        </div>
      </Card>
    </Link>
  )
}
