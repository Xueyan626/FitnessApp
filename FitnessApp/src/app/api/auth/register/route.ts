import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";           
import { PrismaClient } from "@prisma/client";
import { signSession, setAuthCookie } from "@/lib/auth";

const prisma = new PrismaClient();

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["USER", "COACH"]).default("USER"),
});

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = Body.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists?.passwordHash) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        name: name ?? exists?.name ?? undefined, 
        passwordHash, 
        role,
        coachStatus: role === "COACH" ? "PENDING" : undefined
      },
      create: { 
        email, 
        name: name ?? email.split("@")[0], 
        passwordHash, 
        role,
        coachStatus: role === "COACH" ? "PENDING" : undefined
      },
      select: { id: true, email: true, name: true, role: true, coachStatus: true },
    });

    // Only auto-login for USER role, COACH needs admin approval
    if (role === "USER") {
      const token = await signSession({ uid: user.id, email: user.email, role: user.role });
      await setAuthCookie(token);
      return NextResponse.json({ user }, { status: 201 });
    } else {
      // For COACH, don't auto-login, just return success message
      return NextResponse.json({ 
        message: "Coach application submitted. Please wait for admin approval.",
        user: { id: user.id, email: user.email, name: user.name, role: user.role, coachStatus: user.coachStatus }
      }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: "invalid_request", detail: e.message }, { status: 400 });
  }
}