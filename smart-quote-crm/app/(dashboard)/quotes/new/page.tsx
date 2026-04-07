'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { createQuote } from '@/services/quotes'
import { ROUTES } from '@/lib/constants'
import type { Contact } from '@/types'

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contactId = searchParams.get('contactId')

  const [contact, setContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      setContacts((data ?? []) as Contact[])
      if (contactId) {
        setContact(((data ?? []) as Contact[]).find((c) => c.id === contactId) ?? null)
      }
    })
  }, [contactId])

  const handleContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContact(contacts.find((c) => c.id === e.target.value) ?? null)
  }

  const handleSubmit = async (values: Parameters<typeof createQuote>[0]) => {
    if (!contact) return
    setLoading(true)
    setError(null)
    const result = await createQuote({ ...values, contact_id: contact.id })
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    } else {
      router.push(ROUTES.quotes)
      router.refresh()
    }
  }

  return (
    <div>
      <Header title="New quote" />
      <div className="mx-auto max-w-3xl p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Contact selector */}
        {!contactId && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Select a contact
            </label>
            <select
              onChange={handleContactChange}
              defaultValue=""
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="" disabled>Choose a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {contact ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-gray-500">
              Quote for <span className="font-medium text-gray-900">{contact.name}</span>
              {contact.company && ` · ${contact.company}`}
            </p>
            <QuoteForm contact={contact} onSubmit={handleSubmit} loading={loading} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-gray-500">Select a contact to continue.</p>
          </div>
        )}
      </div>
    </div>
  )
}
