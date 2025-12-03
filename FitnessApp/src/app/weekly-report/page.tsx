import Link from 'next/link'
import { verifySession } from '@/lib/auth'
import WeeklyDailyChart from './WeeklyDailyChart'
import { getWeeklyReport } from '@/lib/services/weeklyReport'
import WeeklyPie from './WeeklyPie'

export default async function WeeklyReportPage() {
  const session = await verifySession()
  if (!session || !(session as any).uid) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Weekly Report</h1>
        <p className="text-sm text-gray-500 mt-2">Please login to view your weekly report.</p>
      </div>
    )
  }

  const report = await getWeeklyReport((session as any).uid as string)

  const ratePct = Math.round((report.totals.completionRate || 0) * 100)
  const deltaPct = Math.round((report.wow.completionRateDelta || 0) * 100)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to Home</Link>
      </div>
      <div className="bg-white/70 rounded-2xl border p-5">
        <h1 className="text-3xl font-extrabold text-purple-700">Weekly Report</h1>
        <p className="text-sm text-gray-600 mt-1">
          Latest Todo Progress (Day 1 → Day 7)
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-gray-500">Total Check-ins</div>
          <div className="text-2xl font-bold mt-1">{report.totals.completedCount}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-gray-500">Todos Touched</div>
          <div className="text-2xl font-bold mt-1">{report.totals.todosTouched}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className={`text-xs ${deltaPct === 0 ? 'text-gray-500' : deltaPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {deltaPct > 0 ? '+' : ''}{deltaPct}%
            </div>
          </div>
          <div className="mt-2 h-2 w-full bg-gray-200 rounded">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded" style={{ width: `${Math.min(100, ratePct)}%` }} />
          </div>
          <div className="mt-1 text-xs text-gray-600">{ratePct}% ({report.totals.completedCount}/{report.totals.scheduledCount || 0})</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-gray-500">Streak</div>
          <div className="text-2xl font-bold mt-1">{report.streakDays}d</div>
        </div>
      </section>

      <section className="rounded-2xl border p-4 bg-white">
        <h2 className="font-medium mb-3">Daily Check-ins</h2>
        <WeeklyDailyChart
          weekStart={report.weekStart}
          dailyCounts={report.daily.map((d) => d.completedCount)}
        />
      </section>

      <section className="rounded-2xl border p-4 bg-white">
        <h2 className="font-medium mb-3">Diet vs Exercise</h2>
        <WeeklyPie
          dietCompleted={report.breakdown?.dietCompleted || 0}
          dietScheduled={report.breakdown?.dietScheduled || 0}
          exerciseCompleted={report.breakdown?.exerciseCompleted || 0}
          exerciseScheduled={report.breakdown?.exerciseScheduled || 0}
        />
      </section>

      <section className="rounded-2xl border p-4 bg-white">
        <h2 className="font-medium mb-3">Top Todos</h2>
        {report.topTodos.length === 0 ? (
          <div className="text-sm text-gray-500">No data yet this week.</div>
        ) : (
          <ul className="space-y-2">
            {report.topTodos.map((t) => (
              <li key={t.todoId} className="flex items-center justify-between rounded border p-2">
                <span className="truncate">{t.title}</span>
                <span className="text-sm font-mono">{t.completedCount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


