import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyReport } from '@/lib/services/weeklyReport'
import { verifySession } from '@/lib/auth'

function parseWeekStart(value: string | null): Date | undefined {
  if (!value) return undefined
  const m = value.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/)
  if (!m) return undefined
  const iso = `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? undefined : d
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession()
    const headerUserId = req.headers.get('x-user-id') || undefined
    const userId = (session as any)?.uid || headerUserId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const weekStartParam = searchParams.get('weekStart')
    const weekStartDate = parseWeekStart(weekStartParam)

    const data = await getWeeklyReport(userId, weekStartDate)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


