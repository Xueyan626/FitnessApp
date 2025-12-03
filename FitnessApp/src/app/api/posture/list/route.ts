// src/app/api/posture/list/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analyses = await prisma.postureAnalysis.findMany({
      where: { userId: session.uid },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        frontUrl: true,
        sideUrl: true,
        backUrl: true,
      },
    });

    return NextResponse.json({ analyses });
  } catch (err) {
    console.error("Get posture list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}