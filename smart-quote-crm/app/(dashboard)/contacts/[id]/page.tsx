import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ContactStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import type { Contact } from '@/types'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!contact) notFound()

  const c = contact as Contact

  return (
    <div>
      <Header
        title={c.name}
        actions={
          <Link
            href={ROUTES.contacts}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Voltar
          </Link>
        }
      />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                {c.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{c.name}</h2>
                {c.company && <p className="text-sm text-gray-500">{c.company}</p>}
              </div>
            </div>
            <ContactStatusBadge status={c.status} />
          </div>

          <dl className="space-y-3 text-sm">
            {c.email && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20 shrink-0">Email</dt>
                <dd>
                  <a href={`mailto:${c.email}`} className="text-brand-600 hover:underline">
                    {c.email}
                  </a>
                </dd>
              </div>
            )}
            {c.phone && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20 shrink-0">Telefone</dt>
                <dd>
                  <a href={`tel:${c.phone}`} className="text-brand-600 hover:underline">
                    {c.phone}
                  </a>
                </dd>
              </div>
            )}
            {c.website && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20 shrink-0">Website</dt>
                <dd>
                  <a
                    href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {c.website}
                  </a>
                </dd>
              </div>
            )}
            {c.tags && c.tags.length > 0 && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-20 shrink-0">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="text-gray-400 w-20 shrink-0">Adicionado</dt>
              <dd className="text-gray-600">{formatRelativeTime(c.created_at)}</dd>
            </div>
          </dl>

          {c.notes && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Notas</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={ROUTES.quoteNew}>
            <Button size="sm">+ Novo orçamento</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
