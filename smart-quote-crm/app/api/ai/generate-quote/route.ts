import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuoteWithAI } from '@/services/ai'
import type { GenerateQuoteRequest } from '@/types'

export async function POST(request: NextRequest) {
  // Auth guard — must be logged in to use AI generation
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

  const body: GenerateQuoteRequest = await request.json()

  if (!body.prompt?.trim()) {
    return NextResponse.json(
      { data: null, error: { message: 'prompt is required', code: '400' } },
      { status: 400 },
    )
  }

  const result = await generateQuoteWithAI(body)

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
