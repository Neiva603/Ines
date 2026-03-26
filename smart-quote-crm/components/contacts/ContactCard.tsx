import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ContactStatusBadge } from '@/components/ui/Badge'
import { ROUTES } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import type { Contact } from '@/types'

interface ContactCardProps {
  contact: Contact
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Link href={ROUTES.contact(contact.id)}>
      <Card hover className="animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {contact.name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{contact.name}</p>
              {contact.company && (
                <p className="text-sm text-gray-500">{contact.company}</p>
              )}
            </div>
          </div>
          <ContactStatusBadge status={contact.status} />
        </div>

        <div className="mt-4 space-y-1 text-sm text-gray-500">
          {contact.email && <p>✉ {contact.email}</p>}
          {contact.phone && <p>📞 {contact.phone}</p>}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Added {formatRelativeTime(contact.created_at)}
        </p>
      </Card>
    </Link>
  )
}
