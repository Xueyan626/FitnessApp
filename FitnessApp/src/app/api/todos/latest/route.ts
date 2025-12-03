import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getLatestTodoWithItems, createTodo } from '@/lib/services/todo'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession()
    const headerUserId = req.headers.get('x-user-id') || undefined
    const userId = (session as any)?.uid || headerUserId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let todo = await getLatestTodoWithItems(userId)
    if (!todo) {
      // If no todo exists, create one from latest Plan
      const plan = await prisma.plan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      const planTitle = (plan?.content as any)?.title || 'Weekly Plan'
      todo = await createTodo({ userId, planId: plan?.id ?? null, title: planTitle })
    }
    return NextResponse.json({ todo })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


