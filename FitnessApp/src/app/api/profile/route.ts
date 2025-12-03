import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { readSession } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

export async function GET() {
  const sess = await readSession<{ uid: string }>();
  if (!sess) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sess.uid },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      heightCm: true,
      weightKg: true,
      sex: true,
      birthDate: true,
      points: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}

const Body = z.object({
  name: z.string().min(1).max(50).optional().nullable(),
  heightCm: z.number().int().min(50).max(250).optional().nullable(),
  weightKg: z.number().int().min(20).max(400).optional().nullable(),
  sex: z.string().min(1).max(20).optional().nullable(),        
  birthDate: z.string().optional().nullable(),                 
});

export async function PUT(req: Request) {
  const sess = await readSession<{ uid: string }>();
  if (!sess) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = Body.parse(await req.json());
  const birthDate =
    data.birthDate ? new Date(data.birthDate as string) : null;

  const user = await prisma.user.update({
    where: { id: sess.uid },
    data: {
      name: data.name ?? undefined,
      heightCm: data.heightCm ?? undefined,
      weightKg: data.weightKg ?? undefined,
      sex: data.sex ?? undefined,
      birthDate: birthDate ?? undefined,
    },
    select: {
      id: true, email: true, name: true, role: true,
      heightCm: true, weightKg: true, sex: true, birthDate: true, points: true
    }
  });

  return NextResponse.json({ user });
}