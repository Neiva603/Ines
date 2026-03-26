'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Smart Quote CRM'

export default function PedirOrcamentoPage() {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [requestText, setRequestText] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clientName.trim()) {
      setError('Por favor, introduza o seu nome.')
      return
    }
    if (!requestText.trim()) {
      setError('Por favor, descreva o que necessita.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from('quote_requests').insert({
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        client_phone: clientPhone.trim() || null,
        client_company: clientCompany.trim() || null,
        request_text: requestText.trim(),
      })

      if (dbError) {
        setError('Ocorreu um erro ao enviar o pedido. Tente novamente.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 pb-16 px-4">
      <div className="w-full max-w-[600px]">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{COMPANY_NAME}</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Preencha o formulário abaixo e entraremos em contacto brevemente com um orçamento personalizado.
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-5">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pedido enviado!</h2>
            <p className="mt-3 text-gray-500">
              Entraremos em contacto brevemente com o seu orçamento.
            </p>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5"
          >
            <Input
              label="Nome completo *"
              placeholder="Ana Silva"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              autoComplete="name"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Email"
                type="email"
                placeholder="ana@empresa.pt"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Telemóvel"
                type="tel"
                placeholder="+351 912 345 678"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <Input
              label="Empresa (opcional)"
              placeholder="Empresa Lda."
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              autoComplete="organization"
            />

            <Textarea
              label="Descreva o que precisa *"
              placeholder={
                'Seja o mais detalhado possível.\n\nExemplo: Preciso de um website profissional para o meu restaurante com menu online, sistema de reservas e galeria de fotos. Tenho logo e identidade visual definidos.'
              }
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              required
              className="min-h-[120px]"
              rows={6}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? 'A enviar…' : 'Enviar Pedido'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
