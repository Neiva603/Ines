import { cn } from '@/lib/utils'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  CONTACT_STATUS_LABELS,
  CONTACT_STATUS_COLORS,
} from '@/lib/constants'
import type { Quote, Contact } from '@/types'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error:   'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
} as const

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function QuoteStatusBadge({ status }: { status: Quote['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        QUOTE_STATUS_COLORS[status],
      )}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  )
}

export function ContactStatusBadge({ status }: { status: Contact['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        CONTACT_STATUS_COLORS[status],
      )}
    >
      {CONTACT_STATUS_LABELS[status]}
    </span>
  )
}
