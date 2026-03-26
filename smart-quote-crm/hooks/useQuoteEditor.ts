'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuoteItem } from '@/types/quote-requests'
import type { GenerateQuoteFromRequestResponse } from '@/types/quote-requests'
import { generateId } from '@/lib/utils'

export type { QuoteItem }

function emptyItem(): QuoteItem {
  return {
    id: generateId(),
    description: '',
    detail: '',
    qty: 1,
    unit_price: 0,
    vat: 23,
  }
}

export function useQuoteEditor(quoteRequestId: string) {
  const [subject, setSubject] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [clientNif, setClientNif] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [generatedByAI, setGeneratedByAI] = useState(false)

  const existingQuoteIdRef = useRef<string | null>(null)

  // ─── Totals ─────────────────────────────────────────────────────────────────

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.qty * item.unit_price, 0),
    [items],
  )

  const vatTotal = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + item.qty * item.unit_price * (item.vat / 100),
        0,
      ),
    [items],
  )

  const discountAmount = useMemo(
    () => (subtotal + vatTotal) * (discountPercent / 100),
    [subtotal, vatTotal, discountPercent],
  )

  const grandTotal = useMemo(
    () => subtotal + vatTotal - discountAmount,
    [subtotal, vatTotal, discountAmount],
  )

  // ─── Item operations ─────────────────────────────────────────────────────────

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()])
    setIsDirty(true)
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }, [])

  const updateItem = useCallback(
    <K extends keyof QuoteItem>(index: number, field: K, value: QuoteItem[K]) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      )
      setIsDirty(true)
    },
    [],
  )

  // ─── AI generation ────────────────────────────────────────────────────────────

  const generateWithAI = useCallback(
    async (requestText: string): Promise<string | null> => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/ai/generate-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_text: requestText }),
        })

        const json: { data: GenerateQuoteFromRequestResponse | null; error?: { message: string } } =
          await res.json()

        if (!res.ok || !json.data) {
          return json.error?.message ?? 'Erro ao gerar orçamento'
        }

        const result = json.data
        setSubject(result.subject)
        setDiscountPercent(result.discount_percent ?? 0)
        setNotes(result.notes ?? '')
        setPayment(result.payment ?? '')
        setGeneratedByAI(true)
        setItems(
          result.items.map((item) => ({
            id: generateId(),
            description: item.description,
            detail: item.detail ?? '',
            qty: item.qty,
            unit_price: item.unit_price,
            vat: item.vat ?? 23,
          })),
        )
        setIsDirty(true)
        return null
      } catch {
        return 'Erro de ligação. Tente novamente.'
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // ─── Save draft ───────────────────────────────────────────────────────────────

  const saveDraft = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return 'Precisa de estar autenticado'

      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + validDays)

      const lineItems = items.map((item) => ({
        id: item.id,
        description: [item.description, item.detail].filter(Boolean).join(' — '),
        quantity: item.qty,
        unit_price: item.unit_price,
        total: item.qty * item.unit_price,
      }))

      const notesText = [
        notes,
        payment ? `Pagamento: ${payment}` : '',
        clientNif ? `NIF: ${clientNif}` : '',
        discountPercent ? `Desconto: ${discountPercent}%` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const payload = {
        user_id: user.id,
        title: subject || 'Orçamento sem título',
        status: 'draft' as const,
        total_amount: grandTotal,
        currency: 'EUR',
        valid_until: validUntil.toISOString(),
        line_items: lineItems,
        notes: notesText,
        quote_request_id: quoteRequestId,
        generated_by_ai: generatedByAI,
        ai_generated: generatedByAI,
        updated_at: new Date().toISOString(),
      }

      let quoteId = existingQuoteIdRef.current

      if (quoteId) {
        const { error } = await supabase
          .from('quotes')
          .update(payload)
          .eq('id', quoteId)

        if (error) return error.message
      } else {
        const { data, error } = await supabase
          .from('quotes')
          .insert(payload)
          .select('id')
          .single()

        if (error) return error.message
        existingQuoteIdRef.current = data.id
        quoteId = data.id
      }

      setIsDirty(false)
      setLastSaved(new Date())
      return null
    } catch {
      return 'Erro inesperado ao guardar'
    } finally {
      setIsLoading(false)
    }
  }, [
    subject,
    items,
    discountPercent,
    notes,
    payment,
    validDays,
    clientNif,
    grandTotal,
    quoteRequestId,
    generatedByAI,
  ])

  // ─── Load existing quote ──────────────────────────────────────────────────────

  const loadExistingQuote = useCallback(
    (quoteId: string, quoteData: {
      title: string
      line_items: Array<{ id?: string; description: string; quantity: number; unit_price: number }>
      notes: string | null
      valid_until: string | null
      generated_by_ai: boolean
    }) => {
      existingQuoteIdRef.current = quoteId
      setSubject(quoteData.title)
      setGeneratedByAI(quoteData.generated_by_ai)
      setItems(
        quoteData.line_items.map((li) => ({
          id: li.id ?? generateId(),
          description: li.description,
          detail: '',
          qty: li.quantity,
          unit_price: li.unit_price,
          vat: 23,
        })),
      )
      if (quoteData.valid_until) {
        const days = Math.round(
          (new Date(quoteData.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
        setValidDays(Math.max(1, days))
      }
    },
    [],
  )

  return {
    // state
    subject,
    setSubject: (v: string) => { setSubject(v); setIsDirty(true) },
    items,
    discountPercent,
    setDiscountPercent: (v: number) => { setDiscountPercent(v); setIsDirty(true) },
    notes,
    setNotes: (v: string) => { setNotes(v); setIsDirty(true) },
    payment,
    setPayment: (v: string) => { setPayment(v); setIsDirty(true) },
    validDays,
    setValidDays: (v: number) => { setValidDays(v); setIsDirty(true) },
    clientNif,
    setClientNif: (v: string) => { setClientNif(v); setIsDirty(true) },
    // computed
    subtotal,
    vatTotal,
    discountAmount,
    grandTotal,
    // operations
    addItem,
    removeItem,
    updateItem,
    generateWithAI,
    saveDraft,
    loadExistingQuote,
    // meta
    isLoading,
    isDirty,
    lastSaved,
    generatedByAI,
    existingQuoteId: existingQuoteIdRef.current,
  }
}
