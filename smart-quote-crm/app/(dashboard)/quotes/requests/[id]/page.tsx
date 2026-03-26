'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuoteEditor } from '@/hooks/useQuoteEditor'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  VAT_RATES,
  ROUTES,
} from '@/lib/constants'
import type { QuoteRequest, QuoteRequestStatus } from '@/types/quote-requests'

// ─── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  return { toast, show }
}

// ─── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rejeitar pedido</h2>
        <Textarea
          label="Motivo (opcional)"
          placeholder="Indique o motivo da rejeição…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => onConfirm(reason)}>
            Confirmar rejeição
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge + dropdown ───────────────────────────────────────────────────

const ALL_STATUSES: QuoteRequestStatus[] = [
  'pending',
  'reviewing',
  'approved',
  'sent',
  'rejected',
]

function StatusSelector({
  value,
  onChange,
}: {
  value: QuoteRequestStatus
  onChange: (s: QuoteRequestStatus) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as QuoteRequestStatus)}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500',
        REQUEST_STATUS_COLORS[value],
      )}
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {REQUEST_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function QuoteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [request, setRequest] = useState<QuoteRequest | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)

  const { toast, show: showToast } = useToast()
  const editor = useQuoteEditor(id)

  // ─── Fetch request + existing quote ───────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: req }, { data: existingQuote }] = await Promise.all([
        supabase
          .from('quote_requests')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('quotes')
          .select('*')
          .eq('quote_request_id', id)
          .maybeSingle(),
      ])

      if (req) setRequest(req as QuoteRequest)

      if (existingQuote) {
        editor.loadExistingQuote(existingQuote.id, {
          title: existingQuote.title,
          line_items: existingQuote.line_items as Array<{
            id?: string
            description: string
            quantity: number
            unit_price: number
          }>,
          notes: existingQuote.notes,
          valid_until: existingQuote.valid_until,
          generated_by_ai: existingQuote.generated_by_ai ?? existingQuote.ai_generated,
        })
        setAiGenerated(existingQuote.generated_by_ai ?? existingQuote.ai_generated)
      }

      setPageLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ─── Status change ─────────────────────────────────────────────────────────

  async function handleStatusChange(status: QuoteRequestStatus) {
    if (!request) return
    const supabase = createClient()
    const { error } = await supabase
      .from('quote_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', request.id)

    if (error) {
      showToast('Erro ao actualizar estado', 'error')
    } else {
      setRequest((prev) => (prev ? { ...prev, status } : prev))
      showToast('Estado actualizado')
    }
  }

  // ─── Reject ────────────────────────────────────────────────────────────────

  async function handleReject(reason: string) {
    if (!request) return
    const supabase = createClient()
    const { error } = await supabase
      .from('quote_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id)

    setShowRejectModal(false)
    if (error) {
      showToast('Erro ao rejeitar pedido', 'error')
    } else {
      setRequest((prev) => (prev ? { ...prev, status: 'rejected', rejection_reason: reason || null } : prev))
      showToast('Pedido rejeitado')
    }
  }

  // ─── Save draft ────────────────────────────────────────────────────────────

  async function handleSaveDraft() {
    const err = await editor.saveDraft()
    if (err) {
      showToast(err, 'error')
    } else {
      showToast('Rascunho guardado!')
    }
  }

  // ─── Approve + PDF ─────────────────────────────────────────────────────────

  async function handleApproveAndPDF() {
    const err = await editor.saveDraft()
    if (err) {
      showToast(err, 'error')
      return
    }
    await handleStatusChange('sent')
    window.print()
  }

  // ─── Copy to WhatsApp ──────────────────────────────────────────────────────

  function handleCopyWhatsApp() {
    if (!request) return
    const lines = [
      `*Orçamento — ${editor.subject || 'Sem título'}*`,
      `Cliente: ${request.client_name}`,
      '',
      ...editor.items.map(
        (item, i) =>
          `${i + 1}. ${item.description}${item.detail ? ` (${item.detail})` : ''} — ${item.qty}x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.qty * item.unit_price)}`,
      ),
      '',
      `Subtotal: ${formatCurrency(editor.subtotal)}`,
      `IVA: ${formatCurrency(editor.vatTotal)}`,
      editor.discountPercent > 0
        ? `Desconto (${editor.discountPercent}%): -${formatCurrency(editor.discountAmount)}`
        : null,
      `*Total: ${formatCurrency(editor.grandTotal)}*`,
      editor.notes ? `\nObservações: ${editor.notes}` : null,
      editor.payment ? `Pagamento: ${editor.payment}` : null,
    ]
      .filter((l) => l !== null)
      .join('\n')

    navigator.clipboard
      .writeText(lines)
      .then(() => showToast('Copiado para a área de transferência!'))
      .catch(() => showToast('Erro ao copiar', 'error'))
  }

  // ─── AI generation ─────────────────────────────────────────────────────────

  async function handleGenerateAI() {
    if (!request) return
    const err = await editor.generateWithAI(request.request_text)
    if (err) {
      showToast(err, 'error')
    } else {
      setAiGenerated(true)
      showToast('Orçamento gerado com IA!')
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="p-8 space-y-4 max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-gray-500">
        Pedido não encontrado.{' '}
        <a href={ROUTES.quoteRequests} className="text-brand-600 underline">
          Voltar à lista
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all no-print',
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white',
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}

      <div className="max-w-6xl mx-auto pb-28 px-4 pt-6 md:px-8">
        {/* Back link */}
        <a
          href={ROUTES.quoteRequests}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 no-print"
        >
          ← Pedidos
        </a>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ─── LEFT: Request details ───────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              {/* Status */}
              <div className="flex items-center justify-between mb-5 no-print">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Estado
                </span>
                <StatusSelector
                  value={request.status}
                  onChange={handleStatusChange}
                />
              </div>

              {/* Client info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                  <p className="font-medium text-gray-900">{request.client_name}</p>
                </div>
                {request.client_company && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
                    <p className="text-gray-800">{request.client_company}</p>
                  </div>
                )}
                {request.client_email && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <a
                      href={`mailto:${request.client_email}`}
                      className="text-brand-600 hover:underline"
                    >
                      {request.client_email}
                    </a>
                  </div>
                )}
                {request.client_phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Telemóvel</p>
                    <a
                      href={`tel:${request.client_phone}`}
                      className="text-brand-600 hover:underline"
                    >
                      {request.client_phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Data</p>
                  <p className="text-gray-800">
                    {formatDate(request.created_at, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    <span className="text-gray-400">
                      ({formatRelativeTime(request.created_at)})
                    </span>
                  </p>
                </div>
              </div>

              {/* Request text */}
              <div className="mt-5">
                <p className="text-xs text-gray-400 mb-2">Pedido</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                  {request.request_text}
                </div>
              </div>

              {/* Rejection reason */}
              {request.rejection_reason && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-500 mb-1 font-medium">Motivo de rejeição</p>
                  <p className="text-sm text-red-700">{request.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Quote editor ─────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {!aiGenerated && editor.items.every((i) => !i.description) ? (
              /* Generate with AI prompt */
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <p className="text-gray-500 mb-6 text-sm">
                  Gere automaticamente o orçamento com base no pedido do cliente.
                </p>
                <Button
                  onClick={handleGenerateAI}
                  disabled={editor.isLoading}
                  className="gap-2"
                >
                  {editor.isLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      A gerar…
                    </>
                  ) : (
                    '✨ Gerar Orçamento com IA'
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                {/* Subject */}
                <Input
                  label="Assunto do orçamento"
                  placeholder="Ex: Website profissional + loja online"
                  value={editor.subject}
                  onChange={(e) => editor.setSubject(e.target.value)}
                />

                {/* Items table */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Itens</p>
                  <div className="rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="text-left px-3 py-2 font-medium w-[32%]">Descrição</th>
                          <th className="text-left px-3 py-2 font-medium w-[20%]">Detalhe</th>
                          <th className="text-right px-3 py-2 font-medium w-[7%]">Qtd</th>
                          <th className="text-right px-3 py-2 font-medium w-[14%]">Preço unit.</th>
                          <th className="text-right px-3 py-2 font-medium w-[10%]">IVA %</th>
                          <th className="text-right px-3 py-2 font-medium w-[12%]">Total</th>
                          <th className="w-[5%]" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editor.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2">
                              <input
                                className="w-full border-0 bg-transparent focus:outline-none text-gray-900 placeholder-gray-300"
                                placeholder="Nome do item"
                                value={item.description}
                                onChange={(e) =>
                                  editor.updateItem(idx, 'description', e.target.value)
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                className="w-full border-0 bg-transparent focus:outline-none text-gray-600 placeholder-gray-300 text-xs"
                                placeholder="Detalhe"
                                value={item.detail}
                                onChange={(e) =>
                                  editor.updateItem(idx, 'detail', e.target.value)
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="w-full border-0 bg-transparent text-right focus:outline-none text-gray-900"
                                value={item.qty}
                                onChange={(e) =>
                                  editor.updateItem(idx, 'qty', Number(e.target.value))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="w-full border-0 bg-transparent text-right focus:outline-none text-gray-900"
                                value={item.unit_price}
                                onChange={(e) =>
                                  editor.updateItem(idx, 'unit_price', Number(e.target.value))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                className="w-full border-0 bg-transparent text-right focus:outline-none text-gray-900 cursor-pointer"
                                value={item.vat}
                                onChange={(e) =>
                                  editor.updateItem(idx, 'vat', Number(e.target.value))
                                }
                              >
                                {VAT_RATES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}%
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700 font-medium">
                              {formatCurrency(item.qty * item.unit_price)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => editor.removeItem(idx)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                                aria-label="Remover item"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-3 py-2 border-t border-gray-100">
                      <button
                        onClick={editor.addItem}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        + Adicionar item
                      </button>
                    </div>
                  </div>
                </div>

                {/* Discount + Totals */}
                <div className="grid grid-cols-2 gap-5 items-start">
                  <Input
                    label="Desconto %"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={editor.discountPercent}
                    onChange={(e) => editor.setDiscountPercent(Number(e.target.value))}
                  />

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(editor.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IVA</span>
                      <span>{formatCurrency(editor.vatTotal)}</span>
                    </div>
                    {editor.discountPercent > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto ({editor.discountPercent}%)</span>
                        <span>-{formatCurrency(editor.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(editor.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes + Payment */}
                <Textarea
                  label="Condições e observações"
                  placeholder="Inclui 12 meses de suporte técnico. Preços válidos por 30 dias."
                  value={editor.notes}
                  onChange={(e) => editor.setNotes(e.target.value)}
                  rows={3}
                />

                <Textarea
                  label="Dados de pagamento"
                  placeholder="IBAN: PT50 …&#10;Referência MB: …"
                  value={editor.payment}
                  onChange={(e) => editor.setPayment(e.target.value)}
                  rows={2}
                />

                <div className="grid grid-cols-2 gap-5">
                  <Input
                    label="Validade (dias)"
                    type="number"
                    min={1}
                    value={editor.validDays}
                    onChange={(e) => editor.setValidDays(Number(e.target.value))}
                  />
                  <Input
                    label="NIF do cliente (opcional)"
                    placeholder="PT 123 456 789"
                    value={editor.clientNif}
                    onChange={(e) => editor.setClientNif(e.target.value)}
                  />
                </div>

                {/* Re-generate button */}
                <div className="no-print">
                  <button
                    onClick={handleGenerateAI}
                    disabled={editor.isLoading}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                  >
                    {editor.isLoading ? 'A gerar…' : '✨ Regenerar com IA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sticky action bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3 no-print z-40">
        {editor.lastSaved && (
          <span className="text-xs text-gray-400 mr-auto">
            Guardado às{' '}
            {editor.lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {!editor.lastSaved && <span className="mr-auto" />}

        <Button
          variant="danger"
          onClick={() => setShowRejectModal(true)}
          disabled={request.status === 'rejected'}
        >
          Rejeitar
        </Button>

        <Button variant="ghost" onClick={handleCopyWhatsApp}>
          Copiar para WhatsApp
        </Button>

        <Button
          variant="secondary"
          onClick={handleSaveDraft}
          disabled={editor.isLoading}
        >
          {editor.isLoading ? 'A guardar…' : 'Guardar rascunho'}
        </Button>

        <Button
          onClick={handleApproveAndPDF}
          disabled={editor.isLoading}
        >
          Aprovar e fazer download PDF
        </Button>
      </div>
    </>
  )
}
