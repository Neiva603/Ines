import { NextRequest, NextResponse } from 'next/server'
import { getContactById, updateContact, deleteContact } from '@/services/contacts'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const result = await getContactById(id)
  if (result.error) return NextResponse.json(result, { status: 404 })
  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const result = await updateContact(id, body)
  if (result.error) return NextResponse.json(result, { status: 422 })
  return NextResponse.json(result)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const result = await deleteContact(id)
  if (result.error) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result, { status: 204 })
}
