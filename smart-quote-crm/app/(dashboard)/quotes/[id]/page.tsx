import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { QuoteStatusBadge } from '@/components/ui/Badge'
import { ROUTES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote } from '@/types'

export const metadata: Metadata = { title: 'Quote' }

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!quote) notFound()

  const q = quote as Quote

  return (
    <div>
      <Header
        title={q.title}
        actions={
          <Link
            href={ROUTES.quotes}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Voltar
          </Link>
        }
      />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Status + meta */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{q.title}</h2>
              {q.description && (
                <p className="mt-1 text-sm text-gray-500">{q.description}</p>
              )}
            </div>
            <QuoteStatusBadge status={q.status} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">Criado em</dt>
              <dd className="text-gray-800">{formatDate(q.created_at)}</dd>
            </div>
            {q.valid_until && (
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">Válido até</dt>
                <dd className="text-gray-800">{formatDate(q.valid_until)}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">Moeda</dt>
              <dd className="text-gray-800">{q.currency}</dd>
            </div>
            {(q.ai_generated || q.generated_by_ai) && (
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">Gerado por</dt>
                <dd className="inline-flex items-center gap-1 text-purple-700 font-medium">
                  <span>✨</span> IA
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Line items */}
        {q.line_items && q.line_items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Descrição</th>
                  <th className="text-right px-4 py-3 font-medium">Qtd</th>
                  <th className="text-right px-4 py-3 font-medium">Preço unit.</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {q.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(item.unit_price, q.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.total, q.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">
                    {formatCurrency(q.total_amount, q.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Notes */}
        {q.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Observações</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{q.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
