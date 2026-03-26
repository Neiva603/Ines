import { anthropic, QUOTE_GENERATION_CONFIG } from '@/lib/claude'
import type { GenerateQuoteRequest, GenerateQuoteResponse, ApiResponse } from '@/types'
import { generateId } from '@/lib/utils'

const SYSTEM_PROMPT = `You are a professional sales assistant for Smart Quote CRM.
Your task is to generate structured, professional commercial quotes based on the user's description.

Always respond with valid JSON matching this exact schema:
{
  "title": "string — concise quote title",
  "description": "string — 1–2 sentence summary of what is being quoted",
  "lineItems": [
    {
      "id": "string",
      "description": "string — item description",
      "quantity": number,
      "unit_price": number,
      "total": number
    }
  ],
  "totalAmount": number,
  "notes": "string — payment terms, delivery notes, or warranty info",
  "validDays": number
}

Rules:
- All prices in the currency specified (default EUR)
- Be realistic and professional
- Line item totals must equal quantity × unit_price
- totalAmount must equal the sum of all line item totals
- validDays should be 30 unless context suggests otherwise
- Respond ONLY with the JSON object, no markdown wrapping`

export async function generateQuoteWithAI(
  request: GenerateQuoteRequest,
): Promise<ApiResponse<GenerateQuoteResponse>> {
  try {
    const contextLines: string[] = []
    if (request.context?.contactName) {
      contextLines.push(`Client: ${request.context.contactName}`)
    }
    if (request.context?.company) {
      contextLines.push(`Company: ${request.context.company}`)
    }
    if (request.context?.previousQuotes !== undefined) {
      contextLines.push(`Previous quotes for this client: ${request.context.previousQuotes}`)
    }

    const userMessage = contextLines.length
      ? `${contextLines.join('\n')}\n\nQuote request: ${request.prompt}`
      : request.prompt

    const message = await anthropic.messages.create({
      ...QUOTE_GENERATION_CONFIG,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    const parsed = JSON.parse(rawText) as Omit<GenerateQuoteResponse, 'lineItems'> & {
      lineItems: Array<{
        id?: string
        description: string
        quantity: number
        unit_price: number
        total: number
      }>
    }

    // Ensure each line item has an id
    const response: GenerateQuoteResponse = {
      ...parsed,
      lineItems: parsed.lineItems.map((item) => ({
        ...item,
        id: item.id ?? generateId(),
      })),
    }

    return { data: response, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return { data: null, error: { message, code: '500' } }
  }
}
