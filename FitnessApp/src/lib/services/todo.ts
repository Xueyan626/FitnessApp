import { prisma } from '../prisma'

export async function getAllTodos(userId: string) {
  return prisma.todo.findMany({
    where: { userId },
    include: { items: { orderBy: { dayIndex: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createTodo(input: {
  userId: string
  planId?: string | null
  title: string
  pointsPerCheck?: number
}) {
  const { userId, planId, title, pointsPerCheck = 5 } = input

  let finalTitle = title
  if (planId) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    const planTitle = (plan as any)?.content?.title || (plan as any)?.title
    if (planTitle) finalTitle = planTitle as string
  }

  const todo = await prisma.todo.create({
    data: { userId, planId: planId ?? null, title: finalTitle, pointsPerCheck },
  })

  // Create 7 empty checklist items (no text written, read from planId in real-time)
  const itemsToCreate: Array<{ todoId: string; dayIndex: number; completed: boolean }> = []
  if (planId) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    const content = (plan as any)?.content
    const orderKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    
    if (content?.diet && content?.exercise) {
      // Structured Plan: Diet and Exercise
      for (let i = 0; i < 7; i++) {
        const dayIdx = i + 1
        const key = orderKeys[i]
        // Diet: 1 item per day
        itemsToCreate.push({ todoId: todo.id, dayIndex: dayIdx, completed: false })
        // Exercise: 1 item per exercise
        const exs: string[] = Array.isArray(content.exercise?.[key]) ? content.exercise[key] : []
        exs.forEach(() => {
          itemsToCreate.push({ todoId: todo.id, dayIndex: dayIdx, completed: false })
        })
      }
    } else {
      // 1 item per day
      for (let i = 1; i <= 7; i++) {
        itemsToCreate.push({ todoId: todo.id, dayIndex: i, completed: false })
      }
    }
  } else {
    // No planId: default 1 item per day
    for (let i = 1; i <= 7; i++) {
      itemsToCreate.push({ todoId: todo.id, dayIndex: i, completed: false })
    }
  }

  if (itemsToCreate.length) {
    await prisma.checklistItem.createMany({ data: itemsToCreate })
  }

  return prisma.todo.findUnique({ where: { id: todo.id }, include: { items: true } })
}

export async function completeTodo(userId: string, todoId: string, completed: boolean) {
  return prisma.$transaction(async (tx) => {
    const todo = await tx.todo.findUnique({ where: { id: todoId } })
    if (!todo || todo.userId !== userId) throw new Error('Not found')

    if (todo.completed === completed) return todo

    const updated = await tx.todo.update({
      where: { id: todoId },
      data: { completed },
    })

    // Do not add points here; points are handled when toggling checklist items
    return updated
  })
}

export async function getLatestTodoWithItems(userId: string) {
  const todo = await prisma.todo.findFirst({
    where: { userId, completed: false },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { dayIndex: 'asc' } } },
  })
  return todo
}

export async function toggleChecklistItem(
  userId: string,
  todoId: string,
  itemId: string,
  completed: boolean
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.checklistItem.findUnique({
      where: { id: itemId },
      include: { todo: true },
    })
    if (!item || item.todo.userId !== userId || item.todoId !== todoId) throw new Error('Not found')

    if (completed && !item.completed) {
      await tx.checklistItem.update({
        where: { id: itemId },
        data: { completed: true, completedAt: null }, // Do not record real time
      })
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: 10 } },
      })
      await tx.reward.create({
        data: { userId, points: 10, kind: 'CHECK_ITEM', note: `item:${itemId}` },
      })
    } else if (!completed && item.completed) {
      await tx.checklistItem.update({
        where: { id: itemId },
        data: { completed: false, completedAt: null },
      })
      // Revoke check: deduct points
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: 10 } },
      })
      await tx.reward.create({
        data: { userId, points: -10, kind: 'CHECK_ITEM_REVOKE', note: `item:${itemId}:undo` },
      })
    }

    const left = await tx.checklistItem.count({ where: { todoId, completed: false } })
    const targetCompleted = left === 0
    if (item.todo.completed !== targetCompleted) {
      await tx.todo.update({ where: { id: todoId }, data: { completed: targetCompleted } })
    }

    return { ok: true }
  })
}


