import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/coach/reports - Get all coach reports
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true }
    });

    if (user?.role !== "COACH") {
      return NextResponse.json({ error: "Access denied. Coach role required." }, { status: 403 });
    }

    const reports = await prisma.coachReport.findMany({
      where: { coachId: session.uid },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Coach reports GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/coach/reports - Create new coach report
export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true }
    });

    if (user?.role !== "COACH") {
      return NextResponse.json({ error: "Access denied. Coach role required." }, { status: 403 });
    }

    const { title, description, studentData, studentId } = await req.json();

    if (!title || !studentData) {
      return NextResponse.json({ error: "Title and student data are required" }, { status: 400 });
    }

    const report = await prisma.coachReport.create({
      data: {
        coachId: session.uid,
        studentId: studentId || null,
        title,
        description: description || null,
        studentData,
        status: "PENDING"
      }
    });

    return NextResponse.json({ 
      success: true, 
      report: {
        id: report.id,
        title: report.title,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (err) {
    console.error("Coach report creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
