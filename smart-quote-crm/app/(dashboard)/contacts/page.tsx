import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { ContactCard } from '@/components/contacts/ContactCard'
import { ROUTES } from '@/lib/constants'
import type { Contact } from '@/types'

export const metadata: Metadata = { title: 'Contacts' }

export default async function ContactsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <Header
        title="Contacts"
        actions={
          <Link href={ROUTES.contactNew}>
            <Button size="sm">+ New contact</Button>
          </Link>
        }
      />
      <div className="p-6">
        {!contacts || contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
            <p className="text-gray-500">No contacts yet.</p>
            <Link href={ROUTES.contactNew} className="mt-4">
              <Button>Add your first contact</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact as Contact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
