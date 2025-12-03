import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/admin/users - Get all users
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        bronzeBadges: true,
        silverBadges: true,
        goldBadges: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Admin users API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
