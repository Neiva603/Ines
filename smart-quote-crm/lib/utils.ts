import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as currency */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'pt-PT',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format an ISO date string to a human-readable date */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale = 'pt-PT',
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(dateString))
}

/** Return relative time string (e.g. "3 days ago") */
export function formatRelativeTime(dateString: string, locale = 'pt-PT'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diffMs = new Date(dateString).getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    return rtf.format(diffHours, 'hour')
  }
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) {
    return rtf.format(Math.round(diffDays / 30), 'month')
  }
  return rtf.format(Math.round(diffDays / 365), 'year')
}

/** Generate a short unique ID for line items (client-side only) */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/** Check if a value is a non-empty string */
export function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
