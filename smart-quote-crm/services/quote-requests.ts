import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, PaginatedResponse, QuoteItem } from '@/types'
import type { QuoteRequest, QuoteRequestInsert, QuoteRequestUpdate, QuoteRequestStatus } from '@/types/quote-requests'
import { generateId } from '@/lib/utils'

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface QuoteRequestFilters {
  status?: QuoteRequestStatus
  page?: number
  perPage?: number
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getQuoteRequests(
  filters: QuoteRequestFilters = {},
): Promise<ApiResponse<PaginatedResponse<QuoteRequest>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Unauthenticated', code: '401' } }

    const { page = 1, perPage = 20, status } = filters
    const from = (page - 1) * perPage

    let query = supabase
      .from('quote_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1)

    if (error) return { data: null, error: { message: error.message, code: error.code } }

    return {
      data: {
        data: (data ?? []) as QuoteRequest[],
        total: count ?? 0,
        page,
        perPage,
        totalPages: Math.ceil((count ?? 0) / perPage),
      },
      error: null,
    }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function getQuoteRequestById(id: string): Promise<ApiResponse<QuoteRequest>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: data as QuoteRequest, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    return count ?? 0
  } catch {
    return 0
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequestStatus,
  rejectionReason?: string,
): Promise<ApiResponse<QuoteRequest>> {
  try {
    const supabase = await createClient()

    const update: QuoteRequestUpdate = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (rejectionReason !== undefined) {
      update.rejection_reason = rejectionReason
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: data as QuoteRequest, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

// ─── Quote Draft ───────────────────────────────────────────────────────────────

export interface SaveDraftInput {
  quoteRequestId: string
  existingQuoteId?: string | null
  subject: string
  items: QuoteItem[]
  discountPercent: number
  notes: string
  payment: string
  validDays: number
  clientNif: string
  subtotal: number
  vatTotal: number
  grandTotal: number
  generatedByAI: boolean
}

export async function saveQuoteDraft(
  input: SaveDraftInput,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Unauthenticated', code: '401' } }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + input.validDays)

    const lineItems = input.items.map((item) => ({
      id: item.id || generateId(),
      description: item.description,
      quantity: item.qty,
      unit_price: item.unit_price,
      total: item.qty * item.unit_price,
    }))

    const quotePayload = {
      user_id: user.id,
      title: input.subject || 'Orçamento sem título',
      status: 'draft' as const,
      total_amount: input.grandTotal,
      currency: 'EUR',
      valid_until: validUntil.toISOString(),
      line_items: lineItems,
      notes: [
        input.notes,
        input.payment ? `Pagamento: ${input.payment}` : '',
        input.clientNif ? `NIF: ${input.clientNif}` : '',
        input.discountPercent ? `Desconto: ${input.discountPercent}%` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      quote_request_id: input.quoteRequestId,
      generated_by_ai: input.generatedByAI,
      ai_generated: input.generatedByAI,
      updated_at: new Date().toISOString(),
    }

    if (input.existingQuoteId) {
      const { data, error } = await supabase
        .from('quotes')
        .update(quotePayload)
        .eq('id', input.existingQuoteId)
        .select('id')
        .single()

      if (error) return { data: null, error: { message: error.message, code: error.code } }
      return { data: { id: data.id }, error: null }
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert(quotePayload)
      .select('id')
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: { id: data.id }, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

// ─── Public insert (used from API route, not directly from client) ─────────────

export async function createPublicQuoteRequest(
  input: QuoteRequestInsert,
  userId: string,
): Promise<ApiResponse<QuoteRequest>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quote_requests')
      .insert({ ...input, user_id: userId })
      .select()
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: data as QuoteRequest, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}
