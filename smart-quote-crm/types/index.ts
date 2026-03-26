export type { Database, LineItem, Json } from './database'
export type {
  Contact,
  ContactInsert,
  ContactUpdate,
  Quote,
  QuoteInsert,
  QuoteUpdate,
  Profile,
  ApiSuccess,
  ApiError,
  ApiResponse,
  GenerateQuoteRequest,
  GenerateQuoteResponse,
  PaginationParams,
  PaginatedResponse,
  ContactFilters,
  QuoteFilters,
} from './api'
export type {
  QuoteRequest,
  QuoteRequestInsert,
  QuoteRequestUpdate,
  QuoteRequestStatus,
  QuoteItem,
  QuoteEditorState,
  GenerateQuoteFromRequestResponse,
} from './quote-requests'

// ─── UI-specific types ───────────────────────────────────────────────────────

export type NavItem = {
  label: string
  href: string
  icon: string
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
}
