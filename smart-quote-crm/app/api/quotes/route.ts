import { NextRequest, NextResponse } from 'next/server'
import { getQuotes, createQuote } from '@/services/quotes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const result = await getQuotes({
    page:      Number(searchParams.get('page') ?? 1),
    perPage:   Number(searchParams.get('perPage') ?? 20),
    status:    (searchParams.get('status') as Parameters<typeof getQuotes>[0]['status']) ?? undefined,
    contactId: searchParams.get('contactId') ?? undefined,
    search:    searchParams.get('search') ?? undefined,
    sortBy:    searchParams.get('sortBy') ?? 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
  })

  if (result.error) {
    return NextResponse.json(result, { status: result.error.code === '401' ? 401 : 500 })
  }
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await createQuote(body)

  if (result.error) {
    return NextResponse.json(result, { status: result.error.code === '401' ? 401 : 422 })
  }
  return NextResponse.json(result, { status: 201 })
}
