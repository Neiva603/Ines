import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = { title: 'Definições' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <Header title="Definições" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Conta</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="text-gray-400 w-24 shrink-0">Email</dt>
              <dd className="text-gray-800">{user?.email}</dd>
            </div>
            {profile?.full_name && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-24 shrink-0">Nome</dt>
                <dd className="text-gray-800">{profile.full_name}</dd>
              </div>
            )}
            {profile?.company_name && (
              <div className="flex gap-3">
                <dt className="text-gray-400 w-24 shrink-0">Empresa</dt>
                <dd className="text-gray-800">{profile.company_name}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="text-gray-400 w-24 shrink-0">Perfil</dt>
              <dd className="text-gray-800 capitalize">{profile?.role ?? 'admin'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Link público</h2>
          <p className="text-sm text-gray-500 mb-3">
            Partilhe este link com os seus clientes para receberem pedidos de orçamento.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-sm text-brand-600 font-mono">/pedir-orcamento</code>
          </div>
        </div>
      </div>
    </div>
  )
}
