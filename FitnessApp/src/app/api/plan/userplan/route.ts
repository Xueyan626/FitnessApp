// src/app/api/plan/userplan/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    console.log("=== Fetching user plans ===");

    const session = await verifySession();
    if (!session) {
      console.log("❌ No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User ID:", session.uid);

    const plans = await prisma.plan.findMany({
      where: { userId: session.uid },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        assessment: {
          select: {
            constitution: true,
          },
        },
      },
    });

    console.log(`✅ Found ${plans.length} plans for user ${session.uid}`);

    return NextResponse.json({ plans });
  } catch (err: any) {
    console.error("❌ Error fetching plans:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}