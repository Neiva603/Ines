import { createClient } from '@/lib/supabase/server'
import type {
  Contact,
  ContactInsert,
  ContactUpdate,
  ContactFilters,
  PaginatedResponse,
  ApiResponse,
} from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export async function getContacts(
  filters: ContactFilters = {},
): Promise<ApiResponse<PaginatedResponse<Contact>>> {
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
      search,
    } = filters

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
      )
    }

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
  } catch (err) {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function getContactById(id: string): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function createContact(
  input: Omit<ContactInsert, 'user_id'>,
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Unauthenticated', code: '401' } }

    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}

export async function updateContact(
  id: string,
  input: ContactUpdate,
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
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

export async function deleteContact(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('contacts').delete().eq('id', id)

    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: null, error: null }
  } catch {
    return { data: null, error: { message: 'Unexpected error', code: '500' } }
  }
}
