import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/admin/applications - Get coach applications
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true }
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Get users with COACH role and their status
    const applications = await prisma.user.findMany({
      where: { role: "COACH" },
      select: {
        id: true,
        email: true,
        name: true,
        coachStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("Admin applications API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
