import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAllTodos } from '@/lib/services/todo'

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession()
    const headerUserId = req.headers.get('x-user-id') || undefined
    const userId = (session as any)?.uid || headerUserId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const todos = await getAllTodos(userId)
    return NextResponse.json({ todos })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

