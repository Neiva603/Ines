import type { Database, LineItem } from './database'

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export type Quote = Database['public']['Tables']['quotes']['Row']
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert']
export type QuoteUpdate = Database['public']['Tables']['quotes']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']

// ─── API Response wrappers ──────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── AI Quote Generation ────────────────────────────────────────────────────

export interface GenerateQuoteRequest {
  contactId: string
  prompt: string
  context?: {
    contactName?: string
    company?: string
    previousQuotes?: number
  }
}

export interface GenerateQuoteResponse {
  title: string
  description: string
  lineItems: LineItem[]
  totalAmount: number
  notes: string
  validDays: number
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ContactFilters extends PaginationParams {
  status?: Contact['status']
  search?: string
  tags?: string[]
}

export interface QuoteFilters extends PaginationParams {
  status?: Quote['status']
  contactId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}
