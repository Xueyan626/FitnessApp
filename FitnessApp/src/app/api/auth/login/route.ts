import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";              
import { PrismaClient } from "@prisma/client";
import { signSession, setAuthCookie } from "@/lib/auth";

const prisma = new PrismaClient();

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

export async function POST(req: Request) {
  try {
    const { email, password } = Body.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    // Check if coach application is approved
    if (user.role === "COACH" && user.coachStatus !== "APPROVED") {
      if (user.coachStatus === "PENDING") {
        return NextResponse.json({ error: "Coach application is pending admin approval" }, { status: 403 });
      } else if (user.coachStatus === "REJECTED") {
        return NextResponse.json({ error: "Coach application was rejected" }, { status: 403 });
      }
    }

    const token = await signSession({ uid: user.id, email: user.email, role: user.role });
    await setAuthCookie(token);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e:any) {
    return NextResponse.json({ error: "invalid_request", detail: e.message }, { status: 400 });
  }
}