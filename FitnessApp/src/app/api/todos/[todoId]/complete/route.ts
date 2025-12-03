import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { completeTodo, createTodo } from '@/lib/services/todo'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { todoId: string } }
) {
  try {
    const session = await verifySession()
    const headerUserId = req.headers.get('x-user-id') || undefined
    const userId = (session as any)?.uid || headerUserId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { todoId } = params

    // Complete Todo 
    await completeTodo(userId, todoId, true)

    // Get latest plan
    const latestPlan = await prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestPlan) {
      return NextResponse.json({ 
        error: 'No plan found to generate new todo',
        completed: true 
      }, { status: 404 })
    }

    const planTitle = (latestPlan.content as any)?.title || 'Weekly Plan'
    const newTodo = await createTodo({ 
      userId, 
      planId: latestPlan.id, 
      title: planTitle 
    })

    // ensure newTodo include items
    const todoWithItems = await prisma.todo.findUnique({
      where: { id: newTodo.id },
      include: { items: { orderBy: { dayIndex: 'asc' } } },
    })

    return NextResponse.json({ 
      completed: true,
      newTodo: todoWithItems 
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

