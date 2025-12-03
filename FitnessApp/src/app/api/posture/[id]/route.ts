import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posture = await prisma.postureAnalysis.findUnique({
      where: { id: params.id },
    });

    if (!posture) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (posture.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(posture);
  } catch (err) {
    console.error("Get posture error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}