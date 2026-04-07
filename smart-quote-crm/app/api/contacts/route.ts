import { NextRequest, NextResponse } from 'next/server'
import { getContacts, createContact } from '@/services/contacts'
import type { ContactInsert } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const result = await getContacts({
    page:      Number(searchParams.get('page') ?? 1),
    perPage:   Number(searchParams.get('perPage') ?? 20),
    status:    (searchParams.get('status') as ContactInsert['status']) ?? undefined,
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
  const result = await createContact(body)

  if (result.error) {
    return NextResponse.json(result, { status: result.error.code === '401' ? 401 : 422 })
  }
  return NextResponse.json(result, { status: 201 })
}
