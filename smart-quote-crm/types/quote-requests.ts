// ─── Quote Request ────────────────────────────────────────────────────────────

export type QuoteRequestStatus = 'pending' | 'reviewing' | 'approved' | 'sent' | 'rejected'

export interface QuoteRequest {
  id: string
  user_id: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  client_company: string | null
  request_text: string
  status: QuoteRequestStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface QuoteRequestInsert {
  user_id?: string | null
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_company?: string | null
  request_text: string
  status?: QuoteRequestStatus
}

export interface QuoteRequestUpdate {
  status?: QuoteRequestStatus
  rejection_reason?: string | null
  updated_at?: string
}

// ─── Quote Item (editor model) ────────────────────────────────────────────────

export interface QuoteItem {
  id: string
  description: string
  detail: string
  qty: number
  unit_price: number
  /** VAT rate as a percentage, e.g. 23 for 23 % */
  vat: number
}

// ─── Quote Editor State ───────────────────────────────────────────────────────

export interface QuoteEditorState {
  subject: string
  items: QuoteItem[]
  discount_percent: number
  notes: string
  payment: string
  valid_days: number
  client_nif: string
}

// ─── AI generate-quote response format ───────────────────────────────────────

export interface GenerateQuoteFromRequestResponse {
  subject: string
  items: Array<{
    description: string
    detail: string
    qty: number
    unit_price: number
    vat: number
  }>
  discount_percent: number
  notes: string
  payment: string
}
