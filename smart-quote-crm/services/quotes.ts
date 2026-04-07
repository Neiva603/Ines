import { createClient } from '@/lib/supabase/server'
import type {
  Quote,
  QuoteInsert,
  QuoteUpdate,
  QuoteFilters,
  PaginatedResponse,
  ApiResponse,
} from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export async function getQuotes(
  filters: QuoteFilters = {},
): Promise<ApiResponse<PaginatedResponse<Quote>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Unauthenticated', code: '401' } }

    const {
      page = 1,
      perPage = DEFAULT_PAGE_SIZE,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      contactId,
      search,
      dateFrom,
      dateTo,
    } = filters

    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) query = query.eq('status', status)
    if (contactId) query = query.eq('contact_id', contactId)
    if (search) query = query.ilike('title', `%${search}%`)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) return { data: null, error: { message: error.message, code: error.code } }

    return {
      data: {
        data: data ?? [],
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

export async function getQuoteById(id: string): Promise<ApiResponse<Quote>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function createQuote(
  input: Omit<QuoteInsert, 'user_id'>,
): Promise<ApiResponse<Quote>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Unauthenticated', code: '401' } }

    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function updateQuote(
  id: string,
  input: QuoteUpdate,
): Promise<ApiResponse<Quote>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function deleteQuote(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('quotes').delete().eq('id', id)

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: null, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}
