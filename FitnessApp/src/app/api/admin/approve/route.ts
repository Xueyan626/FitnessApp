import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/admin/approve - Approve coach application
export async function POST(req: Request) {
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

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Update user coachStatus to APPROVED
    await prisma.user.update({
      where: { id: userId },
      data: { coachStatus: "APPROVED" }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin approve API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
