import { prisma } from '@/lib/prisma'

export type WeeklyReportStats = {
  weekStart: string
  weekEnd: string
  totals: {
    completedCount: number
    todosTouched: number
    scheduledCount: number
    completionRate: number
  }
  daily: Array<{ date: string; completedCount: number }>
  topTodos: Array<{ todoId: string; title: string; completedCount: number }>
  streakDays: number
  breakdown?: {
    dietScheduled: number
    exerciseScheduled: number
    dietCompleted: number
    exerciseCompleted: number
  }
  wow: {
    completedCountDelta: number
    completionRateDelta: number
    prevWeek: { completedCount: number; scheduledCount: number; completionRate: number }
  }
}

export async function getWeeklyReport(userId: string): Promise<WeeklyReportStats> {
  const weekStart = 'week-start' // Fixed identifier, not real date
  const weekEnd = 'week-end'

  const latestTodo = await prisma.todo.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  if (!latestTodo) {
    return {
      weekStart,
      weekEnd,
      totals: { completedCount: 0, todosTouched: 0, scheduledCount: 0, completionRate: 0 },
      daily: Array.from({ length: 7 }, (_, i) => ({ date: `day${i + 1}`, completedCount: 0 })),
      topTodos: [],
      streakDays: 0,
      breakdown: { dietScheduled: 0, exerciseScheduled: 0, dietCompleted: 0, exerciseCompleted: 0 },
      wow: { completedCountDelta: 0, completionRateDelta: 0, prevWeek: { completedCount: 0, scheduledCount: 0, completionRate: 0 } },
    }
  }

  const scheduledCount = latestTodo.items.length
  const completedItems = latestTodo.items.filter((it) => it.completed)
  const completedCount = completedItems.length

  const dailyCounts: number[] = Array.from({ length: 7 }, () => 0)
  for (const it of completedItems) {
    if (it.dayIndex >= 1 && it.dayIndex <= 7) {
      dailyCounts[it.dayIndex - 1] += 1
    }
  }

  // Diet / Exercise breakdown: first item of a day is Diet, others are Exercise
  let dietScheduled = 7 // 1 Diet item per day
  let exScheduled = 0
  let dietCompleted = 0
  let exCompleted = 0
  
  const dayGroups = new Map<number, Array<typeof latestTodo.items[0]>>()
  for (const item of latestTodo.items) {
    if (!dayGroups.has(item.dayIndex)) {
      dayGroups.set(item.dayIndex, [])
    }
    dayGroups.get(item.dayIndex)!.push(item)
  }
  
  for (const items of dayGroups.values()) {
    if (items.length > 0) {
      const dietItem = items[0]
      if (dietItem.completed) dietCompleted++
      const exItems = items.slice(1)
      exScheduled += exItems.length
      exCompleted += exItems.filter(i => i.completed).length
    }
  }

  // streak: based on dayIndex consecutive days (from 7 backwards to 1, if that day has completions then +1)
  let streakDays = 0
  for (let i = 6; i >= 0; i--) {
    if (dailyCounts[i] > 0) streakDays += 1
    else break
  }

  return {
    weekStart,
    weekEnd,
    totals: {
      completedCount,
      todosTouched: 1,
      scheduledCount,
      completionRate: scheduledCount > 0 ? completedCount / scheduledCount : 0,
    },
    daily: Array.from({ length: 7 }, (_, i) => ({ 
      date: `day${i + 1}`, 
      completedCount: dailyCounts[i] 
    })),
    topTodos: [{ todoId: latestTodo.id, title: latestTodo.title, completedCount }],
    streakDays,
    breakdown: { dietScheduled, exerciseScheduled: exScheduled, dietCompleted, exerciseCompleted: exCompleted },
    wow: {
      completedCountDelta: 0,
      completionRateDelta: 0,
      prevWeek: { completedCount: 0, scheduledCount: 0, completionRate: 0 },
    },
  }
}


