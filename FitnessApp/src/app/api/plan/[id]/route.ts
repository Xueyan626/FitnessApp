// src/app/api/plan/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== Fetching plan by ID ===");
    console.log("Plan ID:", params.id);

    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", session.uid);

    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        assessment: {
          select: {
            constitution: true,
          },
        },
      },
    });

    if (!plan) {
      console.log("Plan not found");
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId !== session.uid) {
      console.log("User does not own this plan");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Plan found: Yes");
    console.log("Returning plan data");

    return NextResponse.json({
      id: plan.id,
      content: plan.content,
      createdAt: plan.createdAt,
      assessment: plan.assessment,
    });
  } catch (err: any) {
    console.error("Error fetching plan:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}