import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, QUOTE_GENERATION_CONFIG } from '@/lib/claude'
import { generateQuoteWithAI } from '@/services/ai'
import type { GenerateQuoteRequest } from '@/types'
import type { GenerateQuoteFromRequestResponse } from '@/types/quote-requests'
import { generateId } from '@/lib/utils'

// ─── System prompt for request-based generation ───────────────────────────────

const REQUEST_SYSTEM_PROMPT = `És um assistente de vendas profissional português.
A tua tarefa é gerar orçamentos comerciais estruturados e realistas com base na descrição do cliente.

Responde SEMPRE com JSON válido seguindo este schema exacto:
{
  "subject": "string — título conciso do orçamento",
  "items": [
    {
      "description": "string — nome do item/serviço",
      "detail": "string — detalhe ou especificação (pode ser vazio)",
      "qty": number,
      "unit_price": number,
      "vat": number
    }
  ],
  "discount_percent": number,
  "notes": "string — condições, prazo de entrega, garantia",
  "payment": "string — condições de pagamento"
}

Regras:
- Preços em EUR, realistas para o mercado português
- IVA: 23% por defeito (6% para serviços essenciais, 0% quando aplicável)
- discount_percent: 0 por defeito, a não ser que seja óbvio um desconto
- Responde APENAS com o objecto JSON, sem markdown`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthenticated', code: '401' } },
      { status: 401 },
    )
  }

  const body = await request.json()

  // ── New format: request_text from /pedir-orcamento flow ──────────────────
  if (body.request_text) {
    const { request_text, company_sector, catalog } = body as {
      request_text: string
      company_sector?: string
      catalog?: string
    }

    if (!request_text?.trim()) {
      return NextResponse.json(
        { data: null, error: { message: 'request_text is required', code: '400' } },
        { status: 400 },
      )
    }

    try {
      const contextParts: string[] = []
      if (company_sector) contextParts.push(`Sector: ${company_sector}`)
      if (catalog) contextParts.push(`Catálogo/preçário:\n${catalog}`)

      const userMessage = contextParts.length
        ? `${contextParts.join('\n')}\n\nPedido do cliente:\n${request_text}`
        : `Pedido do cliente:\n${request_text}`

      const message = await anthropic.messages.create({
        ...QUOTE_GENERATION_CONFIG,
        system: REQUEST_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })

      const rawText = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('')

      const parsed = JSON.parse(rawText) as GenerateQuoteFromRequestResponse & {
        items: Array<{
          id?: string
          description: string
          detail?: string
          qty: number
          unit_price: number
          vat: number
        }>
      }

      const result: GenerateQuoteFromRequestResponse = {
        ...parsed,
        items: parsed.items.map((item) => ({
          description: item.description,
          detail: item.detail ?? '',
          qty: item.qty,
          unit_price: item.unit_price,
          vat: item.vat ?? 23,
        })),
      }

      return NextResponse.json({ data: result, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed'
      return NextResponse.json(
        { data: null, error: { message, code: '500' } },
        { status: 500 },
      )
    }
  }

  // ── Legacy format: contactId + prompt ────────────────────────────────────
  const legacyBody = body as GenerateQuoteRequest

  if (!legacyBody.prompt?.trim()) {
    return NextResponse.json(
      { data: null, error: { message: 'prompt or request_text is required', code: '400' } },
      { status: 400 },
    )
  }

  const result = await generateQuoteWithAI(legacyBody)

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
