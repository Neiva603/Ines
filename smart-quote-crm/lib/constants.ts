// ─── Routes ──────────────────────────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  contacts: '/contacts',
  contactNew: '/contacts/new',
  contact: (id: string) => `/contacts/${id}`,
  quotes: '/quotes',
  quoteNew: '/quotes/new',
  quote: (id: string) => `/quotes/${id}`,
  settings: '/settings',
} as const

// ─── Quote statuses ───────────────────────────────────────────────────────────

export const QUOTE_STATUS_LABELS = {
  draft:    'Draft',
  sent:     'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired:  'Expired',
} as const

export const QUOTE_STATUS_COLORS = {
  draft:    'bg-gray-100 text-gray-700',
  sent:     'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-yellow-100 text-yellow-700',
} as const

// ─── Contact statuses ─────────────────────────────────────────────────────────

export const CONTACT_STATUS_LABELS = {
  lead:     'Lead',
  prospect: 'Prospect',
  customer: 'Customer',
  churned:  'Churned',
} as const

export const CONTACT_STATUS_COLORS = {
  lead:     'bg-purple-100 text-purple-700',
  prospect: 'bg-blue-100 text-blue-700',
  customer: 'bg-green-100 text-green-700',
  churned:  'bg-gray-100 text-gray-700',
} as const

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20

// ─── Quote validity ───────────────────────────────────────────────────────────

export const DEFAULT_QUOTE_VALID_DAYS = 30

// ─── Currencies ───────────────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
