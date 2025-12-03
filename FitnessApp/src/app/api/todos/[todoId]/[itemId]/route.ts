import { NextRequest, NextResponse } from 'next/server'
import { toggleChecklistItem } from '@/lib/services/todo'
import { verifySession } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { todoId: string; itemId: string } }
) {
  try {
    const session = await verifySession()
    const headerUserId = req.headers.get('x-user-id') || undefined
    const userId = (session as any)?.uid || headerUserId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { completed } = await req.json()
    const data = await toggleChecklistItem(userId, params.todoId, params.itemId, !!completed)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}



