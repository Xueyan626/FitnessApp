import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTodo } from '@/lib/services/todo'

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session as any).uid as string

    const latestPlan = await prisma.plan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    if (!latestPlan) return NextResponse.json({ error: 'No plan found' }, { status: 404 })

    const planTitle = (latestPlan.content as any)?.title || 'Weekly Plan'
    const todo = await createTodo({ userId, planId: latestPlan.id, title: planTitle })
    return NextResponse.json({ todo }, { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}



