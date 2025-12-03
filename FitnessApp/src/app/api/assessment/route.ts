import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';

const prisma = new PrismaClient();

type IncomingBody = {
  userId?: string;                   // optional fallback for debugging
  answers: Record<string, number>;   // values 0..5
  questionnaireVersion?: number;
};

const CATEGORIES = {
  yang: 'YANG_DEFICIENCY',
  yin: 'YIN_DEFICIENCY',
  qi: 'QI_DEFICIENCY',
  phlegm: 'PHLEGM_DAMPNESS',
  stasis: 'BLOOD_STASIS',
} as const;

type CategoryKey = keyof typeof CATEGORIES;

function computeScores(answers: Record<string, number>) {
  const buckets: Record<CategoryKey, number> = {
    yang: 0,
    yin: 0,
    qi: 0,
    phlegm: 0,
    stasis: 0,
  };
  for (const [k, v] of Object.entries(answers)) {
    const head = k.split('_')[0] as CategoryKey;
    if (head in buckets) buckets[head] += Number(v || 0);
  }
  return buckets;
}

function chooseConstitution(
  scores: Record<CategoryKey, number>
): keyof typeof import('@prisma/client').Constitution | null {
  const arr = Object.entries(scores) as [CategoryKey, number][];
  arr.sort((a, b) => b[1] - a[1]);

  const [topKey, topScore] = arr[0];
  const second = arr[1]?.[1] ?? 0;

  const gapOk = topScore - second >= 2;
  if (!gapOk && topScore < 6) return 'BALANCED';

  return CATEGORIES[topKey] as any;
}

async function getUserIdFromSessionOrBody(bodyUserId?: string) {
  try {
    const s = await verifySession();
    if (s?.uid) return String(s.uid);
  } catch {
    // ignore invalid token and fall back to body
  }
  if (bodyUserId) return bodyUserId;
  return '';
}

export async function GET() {
  try {
    const userId = await getUserIdFromSessionOrBody(undefined);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      select: {
        id: true,
        constitution: true,
        scores: true,
        createdAt: true,
        questionnaireVersion: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assessments);
  } catch (err: any) {
    console.error('[assessment:GET]', err);
    return NextResponse.json(
      { message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IncomingBody;
    if (!body?.answers || typeof body.answers !== 'object') {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const userId = await getUserIdFromSessionOrBody(body.userId);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const scores = computeScores(body.answers);
    const constitution = chooseConstitution(scores);

    const created = await prisma.assessment.create({
      data: {
        userId,
        answers: body.answers,
        scores,
        constitution: constitution ?? null,
        questionnaireVersion: body.questionnaireVersion ?? 1,
      },
      select: { id: true, constitution: true, scores: true, createdAt: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('[assessment:POST]', err);
    return NextResponse.json(
      { message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
