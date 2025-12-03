import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const sess = await readSession<{ uid: string }>();
  if (!sess) return NextResponse.json({ user: null }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: sess.uid },
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json({ user });
}