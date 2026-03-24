'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ContactForm } from '@/components/contacts/ContactForm'
import { createContact } from '@/services/contacts'
import { ROUTES } from '@/lib/constants'

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: Parameters<typeof createContact>[0]) => {
    setLoading(true)
    setError(null)
    const result = await createContact(values)
    setLoading(false)

    if (result.error) {
      setError(result.error.message)
    } else {
      router.push(ROUTES.contacts)
      router.refresh()
    }
  }

  return (
    <div>
      <Header title="New contact" />
      <div className="mx-auto max-w-2xl p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ContactForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}
